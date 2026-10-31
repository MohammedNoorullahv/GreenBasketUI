import { rankStock } from '../voice-advance/voice-item-match';
import { VoiceAdvanceComponent } from '../voice-advance/voice-advance.component';
import { MenuCaptionPipe as GbMenuCaptionPipe } from '../../../../shared/pipes/menu-caption.pipe';
import { TranslatePipe as GbPageTranslatePipe } from '@ngx-translate/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef, Component, HostListener, Input, OnDestroy,
  OnInit, PLATFORM_ID, Inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, map, finalize, timeout, forkJoin, of, catchError } from 'rxjs';
import * as QRCode from 'qrcode';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../environments/environment';
import { TblDailyInventoryService } from '../../tblDailyInventory/services/tbl-daily-inventory';
// import { OrderCartLine, OrderShoppingRequest, OrderStockItem, OrderVendorOption } from './tbl-order-shopping.model';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { OrderCartLine, OrderShoppingRequest, OrderStockItem, OrderVendorOption } from '../models/tbl-order-shopping.model';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';
import { TblOrderService } from '../services/tbl-order';
import { TblPendingOrderDto } from '../models/tbl-pending-order.model';
import { RouterLink } from '@angular/router';

// Extend the API order-header DTO/entity/PrintOrder response with these fields.
// The API must recompute these amounts from vendor policy before saving.
type OrderDeliveryRequest = Omit<OrderShoppingRequest, 'orderHeader'> & {
  orderHeader: OrderShoppingRequest['orderHeader'] & {
    fldOriginalDeliveryCharges: number;
    fldDeliverySavings: number;
  };
};

@Component({
  selector: 'app-tbl-order-shopping',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GbPageTranslatePipe, GbMenuCaptionPipe, VoiceAdvanceComponent],
  templateUrl: './tbl-order-shopping.html',
  styleUrl: './tbl-order-shopping.css'
})

export class TblOrderShoppingComponent implements OnInit, OnDestroy {
  // Pass these from your authenticated customer/session and vendor selection API.
  @Input() customerId = 0;
  @Input() vendorOptions: OrderVendorOption[] = [];
  @Input() deliveryCharges = 0; // MUST be calculated/validated from vendor policy on server.
  @Input() deliveryEstimate = 'Confirm with vendor';

  vendorId = 0;
  orderOption: 'Current Day Order' | 'Advance Order' = 'Current Day Order';
  // fldOrderType: 'Self Pickup' | 'Regular Delivery' | 'Priority Delivery' | 'Advance Delivery';
  priceChangeOption: 'Auto Apply' | 'Get Confirmation' = 'Get Confirmation';
  requestedDeliveryDate = this.today();
  searchText = '';
  category = 'All';
  // Grid shows image cards; list is a compact, no-image table-like view.
  viewMode: 'grid' | 'list' = 'grid';
  // 'all' lets the customer browse every vendor before the basket is locked.
  vendorFilter: number | 'all' = 'all';
  stock: OrderStockItem[] = [];
  cart: OrderCartLine[] = [];
  // Holds an attempted line while we ask the customer to replace their
  // current single-vendor basket.
  pendingVendorSwitch: { item: OrderStockItem; raw: number | string; mode: 'quantity' | 'flat' } | null = null;
  // Inline, per-item quantity validation messages keyed by stock id.
  quantityErrors: { [stockId: number]: string } = {};
  loading = false;
  showCheckout = false;
  private request?: Subscription;
  private profileRequest?: Subscription;
  private customerRequest?: Subscription;
  customerProfile: TblProfile | null = null;
  customerLoading = false;
  paymentMethod: 'COD' | 'UPI' = 'COD';
  upiTransactionReference = '';
  upiQrDataUrl = '';
  upiQrError = '';
  upiQrLoading = false;
  readonly imageBaseUrl = environment.apiBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  savingOrder = false;
  orderSaved = false;

  // Vendor profile.
  vendorProfile: TblProfile | null = null;
  fldOrderType: 'Self Pickup' | 'Normal Delivery' | 'Priority Delivery' | 'Advance Delivery' = 'Normal Delivery';

  userType = '';

  profileId = 0;

  profileName = '';

  get isAdmin(): boolean {
    return this.userType === 'Admin';
  }

  get isVendor(): boolean {
    return this.userType === 'Vendor';
  }

  get isCustomer(): boolean {
    return this.userType === 'Customer';
  }

  updatingOrderId = 0;

  constructor(private inventoryService: TblDailyInventoryService,
    private profileService: TblProfileService,
    private orderService: TblOrderService,
    private toastr: ToastrService, private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID)
    private platformId: object) { }

  addReviewedVoiceStock(rows: { item: OrderStockItem; quantity: number }[]): void {
    // Validate the entire batch, including the existing cart, before changing any line.
    const totals = new Map<number, { item: OrderStockItem; quantity: number }>();
    for (const row of rows) {
      const current = this.stock.find(x => x.fldId === row.item.fldId);
      if (!current) { this.toastr.warning('Stock changed. Refresh the list.'); return; }
      const existing = this.cart.find(x => x.stock.fldId === current.fldId);
      if (existing && existing.flatRupeeBookingValue > 0) {
        this.toastr.warning('This item uses amount booking in the cart. Review it manually before adding voice quantities.'); return;
      }
      const quantity = (totals.get(current.fldId)?.quantity ?? existing?.quantity ?? 0) + row.quantity;
      const step = this.step(current);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > current.fldAvailableStock ||
          (!current.fldAllowFractionalQuantity && !Number.isInteger(quantity)) ||
          Math.abs(quantity / step - Math.round(quantity / step)) > 1e-7) {
        this.toastr.warning('Combined cart quantity exceeds stock or does not match the item quantity step.'); return;
      }
      totals.set(current.fldId, { item: current, quantity });
    }

    // Voice input can mention products across vendors. A basket must stay
    // with one vendor, so reject the batch instead of silently dropping lines.
    const voiceVendorIds = new Set(
      Array.from(totals.values()).map(row => this.vendorIdFor(row.item))
    );

    if (voiceVendorIds.size > 1) {
      this.toastr.warning(
        'The voice order includes items from more than one vendor. Add items from one vendor at a time.'
      );
      return;
    }

    const voiceVendorId = voiceVendorIds.values().next().value as number | undefined;

    if (
      voiceVendorId &&
      this.cart.length &&
      this.cartVendorId !== voiceVendorId
    ) {
      this.toastr.warning(
        `Your basket is with ${this.cartVendorName}. Finish or start a new basket before adding items from another vendor.`
      );
      return;
    }

    for (const row of totals.values()) this.setQuantity(row.item, row.quantity);
    this.toastr.info('Voice quantities added. Review the cart and select delivery before saving.');
  }

  ngOnInit(): void {

    // Never create the "unable to identify user" toast during server-side
    // rendering / prerendering: it would be serialized into the page and shown
    // after hydration even when a valid profile exists in sessionStorage.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Compact list is the default on phones so more items fit on one screen.
    if (window.matchMedia('(max-width: 640px)').matches) {
      this.viewMode = 'list';
    }

    const profileLoaded =
      this.loadLoggedInProfile();

    if (!profileLoaded) {

      this.toastr.error(
        'Unable to identify logged-in user.'
      );

      return;
    }

    console.log(
      'Logged-in Profile:',
      {
        profileId: this.profileId,
        profileName: this.profileName,
        userType: this.userType
      }
    );

    if (this.isCustomer) {

      this.customerId = this.profileId;

      this.checkPendingOrders();

      return;
    }

    if (this.isVendor) {

      this.vendorId = this.profileId;

      this.checkPendingOrders();

      return;
    }

    if (this.isAdmin) {

      this.checkPendingOrders();

      return;
    }
  }

  private today(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  /**
   * Product-first shopping.
   *
   * The catalogue is built from every active vendor so the customer can pick
   * products immediately. The vendor is locked only when the first line is
   * added to the basket, and the basket never contains more than one vendor.
   */
  loadCatalog(): void {

    this.request?.unsubscribe();

    this.stock = [];
    this.loading = true;

    const vendors = this.vendorOptions;

    if (!vendors.length) {
      this.loading = false;
      return;
    }

    let failedVendors = 0;

    const requests = vendors.map(vendor =>
      this.inventoryService
        .getAvailableStockForOrder(vendor.fldId)
        .pipe(
          map(items => this.mapStockItems(items, vendor.fldId)),
          catchError(err => {
            failedVendors++;
            console.error(
              `Unable to load stock for vendor ${vendor.fldId}:`,
              err
            );
            return of([] as OrderStockItem[]);
          })
        )
    );

    this.request = forkJoin(requests)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({

        next: (groups) => {

          this.stock = groups.flat();

          // A filter can outlive a refresh. Fall back to a state that is
          // guaranteed to show products.
          if (this.category !== 'All' && !this.categories.includes(this.category)) {
            this.category = 'All';
          }

          if (
            this.vendorFilter !== 'all' &&
            !this.vendorOptions.some(vendor => vendor.fldId === this.vendorFilter)
          ) {
            this.vendorFilter = 'all';
          }

          if (failedVendors > 0 && failedVendors < vendors.length) {
            this.toastr.warning(
              'Some vendor catalogues could not be loaded. Refresh to see every product.'
            );
          }

          this.cdr.detectChanges();

        },

        error: (err) => {

          this.stock = [];

          console.error(
            'Unable to load stock:',
            err
          );

          this.toastr.error(
            'Unable to load available vegetables.'
          );

        }

      });

  }

  private mapStockItems(items: OrderStockItem[], vendorId: number): OrderStockItem[] {

    return (items ?? []).map(item => {

      const apiItem = item as OrderStockItem & {
        fldCurrentStock?: number;
        fldFKItemMasterId?: number;
      };

      return {

        ...item,

        // The catalogue is merged across vendors. Keep the owning vendor on
        // every product, even if an older API response omits it.
        fldFKVendorId: Number(item.fldFKVendorId ?? vendorId) || vendorId,

        // Actual available quantity returned by API.
        fldAvailableStock: Number(
          apiItem.fldCurrentStock ?? 0
        ),

        // Actual Item Master ID returned by API.
        fldFKItemId: Number(
          apiItem.fldFKItemMasterId ?? 0
        ),

        fldSellingRate: Number(
          item.fldSellingRate ?? 0
        )

      };

    }).filter(item =>

      item.fldIsActive === true &&

      item.fldIsAvailable === true &&

      item.fldAvailableStock > 0 &&

      item.fldSellingRate > 0

    );

  }

  get vendorScopedStock(): OrderStockItem[] {
    return this.vendorFilter === 'all'
      ? this.stock
      : this.stock.filter(item => Number(item.fldFKVendorId) === this.vendorFilter);
  }

  get categories(): string[] {
    return ['All', ...new Set(this.vendorScopedStock.map(x => x.fldCategoryName || 'Other'))];
  }

  get visibleStock(): OrderStockItem[] {
    const eligible = this.vendorScopedStock.filter(x =>
      this.category === 'All' || (x.fldCategoryName || 'Other') === this.category);
    return this.searchText.trim() ? rankStock(this.searchText, eligible, eligible.length) : eligible;
  }

  get cartVendorId(): number {
    const lineVendorId = Number(this.cart[0]?.stock.fldFKVendorId);
    return Number.isFinite(lineVendorId) && lineVendorId > 0 ? lineVendorId : this.vendorId;
  }

  get cartVendorName(): string {
    const id = this.cartVendorId;
    if (!id) return '';
    return this.vendorOptions.find(vendor => vendor.fldId === id)?.fldDescription || 'Local vendor';
  }

  get pendingVendorName(): string {
    return this.pendingVendorSwitch
      ? this.vendorNameFor(this.pendingVendorSwitch.item)
      : '';
  }

  get pendingItemName(): string {
    return this.pendingVendorSwitch?.item.fldItemName || '';
  }

  vendorNameFor(item: OrderStockItem): string {
    const vendorId = Number(item.fldFKVendorId);
    return this.vendorOptions.find(vendor => vendor.fldId === vendorId)?.fldDescription || 'Local vendor';
  }

  vendorStockCount(vendorId: number): number {
    return this.stock.filter(item => Number(item.fldFKVendorId) === vendorId).length;
  }

  setVendorFilter(filter: number | 'all'): void {
    // There is no "All vendors" button, so tapping the active vendor clears the filter.
    this.vendorFilter = filter !== 'all' && this.vendorFilter === filter ? 'all' : filter;
    if (this.category !== 'All' && !this.categories.includes(this.category)) {
      this.category = 'All';
    }
    this.clearHiddenQuantityErrors();
    this.cdr.detectChanges();
  }

  readonly imageFallbackUrl = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="#f1f5f0"/><path d="M18 56l16-19 11 12 8-9 12 16z" fill="#92ad91"/><circle cx="52" cy="26" r="7" fill="#92ad91"/></svg>'
  );

  private resolveItemImageUrl(imagePath?: string | null, isHouseImage = false): string {
    const raw = (imagePath || '').trim();
    if (!raw) return this.imageFallbackUrl;
    // Preserve complete Blob/SAS URLs, including their query strings.
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) {
      return this.imageFallbackUrl;
    }

    let path = raw.replace(/\\/g, '/').replace(/^\/+/, '');
    // Accept the API-relative path as well as legacy filename-only values.
    path = path.replace(/^api\/(?=uploads\/items\/)/i, '');
    if (!isHouseImage && !/^uploads\/items\//i.test(path)) path = 'uploads/items/' + path;
    const segments = path.split('/');
    try {
      path = segments.map(segment => {
        // Avoid double-encoding paths already encoded by the API.
        let decoded: string;
        try { decoded = decodeURIComponent(segment); } catch { decoded = segment; }
        if (decoded === '.' || decoded === '..' || /[\/\\]/.test(decoded)) {
          throw new Error('Invalid image path');
        }
        return encodeURIComponent(decoded);
      }).join('/');
    } catch {
      return this.imageFallbackUrl;
    }
    return `${this.imageBaseUrl}/${path}`;
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (image && image.getAttribute('src') !== this.imageFallbackUrl) {
      image.src = this.imageFallbackUrl;
    }
  }

  imageUrl(path?: string | null): string {
    return this.resolveItemImageUrl(path);
  }

  // Keep the existing API-relative house-image route separate from item images.
  houseImageUrl(path?: string | null): string {
    return this.resolveItemImageUrl(path, true);
  }

  step(item: OrderStockItem): number {
    return item.fldAllowFractionalQuantity ? (Number(item.fldMinOrderQuantityStep) || 0.1) : 1;
  }

  // Fractional items get a decimal keypad/input mode; all other items stay
  // whole-number only.
  quantityInputMode(item: OrderStockItem): 'decimal' | 'numeric' {
    return item.fldAllowFractionalQuantity ? 'decimal' : 'numeric';
  }

  onQuantityKeydown(event: KeyboardEvent, item: OrderStockItem): void {
    if (item.fldAllowFractionalQuantity) return;

    // A number input's step does not stop a decimal (or exponent) being
    // typed, so block those characters for whole-number items.
    if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onQuantityPaste(event: ClipboardEvent, item: OrderStockItem): void {
    if (item.fldAllowFractionalQuantity) return;

    const pasted = event.clipboardData?.getData('text')?.trim() ?? '';

    if (pasted && !/^\d+$/.test(pasted)) {
      event.preventDefault();
      this.setQuantityError(item, 'Use a whole-number quantity for this item.');
    }
  }

  quantityFor(stockId: number): number {

    const line = this.cart.find(
      x => x.stock.fldId === stockId
    );

    return line?.quantity ?? 0;

  }

  quantityErrorFor(item: OrderStockItem): string {
    return this.quantityErrors[item.fldId] ?? '';
  }

  hasQuantityError(item: OrderStockItem): boolean {
    return !!this.quantityErrorFor(item);
  }

  get hasQuantityErrors(): boolean {
    return Object.keys(this.quantityErrors).length > 0;
  }

  // Only errors on items that are actually in the cart should block checkout.
  // An invalid value for an item the customer never added is still shown
  // inline, but it does not prevent them from ordering the current basket.
  get hasBlockingQuantityErrors(): boolean {
    return this.cart.some(
      line => !!this.quantityErrors[line.stock.fldId]
    );
  }

  private setQuantityError(item: OrderStockItem, message: string): void {
    if (this.quantityErrors[item.fldId] === message) return;

    this.quantityErrors = {
      ...this.quantityErrors,
      [item.fldId]: message
    };
  }

  clearQuantityErrorById(stockId: number): void {
    if (!this.quantityErrors[stockId]) return;

    const next = { ...this.quantityErrors };
    delete next[stockId];
    this.quantityErrors = next;
  }

  clearQuantityError(item: OrderStockItem): void {
    this.clearQuantityErrorById(item.fldId);
  }

  // Filtering can hide a product entirely. Drop errors for items that are no
  // longer visible so they cannot block checkout from behind a filter, while
  // keeping errors on items that are still on screen.
  clearHiddenQuantityErrors(): void {
    if (!this.hasQuantityErrors) return;

    const visibleIds = new Set(
      this.visibleStock.map(item => item.fldId)
    );

    const next: { [stockId: number]: string } = {};

    for (const [stockId, message] of Object.entries(this.quantityErrors)) {
      const id = Number(stockId);

      if (visibleIds.has(id)) {
        next[id] = message;
      }
    }

    this.quantityErrors = next;
  }

  setCategory(category: string): void {
    this.category = category;
    this.clearHiddenQuantityErrors();
    this.cdr.detectChanges();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  // Immediate feedback while the customer is still typing.
  onQuantityInput(item: OrderStockItem, raw: number | string): void {
    const quantity = Number(raw);
    const availableStock = Number(item.fldAvailableStock);

    if (
      raw !== '' &&
      Number.isFinite(quantity) &&
      !item.fldAllowFractionalQuantity &&
      !Number.isInteger(quantity)
    ) {
      this.setQuantityError(item, 'Use a whole-number quantity for this item.');
      return;
    }

    if (
      raw !== '' &&
      Number.isFinite(quantity) &&
      Number.isFinite(availableStock) &&
      quantity > availableStock
    ) {
      this.setQuantityError(
        item,
        `Maximum ${this.formatQuantity(availableStock)} ${item.fldBaseUnit} available.`
      );
      return;
    }

    this.clearQuantityError(item);
  }

  private formatQuantity(value: number): string {
    return value.toLocaleString('en-IN', { maximumFractionDigits: 3 });
  }

  setQuantity(
    item: OrderStockItem,
    raw: number | string
  ): void {

    const quantity = Number(raw);

    const availableStock = Number(
      item.fldAvailableStock
    );

    // 1. Validate quantity.
    if (raw === '' || !Number.isFinite(quantity)) {

      this.setQuantityError(item, 'Enter a valid quantity.');

      return;
    }

    if (quantity < 0) {

      this.setQuantityError(item, 'Quantity cannot be negative.');

      return;
    }

    // 2. Validate available stock.
    if (
      !Number.isFinite(availableStock) ||
      availableStock < 0
    ) {

      this.setQuantityError(item, 'Available stock information is invalid.');

      return;
    }

    if (quantity > availableStock) {

      this.setQuantityError(
        item,
        `Maximum ${this.formatQuantity(availableStock)} ${item.fldBaseUnit} available.`
      );

      return;
    }

    // 3. Validate integer-only items.
    if (
      !item.fldAllowFractionalQuantity &&
      !Number.isInteger(quantity)
    ) {

      this.setQuantityError(item, 'Use a whole-number quantity for this item.');

      return;
    }

    // 4. Validate configured quantity step.
    const step = this.step(item);

    if (
      quantity > 0 &&
      (
        !Number.isFinite(step) ||
        step <= 0 ||
        Math.abs(
          quantity / step -
          Math.round(quantity / step)
        ) > 1e-7
      )
    ) {

      this.setQuantityError(
        item,
        `Quantity must be a multiple of ${this.formatQuantity(step)}.`
      );

      return;
    }

    // The value was accepted, so remove any previous inline error.
    this.clearQuantityError(item);

    // 5. Find the selected Daily Inventory record.
    if (!Number.isInteger(Number(item.fldId)) || Number(item.fldId) <= 0) {
      this.toastr.error('Missing Daily Inventory ID in stock API response.');
      return;
    }

    // 6. A basket can only contain products from one vendor. If the customer
    // adds an item from another vendor, ask before replacing the basket.
    const itemVendorId = this.vendorIdFor(item);

    if (
      quantity > 0 &&
      this.cart.length &&
      this.cartVendorId !== itemVendorId
    ) {
      this.pendingVendorSwitch = {
        item,
        raw,
        mode: 'quantity'
      };
      this.lockBackgroundScroll();
      this.cdr.detectChanges();
      return;
    }

    // The first product decides the vendor for the whole order.
    if (quantity > 0) {
      this.lockCartVendor(item);
    }

    const existingIndex = this.cart.findIndex(
      line => line.stock.fldId === item.fldId
    );

    // 7. Quantity zero: remove only this vegetable.
    if (quantity === 0) {

      this.cart = this.cart.filter(
        line => line.stock.fldId !== item.fldId
      );

      this.releaseCartVendorIfEmpty();
      void this.refreshUpiQr();
      this.cdr.detectChanges();

      return;
    }

    // 8. Prepare the updated cart line.
    const updatedLine: OrderCartLine = {

      stock: item,

      quantity: quantity,

      // Normal quantity booking.
      flatRupeeBookingValue: 0

    };

    // 8. Update existing item or append new item.
    if (existingIndex >= 0) {

      this.cart = this.cart.map(
        (line, index) =>
          index === existingIndex
            ? updatedLine
            : line
      );

    } else {

      this.cart = [
        ...this.cart,
        updatedLine
      ];

    }

    console.log(
      'Cart after quantity update:',
      this.cart
    );

    void this.refreshUpiQr();
    this.cdr.detectChanges();

  }

  // Move by the item's configured quantity step so fractional items can be
  // adjusted without typing a decimal value.
  adjust(item: OrderStockItem, direction: -1 | 1): void {
    const next = this.quantityFor(item.fldId) + direction * this.step(item);
    this.setQuantity(item, Math.max(0, Math.round(next * 1000) / 1000));
  }

  remove(stockId: number): void {
    this.cart = this.cart.filter(line => line.stock.fldId !== stockId);
    this.clearQuantityErrorById(stockId);
    this.releaseCartVendorIfEmpty();
    void this.refreshUpiQr();
    this.cdr.detectChanges();
  }

  private vendorIdFor(item: OrderStockItem): number {
    const id = Number(item.fldFKVendorId);
    return Number.isFinite(id) && id > 0 ? id : this.vendorId;
  }

  /**
   * Locks the basket to the product's vendor the first time an item is added.
   * Vendor-specific delivery rules are reloaded so a previous vendor's policy
   * can never leak into the new basket.
   */
  private lockCartVendor(item: OrderStockItem): void {
    const id = this.vendorIdFor(item);
    if (id <= 0 || this.vendorId === id) return;

    this.vendorId = id;
    this.vendorProfile = null;
    this.deliveryCharges = 0;
    this.orderOption = 'Current Day Order';
    this.fldOrderType = 'Normal Delivery';
    this.requestedDeliveryDate = this.today();
    this.priceChangeOption = 'Get Confirmation';
    this.upiQrDataUrl = '';
    this.upiTransactionReference = '';
    this.upiQrError = '';

    this.loadVendorProfile();
  }

  private releaseCartVendorIfEmpty(): void {
    if (this.cart.length) return;

    this.profileRequest?.unsubscribe();
    this.vendorId = 0;
    this.vendorProfile = null;
    this.deliveryCharges = 0;
    this.orderOption = 'Current Day Order';
    this.fldOrderType = 'Normal Delivery';
    this.requestedDeliveryDate = this.today();
    this.priceChangeOption = 'Get Confirmation';
    this.showCheckout = false;
    this.vendorFilter = 'all';

    if (this.category !== 'All' && !this.categories.includes(this.category)) {
      this.category = 'All';
    }

    this.upiQrDataUrl = '';
    this.upiTransactionReference = '';
    this.upiQrError = '';
    this.upiQrLoading = false;
  }

  startNewBasket(): void {
    this.cart = [];
    this.quantityErrors = {};
    this.pendingVendorSwitch = null;
    this.releaseCartVendorIfEmpty();
    void this.refreshUpiQr();
    this.cdr.detectChanges();
  }

  confirmVendorSwitch(): void {
    const pending = this.pendingVendorSwitch;
    if (!pending) return;

    this.pendingVendorSwitch = null;
    this.unlockBackgroundScroll();

    // Clear the old vendor's basket, then replay the customer's action.
    this.cart = [];
    this.quantityErrors = {};
    this.releaseCartVendorIfEmpty();

    if (pending.mode === 'flat') {
      this.setFlatValue(pending.item, pending.raw);
    } else {
      this.setQuantity(pending.item, pending.raw);
    }
  }

  cancelVendorSwitch(): void {
    if (!this.pendingVendorSwitch) return;
    this.pendingVendorSwitch = null;
    this.unlockBackgroundScroll();
    this.cdr.detectChanges();
  }

  scrollToDeliverySettings(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById('gbDeliverySettings')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  /** Returns to the shopping view so the delivery option (and charge) can be changed. */
  editDeliveryOptions(): void {
    this.showCheckout = false;
    this.cdr.detectChanges();
    this.scrollToDeliverySettings();
  }

  lineTotal(line: OrderCartLine): number {
    return line.flatRupeeBookingValue > 0
      ? line.flatRupeeBookingValue
      : Math.round(line.quantity * Number(line.stock.fldSellingRate) * 100) / 100;
  }

  get subtotal(): number {
    return Math.round(this.cart.reduce((sum, line) => sum + this.lineTotal(line), 0) * 100) / 100;
  }

  private moneyValue(value: unknown): number {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0;
  }

  private deliveryPriceLabel(value: unknown): string {
    const amount = this.moneyValue(value);
    return amount > 0 ? `₹${amount.toFixed(2)}` : 'Free';
  }

  get regularDeliveryPriceLabel(): string {
    return this.deliveryPriceLabel(this.vendorProfile?.fldvRDCharges);
  }

  get priorityDeliveryPriceLabel(): string {
    return this.deliveryPriceLabel(this.vendorProfile?.fldvPDCharges);
  }

  get advanceDeliveryPriceLabel(): string {
    return this.deliveryPriceLabel(this.vendorProfile?.fldvADCharges);
  }

  get deliveryPolicy(): { minimum: number; waiver: number; originalCharge: number } {
    const p = this.vendorProfile;
    if (!p || this.fldOrderType === 'Self Pickup') {
      return { minimum: 0, waiver: 0, originalCharge: 0 };
    }
    if (this.orderOption === 'Advance Order' || this.fldOrderType === 'Advance Delivery') {
      return { minimum: this.moneyValue(p.fldvADMinBillValue), waiver: this.moneyValue(p.fldvADChargesWaiverValue), originalCharge: this.moneyValue(p.fldvADCharges) };
    }
    if (this.fldOrderType === 'Priority Delivery') {
      return { minimum: this.moneyValue(p.fldvPDMinBillValue), waiver: this.moneyValue(p.fldvPDChargesWaiverValue), originalCharge: this.moneyValue(p.fldvPDCharges) };
    }
    return { minimum: this.moneyValue(p.fldvRDMinBillValue), waiver: this.moneyValue(p.fldvRDChargesWaiverValue), originalCharge: this.moneyValue(p.fldvRDCharges) };
  }

  get minimumOrderValue(): number { return this.deliveryPolicy.minimum; }
  get waiverOrderValue(): number { return this.deliveryPolicy.waiver; }
  get originalDeliveryCharge(): number { return this.deliveryPolicy.originalCharge; }
  get minimumOrderMet(): boolean {
    return !!this.vendorProfile && this.cart.length > 0 && this.subtotal >= this.minimumOrderValue;
  }
  get amountToMinimum(): number {
    return this.moneyValue(Math.max(0, this.minimumOrderValue - this.subtotal));
  }

  // Used by the progress indicator in the order settings and sticky cart bar.
  get minimumOrderProgress(): number {
    if (this.minimumOrderValue <= 0) {
      return 100;
    }
    if (this.cart.length === 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((this.subtotal / this.minimumOrderValue) * 100)));
  }
  get deliverySavings(): number {
    return this.cart.length > 0 && this.minimumOrderMet && this.waiverOrderValue > 0 &&
      this.subtotal >= this.waiverOrderValue ? this.originalDeliveryCharge : 0;
  }
  get amountToWaiver(): number {
    return this.moneyValue(Math.max(0, this.waiverOrderValue - this.subtotal));
  }
  get charge(): number {
    return this.moneyValue(this.originalDeliveryCharge - this.deliverySavings);
  }

  get grandTotal(): number {
    return Math.round((this.subtotal + this.charge) * 100) / 100;
  }

  previewOrder(): void {
    if (!this.cart.length) return;
    if (this.hasBlockingQuantityErrors) {
      this.toastr.warning('Correct the highlighted quantities before continuing.');
      return;
    }
    if (!this.vendorProfile) {
      this.toastr.warning('Vendor delivery settings are still loading. Please try again.');
      return;
    }
    if (!this.minimumOrderMet) {
      this.toastr.warning(
        `Minimum item value for this delivery option is ₹${this.minimumOrderValue.toFixed(2)}. ` +
        `Add ₹${this.amountToMinimum.toFixed(2)} more.`
      );
      return;
    }
    if (this.orderOption === 'Advance Order' && this.requestedDeliveryDate < this.getTomorrowDate()) {
      this.toastr.warning('Select tomorrow or a later date for advance orders.');
      return;
    }
    this.showCheckout = true;
    if (!this.customerProfile && !this.customerLoading) this.loadCustomerProfile();
    void this.refreshUpiQr();
    this.cdr.detectChanges();
  }

  get requestPreview(): OrderDeliveryRequest | null {

    if (
      this.customerId <= 0 ||
      this.vendorId <= 0 ||
      this.cart.length === 0
    ) {
      return null;
    }

    return {

      orderHeader: {

        fldFKCustomerId: this.customerId,

        fldFKVendorId: this.vendorId,

        fldOrderDate: this.today(),

        fldOrderOption: this.orderOption,

        fldRequestedDeliveryDate:
          this.orderOption === 'Advance Order'
            ? this.requestedDeliveryDate
            : this.today(),

        fldOrderType: this.fldOrderType,

        fldPriceChangeOption:
          this.orderOption === 'Advance Order'
            ? this.priceChangeOption
            : null,

        fldItemSubTotal: this.subtotal,

        fldOriginalDeliveryCharges: this.originalDeliveryCharge,
        fldDeliverySavings: this.deliverySavings,
        fldDeliveryCharges: this.charge,

        fldGrandTotal: this.grandTotal,

        fldOrderStatus: 'Pending',
        // Preview-only fields; extend the save DTO/API before persistence.
        fldPaymentMethod: this.paymentMethod,
        fldPaymentStatus: this.paymentMethod === 'COD' ? 'Pending Collection' : 'Pending Verification',
        fldUPITransactionReference: this.paymentMethod === 'UPI' ? this.upiTransactionReference.trim() || null : null,
        fldDeliveryAddress: this.customerAddress || null,
        fldHouseImagePath: this.customerProfile?.fldHouseImagePath || null

      },

      orderDetails: this.cart.map(line => ({

        fldFKItemId: line.stock.fldFKItemId,

        fldFKDailyInventoryId: line.stock.fldId,

        fldQuantity: line.quantity,

        fldUnit: line.stock.fldBaseUnit,

        fldRate: Number(
          line.stock.fldSellingRate
        ),

        fldFlatRupeeBookingValue:
          line.flatRupeeBookingValue,

        value: this.lineTotal(line)

      }))

    };

  }

  copyRequest(): void {
    if (!this.requestPreview) return;
    // Works on HTTPS/localhost. Console preview is available regardless.
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(JSON.stringify(this.requestPreview, null, 2))
        .then(() => this.toastr.success('Order JSON copied.'))
        .catch(() => this.toastr.warning('Copy unavailable; use console preview.'));
    }
  }

  loadCustomerProfile(): void {
    if (this.customerId <= 0) return;
    this.customerRequest?.unsubscribe();
    this.customerLoading = true;
    this.customerRequest = this.profileService.getTblProfileById(this.customerId).subscribe({
      next: (profile: TblProfile) => {
        this.customerProfile = profile;
        this.customerLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Unable to load customer profile', err);
        this.customerProfile = null;
        this.customerLoading = false;
        this.toastr.warning('Unable to load registered delivery address.');
        this.cdr.detectChanges();
      }
    });
  }

  get customerAddress(): string {
    const c = this.customerProfile;
    if (!c) return '';
    return [c.fldDoorNo, c.fldComplexOrBuildingName, c.fldStreetName]
      .filter(part => !!part?.trim()).join(', ');
  }

  get vendorUpiId(): string {
    return this.vendorProfile?.fldvUPIId?.trim() || '';
  }

  get vendorUpiPayeeName(): string {
    return this.vendorProfile?.fldvUPIPayeeName?.trim()
      || this.vendorProfile?.fldFullName?.trim() || '';
  }

  onPaymentMethodChange(): void {
    this.upiTransactionReference = '';
    void this.refreshUpiQr();
  }

  // QR encodes the vendor's UPI address and the CURRENT grand total.
  // It is a payment request, NOT confirmation of payment.
  async refreshUpiQr(): Promise<void> {
    this.upiQrDataUrl = '';
    this.upiQrError = '';
    if (!this.showCheckout || this.paymentMethod !== 'UPI') return;

    const upiId = this.vendorUpiId;
    const payeeName = this.vendorUpiPayeeName;
    const amount = this.grandTotal;
    if (!/^[\w.+-]+@[\w.-]+$/.test(upiId) || !payeeName) {
      this.upiQrError = 'Vendor UPI ID / payee name is not configured. Contact the vendor.';
      this.cdr.detectChanges();
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.upiQrError = 'The payable amount must be greater than zero.';
      this.cdr.detectChanges();
      return;
    }

    const payload = 'upi://pay?' + new URLSearchParams({
      pa: upiId, pn: payeeName, am: amount.toFixed(2), cu: 'INR'
    }).toString();
    this.upiQrLoading = true;
    try {
      const qr = await QRCode.toDataURL(payload, { width: 240, margin: 2 });
      // Avoid showing an outdated QR if vendor, method or amount changed mid-generation.
      if (this.showCheckout && this.paymentMethod === 'UPI'
        && upiId === this.vendorUpiId && amount === this.grandTotal) {
        this.upiQrDataUrl = qr;
      }
    } catch (err) {
      console.error('UPI QR generation failed', err);
      this.upiQrError = 'Unable to generate UPI QR code.';
    } finally {
      this.upiQrLoading = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.orderViewDestroyed = true;
    this.request?.unsubscribe();
    this.profileRequest?.unsubscribe();
    this.customerRequest?.unsubscribe();


    this.pendingOrderRequest?.unsubscribe();

    this.unlockBackgroundScroll();


  }

  loadVendorProfile(): void {

    if (this.vendorId <= 0) {
      return;
    }

    this.profileRequest?.unsubscribe();
    this.profileRequest = this.profileService
      .getTblProfileById(this.vendorId)
      .subscribe({

        next: (profile: TblProfile) => {

          this.vendorProfile = profile;

          this.calculateDeliveryCharges();

          this.updateDeliveryEstimate();
          void this.refreshUpiQr();
          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Unable to load vendor profile',
            err
          );

          this.vendorProfile = null;

          this.deliveryCharges = 0;

          this.toastr.error(
            'Unable to load vendor delivery information.'
          );

        }

      });

  }

  onOrderOptionChange(): void {

    if (this.orderOption === 'Advance Order') {

      // Priority Delivery is not permitted for Advance Order.
      this.fldOrderType = 'Advance Delivery';

      // Default requested date to tomorrow.
      const tomorrow = new Date();

      tomorrow.setDate(tomorrow.getDate() + 1);

      const localDate = new Date(
        tomorrow.getTime() -
        tomorrow.getTimezoneOffset() * 60000
      );

      this.requestedDeliveryDate =
        localDate.toISOString().slice(0, 10);

    } else {

      this.fldOrderType = 'Normal Delivery';

      this.requestedDeliveryDate = this.today();

    }

    this.calculateDeliveryCharges();

    this.updateDeliveryEstimate();
    void this.refreshUpiQr();

  }

  calculateDeliveryCharges(): void {
    // Original tariff is retained; payable charge/savings are derived from current cart.
    this.deliveryCharges = this.originalDeliveryCharge;
  }

  updateDeliveryEstimate(): void {

    const profile = this.vendorProfile;

    if (!profile) {

      this.deliveryEstimate = '';

      return;

    }

    if (this.orderOption === 'Advance Order') {

      const requested = new Date(`${this.requestedDeliveryDate}T00:00:00`);

      this.deliveryEstimate = Number.isNaN(requested.getTime())
        ? `Scheduled for ${this.requestedDeliveryDate}`
        : `Scheduled for ${requested.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}`;

      return;

    }

    if (this.fldOrderType === 'Self Pickup') {

      this.deliveryEstimate =
        'Pickup time will be confirmed by vendor';

      return;

    }

    if (this.fldOrderType === 'Priority Delivery') {

      this.deliveryEstimate =
        `Estimated delivery: ${profile.fldvPDDuration ?? 'Confirm with vendor'}`;

      return;

    }

    this.deliveryEstimate =
      `Regular delivery starts at ${profile.fldvRegularDeliveryStartTime ??
      'Time to be confirmed'
      }`;

  }

  onDeliveryTypeChange(): void {

    this.calculateDeliveryCharges();

    this.updateDeliveryEstimate();
    void this.refreshUpiQr();

  }

  getTomorrowDate(): string {

    const date = new Date();

    date.setDate(date.getDate() + 1);

    const localDate = new Date(
      date.getTime() -
      date.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 10);

  }

  flatValueFor(stockId: number): number {

    const line = this.cart.find(
      x => x.stock.fldId === stockId
    );

    return line?.flatRupeeBookingValue ?? 0;

  }

  setFlatValue(
    item: OrderStockItem,
    raw: number | string
  ): void {

    // 1. Read the entered rupee amount.
    const amount = Number(raw);

    const rate = Number(
      item.fldSellingRate
    );

    const availableStock = Number(
      item.fldAvailableStock
    );

    // 2. Validate entered amount.
    if (
      raw === '' ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {

      this.toastr.warning(
        'Enter a valid rupee value.'
      );

      return;
    }

    // 3. Validate selling rate.
    if (
      !Number.isFinite(rate) ||
      rate <= 0
    ) {

      this.toastr.warning(
        'Selling rate is not valid.'
      );

      return;
    }

    // 4. Validate available stock.
    if (
      !Number.isFinite(availableStock) ||
      availableStock < 0
    ) {

      this.toastr.warning(
        'Available stock information is invalid.'
      );

      return;
    }

    // 5. Calculate quantity equivalent.
    const quantity = amount / rate;

    // 6. Calculate maximum bookable value.
    const maximumValue =
      availableStock * rate;

    // 7. Prevent booking above available stock.
    if (
      amount > maximumValue + 0.000001
    ) {

      this.toastr.warning(
        `Only ₹${maximumValue.toFixed(2)} worth of ` +
        `${item.fldItemName} is available.`
      );

      return;
    }

    if (!Number.isInteger(Number(item.fldId)) || Number(item.fldId) <= 0) {
      this.toastr.error('Missing Daily Inventory ID in stock API response.');
      return;
    }

    // 8. Enforce the single-vendor basket rule before touching the cart.
    const itemVendorId = this.vendorIdFor(item);

    if (
      amount > 0 &&
      this.cart.length &&
      this.cartVendorId !== itemVendorId
    ) {
      this.pendingVendorSwitch = {
        item,
        raw,
        mode: 'flat'
      };
      this.lockBackgroundScroll();
      this.cdr.detectChanges();
      return;
    }

    if (amount > 0) {
      this.lockCartVendor(item);
    }

    const existingIndex = this.cart.findIndex(
      line => line.stock.fldId === item.fldId
    );

    // 9. Amount zero: remove only this item.
    if (amount === 0) {

      this.cart = this.cart.filter(
        line => line.stock.fldId !== item.fldId
      );

      this.releaseCartVendorIfEmpty();
      void this.refreshUpiQr();
      this.cdr.detectChanges();

      return;
    }

    // 10. Prepare the updated cart line.
    const updatedLine: OrderCartLine = {

      stock: item,

      quantity: quantity,

      // Flat rupee value booking.
      flatRupeeBookingValue: amount

    };

    // 11. Update existing item or append new item.
    if (existingIndex >= 0) {

      this.cart = this.cart.map(
        (line, index) =>
          index === existingIndex
            ? updatedLine
            : line
      );

    } else {

      this.cart = [
        ...this.cart,
        updatedLine
      ];

    }

    console.log('Cart after flat value update:', this.cart);
    void this.refreshUpiQr();
    this.cdr.detectChanges();

  }

  loadVendors(): void {

    this.profileService
      .getActiveLeanTblProfilesByUserType('Vendor')
      .subscribe({

        next: (vendors: TblProfile[]) => {

          this.vendorOptions = vendors
            .map(vendor => ({
              fldId: vendor.fldId,
              fldDescription: vendor.fldvVendorName?.trim() || 'Unnamed Vendor'
            }))
            .sort((a, b) => a.fldDescription.localeCompare(b.fldDescription));

          // Products come first: build one catalogue from every vendor.
          // No vendor is selected or locked until the customer adds an item.
          this.loadCatalog();

          this.cdr.detectChanges();

        },

        error: err => {

          console.error(
            'Unable to load vendors:',
            err
          );

          this.loading = false;

          this.toastr.error(
            'Unable to load vendor list.'
          );

        }

      });

  }

  saveOrder(): void {

    if (this.savingOrder) {
      return;
    }

    if (this.orderSaved) return;
    if (this.hasBlockingQuantityErrors) {
      this.toastr.warning('Correct the highlighted quantities before placing the order.');
      return;
    }
    if (!this.vendorProfile) {
      this.toastr.warning('Vendor delivery settings are not available. Please reload the vendor.');
      return;
    }
    if (!this.minimumOrderMet) {
      this.toastr.warning(`Minimum item value for this delivery option is ₹${this.minimumOrderValue.toFixed(2)}. Add ₹${this.amountToMinimum.toFixed(2)} more.`);
      return;
    }
    if (this.orderOption === 'Advance Order' && this.requestedDeliveryDate < this.getTomorrowDate()) {
      this.toastr.warning('Select tomorrow or a later date for advance orders.');
      return;
    }

    const payload = this.requestPreview;

    if (!payload) {

      this.toastr.warning(
        'Please select at least one vegetable.'
      );

      return;
    }

    if (this.vendorId <= 0) {

      this.toastr.warning(
        'Please select a vendor.'
      );

      return;
    }

    if (
      this.fldOrderType !== 'Self Pickup' &&
      !this.customerAddress
    ) {

      this.toastr.warning(
        'Customer delivery address is not available.'
      );

      return;
    }

    if (
      this.paymentMethod === 'UPI' &&
      !this.vendorUpiId
    ) {

      this.toastr.warning(
        'Vendor UPI information is not configured.'
      );

      return;
    }

    if (!confirm('Do you want to place this order?')) {
      return;
    }

    this.savingOrder = true;

    this.orderService
      .addTblOrderwithDetail(payload)
      .subscribe({

        next: () => {

          this.savingOrder = false;
          this.orderSaved = true;

          this.toastr.success(
            'Order placed successfully.'
          );

          console.log(
            'Saved Order:',
            payload
          );

          this.cdr.detectChanges();

        },

        error: err => {

          this.savingOrder = false;

          console.error(
            'Order save failed:',
            err
          );

          this.toastr.error(
            'Unable to place order. Please try again.'
          );

          this.cdr.detectChanges();

        }

      });

  }

  // =====================================================
  // CUSTOMER ORDER TRACKING
  // =====================================================

  pendingOrders: TblPendingOrderDto[] = [];

  checkingPendingOrders = false;

  pendingOrderLoadError = false;

  // Controls which screen is displayed.
  showPendingOrders = false;

  // Existing shopping screen should not load
  // until pending-order verification is complete.
  shoppingStarted = false;

  private pendingOrderRequest?: Subscription;
  private orderViewDestroyed = false;
  pendingOrderChecked = false;
  pendingOrderErrorMessage = '';

  private normalizePendingOrders(response: unknown): TblPendingOrderDto[] {
    if (response == null) return [];
    if (Array.isArray(response)) {
      if (response.some(order => order == null || typeof order !== 'object')) {
        throw new Error('The order service returned an invalid order list.');
      }
      return this.sortOrdersLatestFirst(response as TblPendingOrderDto[]);
    }
    if (typeof response === 'object' && 'message' in response) {
      const message = String(response.message ?? '').trim().toLowerCase().replace(/[.!]+$/, '');
      if (message === 'no records found' || message === 'no pending orders' || message === 'no orders found') return [];
    }
    throw new Error('The order service returned an unexpected response. Please try again.');
  }


  checkPendingOrders(): void {
    this.pendingOrderRequest?.unsubscribe();
    if (this.orderViewDestroyed) return;
    this.pendingOrderChecked = false;
    this.pendingOrderErrorMessage = '';
    this.pendingOrderLoadError = false;
    this.pendingOrders = [];
    this.selectedPendingOrder = null;
    this.showPendingOrders = false;
    this.shoppingStarted = false;

    if (this.profileId <= 0 || !this.userType) {
      this.checkingPendingOrders = false;
      this.pendingOrderLoadError = true;
      this.pendingOrderErrorMessage = 'Your session could not be identified. Please log in again.';
      this.cdr.detectChanges();
      return;
    }

    this.checkingPendingOrders = true;
    this.pendingOrderRequest = this.orderService
      .getTblPendingOrderBys(this.userType, this.profileId)
      .pipe(
        timeout({ first: 30000 }),
        // Process inside the stream so response/processing errors reach error().
        map((response: unknown) => this.normalizePendingOrders(response)),
        finalize(() => {
          this.checkingPendingOrders = false;
          if (!this.orderViewDestroyed) this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (orders: TblPendingOrderDto[]) => {
          this.pendingOrders = orders;
          this.pendingOrderChecked = true;
          this.pendingOrderLoadError = false;
          this.selectedPendingOrderIndex = 0;
          this.showPendingOrders = orders.length > 0;
          this.shoppingStarted = orders.length === 0 && this.isCustomer;
          if (this.shoppingStarted) this.loadVendors();
        },
        error: (error) => {
          console.error('Unable to load pending orders:', error);
          this.pendingOrderLoadError = true;
          this.pendingOrders = [];
          this.showPendingOrders = false;
          this.shoppingStarted = false;
          this.pendingOrderErrorMessage = error?.name === 'TimeoutError'
            ? 'Loading orders took too long. Please check your connection and try again.'
            : error?.status === 401
              ? 'Your session has expired. Please log in again.'
              : error?.status === 403
                ? 'You do not have permission to view these orders.'
                : 'Unable to load orders. Please check your connection and try again.';
        }
      });
  }

  // My Orders list must always display the most recent order first.
  private sortOrdersLatestFirst(
    orders: TblPendingOrderDto[]
  ): TblPendingOrderDto[] {

    return [...orders].sort((a, b) => {

      const timeDifference =
        this.orderTimestamp(b) - this.orderTimestamp(a);

      if (timeDifference !== 0) {
        return timeDifference;
      }

      // Fall back to the newest order id when timestamps match.
      return Number(b.fldOrderId ?? b.fldId ?? 0) -
        Number(a.fldOrderId ?? a.fldId ?? 0);

    });

  }

  private orderTimestamp(
    order: TblPendingOrderDto
  ): number {

    const candidates = [
      order.fldOrderGeneratedAt,
      order.fldOrderDate
    ];

    for (const value of candidates) {

      if (!value) {
        continue;
      }

      const time = new Date(value).getTime();

      if (Number.isFinite(time)) {
        return time;
      }

    }

    return 0;

  }

  backToMyOrders(): void {

    // Keep the in-progress cart in memory. Re-entering a new order resets it,
    // but this avoids losing a half-built basket if the customer is only
    // checking their order history.
    this.showCheckout = false;

    this.shoppingStarted = false;

    this.showPendingOrders = true;

    this.cdr.detectChanges();

  }

  viewMyOrdersAfterOrder(): void {

    // Refresh the order list so the order that was just placed appears.
    this.showCheckout = false;

    this.shoppingStarted = false;

    this.showPendingOrders = false;

    this.checkPendingOrders();

  }

  startNewOrder(): void {

    this.showPendingOrders = false;

    this.shoppingStarted = true;

    this.showCheckout = false;

    this.orderSaved = false;

    // Clear previous shopping selection.
    this.cart = [];

    this.stock = [];

    this.quantityErrors = {};

    this.vendorId = 0;

    this.vendorProfile = null;

    this.deliveryCharges = 0;

    this.vendorFilter = 'all';

    this.pendingVendorSwitch = null;

    this.searchText = '';

    this.category = 'All';

    this.orderOption = 'Current Day Order';

    this.fldOrderType = 'Normal Delivery';

    this.requestedDeliveryDate = this.today();

    // Load available vendors.
    this.loadVendors();

    // Load logged-in customer's
    // registered address and house image.
    this.loadCustomerProfile();

    this.cdr.detectChanges();

  }

  isStageCompleted(
    executedAt: string | null | undefined
  ): boolean {

    return !!executedAt;

  }

  getStageTime(
    executedAt: string | null | undefined
  ): string {

    if (!executedAt) {
      return 'Not yet completed';
    }

    return new Date(executedAt).toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );

  }

  // Highlights the next stage the order is waiting on.
  isActiveOrderStage(
    order: TblPendingOrderDto,
    index: number
  ): boolean {

    if (
      order.fldOrderStatus === 'Cancelled' ||
      order.fldOrderStatus === 'Denied'
    ) {
      return false;
    }

    const stageTimes = [
      order.fldOrderGeneratedAt,
      order.fldAcceptedAt,
      order.fldPackedAt,
      order.fldOutForDeliveryAt,
      order.fldDeliveredAt
    ];

    const nextIncompleteStage =
      stageTimes.findIndex(completedAt => !completedAt);

    return nextIncompleteStage === index;

  }

  selectedPendingOrder: TblPendingOrderDto | null = null;

  // Zero-based index of the order selected for viewing.
  selectedPendingOrderIndex = 0;

  viewPendingOrderDetails(
    order: TblPendingOrderDto,
    index: number
  ): void {

    this.selectedPendingOrder = order;

    this.selectedPendingOrderIndex = index;

    this.lockBackgroundScroll();

    this.cdr.detectChanges();

  }

  closePendingOrderDetails(): void {

    this.selectedPendingOrder = null;

    this.unlockBackgroundScroll();

    this.cdr.detectChanges();

  }

  private previousBodyOverflow = '';

  private lockBackgroundScroll(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

  }

  private unlockBackgroundScroll(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.body.style.overflow =
      this.previousBodyOverflow;

  }

  // Standard dialog behaviour: Escape closes the detail view.
  @HostListener('document:keydown.escape')
  onDialogEscape(): void {

    if (this.pendingVendorSwitch) {
      this.cancelVendorSwitch();
      return;
    }

    if (this.selectedPendingOrder) {
      this.closePendingOrderDetails();
    }

  }

  get selectedOrderPosition(): number {

    if (this.pendingOrders.length === 0) {
      return 0;
    }

    return this.selectedPendingOrderIndex + 1;

  }

  private loadLoggedInProfile(): boolean {

    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const storedProfile =
      sessionStorage.getItem('gbProfile');

    if (!storedProfile) {

      this.userType = '';
      this.profileId = 0;
      this.profileName = '';

      return false;
    }

    try {

      const profile =
        JSON.parse(storedProfile);

      this.profileId =
        Number(profile.fldId ?? 0);

      this.profileName =
        profile.fldFullName ?? '';

      this.userType =
        profile.fldUserType ?? '';

      return this.profileId > 0;

    }
    catch (error) {

      console.error(
        'Unable to read logged-in profile.',
        error
      );

      this.userType = '';
      this.profileId = 0;
      this.profileName = '';

      return false;
    }
  }

  loadVendorOrders(): void {

    console.log(
      'Loading Vendor Orders for Vendor ID:',
      this.profileId
    );

    // Vendor API integration will be added next.

  }

  loadAdminOrders(): void {

    console.log(
      'Loading all orders for Admin.'
    );

    // Admin API integration will be added next.

  }

  canDenyOrder(order: TblPendingOrderDto): boolean {

    return order.fldOrderStatus === 'Pending';

  }


  canUpdateOrderStatus(
    order: TblPendingOrderDto
  ): boolean {

    return [
      'Pending',
      'Accepted',
      'Packed',
      'Out for Delivery'
    ].includes(order.fldOrderStatus ?? '');

  }


  getNextStatusButtonText(
    order: TblPendingOrderDto
  ): string {

    switch (order.fldOrderStatus) {

      case 'Pending':
        return 'Accept Order';

      case 'Accepted':
        return 'Pack';

      case 'Packed':
        return 'Out for Delivery';

      case 'Out for Delivery':
        return 'Mark Delivered';

      default:
        return '';
    }
  }


  getNextOrderStatus(
    order: TblPendingOrderDto
  ): string | null {

    switch (order.fldOrderStatus) {

      case 'Pending':
        return 'Accepted';

      case 'Accepted':
        return 'Packed';

      case 'Packed':
        return 'Out for Delivery';

      case 'Out for Delivery':
        return 'Delivered';

      default:
        return null;
    }
  }

  updateToNextStatus(
    order: TblPendingOrderDto
  ): void {

    if (!this.isVendor) {
      return;
    }

    console.log("Updating Status");

    if (!order.fldOrderId) {

      console.error(
        'Order Id is missing:',
        order
      );

      this.toastr.error(
        'Order Id is not available.'
      );

      return;
    }

    const nextStatus =
      this.getNextOrderStatus(order);

    if (!nextStatus) {
      return;
    }

    // if (
    //   !confirm(
    //     `Update this order to "${nextStatus}"?`
    //   )
    // ) {
    //   return;
    // }

    console.log("Order Id", order.fldOrderId, "Next Status :", nextStatus)
    this.updatingOrderId =
      order.fldOrderId;

    this.orderService
      .updateOrderStatus(
        order.fldOrderId,
        nextStatus
      )
      .subscribe({

        next: () => {

          this.updatingOrderId = 0;

          this.toastr.success(
            `Order status updated to ${nextStatus}.`
          );

          this.checkPendingOrders();
        },

        error: (error) => {

          console.error(
            'Order status update failed:',
            error
          );

          this.updatingOrderId = 0;

          this.toastr.error(
            error.error?.message ??
            'Unable to update order status.'
          );

          this.cdr.detectChanges();
        }

      });
  }

}
