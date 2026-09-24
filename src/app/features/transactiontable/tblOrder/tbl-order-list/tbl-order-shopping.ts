import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../environments/environment.development';
import { TblDailyInventoryService } from '../../tblDailyInventory/services/tbl-daily-inventory';
// import { OrderCartLine, OrderShoppingRequest, OrderStockItem, OrderVendorOption } from './tbl-order-shopping.model';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { OrderCartLine, OrderShoppingRequest, OrderStockItem, OrderVendorOption } from '../models/tbl-order-shopping.model';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';

@Component({
  selector: 'app-tbl-order-shopping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-order-shopping.html',
  styleUrl: './tbl-order-shopping.css'
})

export class TblOrderShoppingComponent implements OnInit, OnChanges, OnDestroy {
  // Pass these from your authenticated customer/session and vendor selection API.
  @Input() customerId = 2;
  @Input() vendorOptions: OrderVendorOption[] = [
    {
      fldId: 1,
      fldDescription: 'Green Basket Vendor'
    }
  ];
  @Input() deliveryCharges = 0; // MUST be calculated/validated from vendor policy on server.
  @Input() deliveryEstimate = 'Confirm with vendor';

  vendorId = 1;
  orderOption: 'Current Day Order' | 'Advance Order' = 'Current Day Order';
  // fldOrderType: 'Self Pickup' | 'Regular Delivery' | 'Priority Delivery' | 'Advance Delivery';
  priceChangeOption: 'Auto Apply' | 'Get Confirmation' = 'Get Confirmation';
  requestedDeliveryDate = this.today();
  searchText = '';
  category = 'All';
  stock: OrderStockItem[] = [];
  cart: OrderCartLine[] = [];
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
  readonly imageBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');


  // Vendor profile.
  vendorProfile: TblProfile | null = null;
  fldOrderType: 'Self Pickup' | 'Normal Delivery' | 'Priority Delivery' | 'Advance Delivery' = 'Normal Delivery';

  constructor(private inventoryService: TblDailyInventoryService,
    private profileService: TblProfileService,
    private toastr: ToastrService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // Temporary configuration until Login is completed.
    this.customerId = 2;
    this.vendorId = 1;

    console.log('Customer ID:', this.customerId);
    console.log('Vendor ID:', this.vendorId);

    // if (this.vendorOptions.length === 1) this.vendorId = this.vendorOptions[0].fldId;
    // if (this.vendorId > 0) this.loadStock();

    this.loadStock();

    this.loadVendorProfile();
    this.loadCustomerProfile();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vendorOptions'] && this.vendorOptions.length === 1 && !this.vendorId) {
      this.vendorId = this.vendorOptions[0].fldId;
      this.loadStock();
    }
  }

  private today(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  changeVendor(nextId: number | string): void {
    const id = Number(nextId);
    if (id === this.vendorId) return;
    if (this.cart.length && !confirm('Changing vendor will clear your cart. Continue?')) return;
    this.vendorId = id;
    this.cart = [];
    this.stock = [];
    this.vendorProfile = null;
    this.deliveryCharges = 0;
    this.showCheckout = false;
    this.upiQrDataUrl = '';
    this.upiTransactionReference = '';
    this.loadStock();
    this.loadVendorProfile();
  }

  loadStock(): void {

    this.request?.unsubscribe();

    if (!this.vendorId) {
      this.stock = [];
      this.loading = false;
      return;
    }

    this.loading = true;

    this.request = this.inventoryService
      .getAvailableStockForOrder(this.vendorId)
      .subscribe({

        next: (items) => {

          console.log(
            'Original API Stock:',
            items
          );

          // Map API fields to shopping screen model.
          this.stock = items.map(item => {

            const apiItem = item as OrderStockItem & {
              fldCurrentStock?: number;
              fldFKItemMasterId?: number;
            };

            return {

              ...item,

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

          this.loading = false;

          console.table(
            this.stock.map(item => ({
              StockId: item.fldId,
              ItemName: item.fldItemName,
              AvailableStock: item.fldAvailableStock,
              SellingRate: item.fldSellingRate
            }))
          );

          this.cdr.detectChanges();

        },

        error: (err) => {

          this.loading = false;

          this.stock = [];

          console.error(
            'Unable to load stock:',
            err
          );

          this.toastr.error(
            'Unable to load available vegetables.'
          );

          this.cdr.detectChanges();

        }

      });

  }

  get categories(): string[] {
    return ['All', ...new Set(this.stock.map(x => x.fldCategoryName || 'Other'))];
  }

  get visibleStock(): OrderStockItem[] {
    const q = this.searchText.trim().toLowerCase();
    return this.stock.filter(x =>
      (this.category === 'All' || (x.fldCategoryName || 'Other') === this.category) &&
      (!q || [x.fldItemName, x.fldItemNameTamil || '', x.fldCategoryName || ''].some(s => s.toLowerCase().includes(q)))
    );
  }

  imageUrl(path?: string | null): string {
    if (!path) return '/images/no-image.png';
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.imageBaseUrl}${encodeURI(path.startsWith('/') ? path : '/' + path)}`;
  }

  step(item: OrderStockItem): number {
    return item.fldAllowFractionalQuantity ? (Number(item.fldMinOrderQuantityStep) || 0.1) : 1;
  }

  quantityFor(stockId: number): number {

    const line = this.cart.find(
      x => x.stock.fldId === stockId
    );

    return line?.quantity ?? 0;

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
    if (
      raw === '' ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {

      this.toastr.warning(
        'Enter a valid quantity.'
      );

      return;
    }

    // 2. Validate available stock.
    if (
      !Number.isFinite(availableStock) ||
      availableStock < 0
    ) {

      this.toastr.warning(
        'Available stock information is invalid.'
      );

      return;
    }

    if (quantity > availableStock) {

      this.toastr.warning(
        `Only ${availableStock} ${item.fldBaseUnit} ` +
        `available for ${item.fldItemName}.`
      );

      return;
    }

    // 3. Validate integer-only items.
    if (
      !item.fldAllowFractionalQuantity &&
      !Number.isInteger(quantity)
    ) {

      this.toastr.warning(
        `${item.fldItemName} allows whole-number quantities only.`
      );

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

      this.toastr.warning(
        `Quantity must be in multiples of ${step}.`
      );

      return;
    }

    // 5. Find the selected Daily Inventory record.
    if (!Number.isInteger(Number(item.fldId)) || Number(item.fldId) <= 0) {
      this.toastr.error('Missing Daily Inventory ID in stock API response.');
      return;
    }
    const existingIndex = this.cart.findIndex(
      line => line.stock.fldId === item.fldId
    );

    // 6. Quantity zero: remove only this vegetable.
    if (quantity === 0) {

      this.cart = this.cart.filter(
        line => line.stock.fldId !== item.fldId
      );

      void this.refreshUpiQr();
      this.cdr.detectChanges();

      return;
    }

    // 7. Prepare the updated cart line.
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

  // The + and - buttons always adjust by one base unit.
  adjust(item: OrderStockItem, direction: -1 | 1): void {
    const next = this.quantityFor(item.fldId) + direction;
    this.setQuantity(item, Math.max(0, next));
  }

  remove(stockId: number): void {
    this.cart = this.cart.filter(line => line.stock.fldId !== stockId);
    if (!this.cart.length) this.showCheckout = false;
    void this.refreshUpiQr();
    this.cdr.detectChanges();
  }

  lineTotal(line: OrderCartLine): number {
    return line.flatRupeeBookingValue > 0
      ? line.flatRupeeBookingValue
      : Math.round(line.quantity * Number(line.stock.fldSellingRate) * 100) / 100;
  }

  get subtotal(): number {
    return Math.round(this.cart.reduce((sum, line) => sum + this.lineTotal(line), 0) * 100) / 100;
  }

  get charge(): number {
    return this.fldOrderType === 'Self Pickup' ? 0 : Number(this.deliveryCharges) || 0;
  }

  get grandTotal(): number {
    return Math.round((this.subtotal + this.charge) * 100) / 100;
  }

  previewOrder(): void {
    if (!this.cart.length) return;
    if (this.orderOption === 'Advance Order' && this.requestedDeliveryDate < this.getTomorrowDate()) {
      this.toastr.warning('Select tomorrow or a later date for advance orders.');
      return;
    }
    this.showCheckout = true;
    if (!this.customerProfile && !this.customerLoading) this.loadCustomerProfile();
    void this.refreshUpiQr();
    this.cdr.detectChanges();
  }

  get requestPreview(): OrderShoppingRequest | null {

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
    return this.vendorProfile?.fldUPIId?.trim() || '';
  }

  get vendorUpiPayeeName(): string {
    return this.vendorProfile?.fldUPIPayeeName?.trim()
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
    this.request?.unsubscribe();
    this.profileRequest?.unsubscribe();
    this.customerRequest?.unsubscribe();
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

    const profile = this.vendorProfile;

    if (!profile) {

      this.deliveryCharges = 0;

      return;

    }

    // Self Pickup: Always free.
    if (this.fldOrderType === 'Self Pickup') {

      this.deliveryCharges = 0;

      return;

    }

    // Advance Delivery.
    if (this.orderOption === 'Advance Order') {

      this.deliveryCharges =
        Number(profile.fldADCharges ?? 0);

      return;

    }

    // Priority Delivery — Current Day only.
    if (this.fldOrderType === 'Priority Delivery') {

      this.deliveryCharges =
        Number(profile.fldPDCharges ?? 0);

      return;

    }

    // Regular Delivery.
    this.deliveryCharges =
      Number(profile.fldRDCharges ?? 0);

  }

  updateDeliveryEstimate(): void {

    const profile = this.vendorProfile;

    if (!profile) {

      this.deliveryEstimate = '';

      return;

    }

    if (this.orderOption === 'Advance Order') {

      this.deliveryEstimate =
        `Scheduled for ${this.requestedDeliveryDate}`;

      return;

    }

    if (this.fldOrderType === 'Self Pickup') {

      this.deliveryEstimate =
        'Pickup time will be confirmed by vendor';

      return;

    }

    if (this.fldOrderType === 'Priority Delivery') {

      this.deliveryEstimate =
        `Estimated delivery: ${profile.fldPDDuration ?? 'Confirm with vendor'}`;

      return;

    }

    this.deliveryEstimate =
      `Regular delivery starts at ${profile.fldRegularDeliveryStartTime ??
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

    // 8. Find this inventory record in the cart.
    if (!Number.isInteger(Number(item.fldId)) || Number(item.fldId) <= 0) {
      this.toastr.error('Missing Daily Inventory ID in stock API response.');
      return;
    }
    const existingIndex = this.cart.findIndex(
      line => line.stock.fldId === item.fldId
    );

    // 9. Amount zero: remove only this item.
    if (amount === 0) {

      this.cart = this.cart.filter(
        line => line.stock.fldId !== item.fldId
      );

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

}
