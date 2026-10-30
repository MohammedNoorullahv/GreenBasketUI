import { MenuCaptionPipe as GbMenuCaptionPipe } from '../../../../shared/pipes/menu-caption.pipe';
import { TranslatePipe as GbPageTranslatePipe } from '@ngx-translate/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../../../../../environments/environment'; // Verify path in your project.
import { TblDailyInventoryService } from '../services/tbl-daily-inventory';
import { TblItemMasterService } from '../../../mastertables/tblItemMaster/services/tbl-item-master';

import { StockEntryItem, StockEntryRow, DailyStockEntrySaveRow, DailyStockEntrySaveRequest } from '../models/tblDailyInventoryforStockEntry.model';

@Component({
  selector: 'app-tbl-daily-inventory-add',
  standalone: true,
  imports: [CommonModule, FormsModule, GbPageTranslatePipe, GbMenuCaptionPipe],
  templateUrl: './tbl-daily-inventory-add.html',
  styleUrl: './tbl-daily-inventory-add.css',
})
export class TblDailyInventoryAddComponent implements OnInit, OnDestroy {
  inventoryDate = this.localToday();
  private loadedDate = this.inventoryDate;
  rows: StockEntryRow[] = [];
  loading = false;
  isSaving = false;
  searchText = '';
  showOnlyChanged = false;
  selectedCategory = '';
  selectedItemType = '';
  isMobileView = false;
  private mediaQuery: MediaQueryList | null = null;
  private readonly mobileBreakpointQuery = '(max-width: 767.98px)';
  private onMediaChange = (event: MediaQueryListEvent): void => {
    this.isMobileView = event.matches;
  };
  private subscriptions = new Subscription();
  // Stock API rows may not carry the item type; join it from item master by fldFKItemMasterId.
  private itemTypeById = new Map<number, string>();
  readonly imageBaseUrl = environment.apiBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  fldInventoryDate = Date;

  constructor(
    private inventoryService: TblDailyInventoryService,
    private itemMasterService: TblItemMasterService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && typeof window.matchMedia === 'function') {
      this.mediaQuery = window.matchMedia(this.mobileBreakpointQuery);
      this.isMobileView = this.mediaQuery.matches;
      this.mediaQuery.addEventListener('change', this.onMediaChange);
    }
    this.loadStock();
    this.loadItemTypes();
    // this.fldInventoryDate = this.getTodayDate();
    console.log("Inventory Loaded");
  }

  private loadItemTypes(): void {
    this.subscriptions.add(
      this.itemMasterService.getActiveTblItemMasters().subscribe({
        next: items => {
          this.itemTypeById = new Map(
            items.map(item => [item.fldId, (item.fldItemType || '').trim()])
          );
          if (this.selectedItemType && !this.itemTypes.some(t => t.name === this.selectedItemType)) {
            this.selectedItemType = '';
          }
          this.cdr.detectChanges();
        },
        error: err => {
          // Without the lookup the dropdown simply stays hidden; stock entry keeps working.
          console.warn('Item type lookup unavailable', err);
        },
      })
    );
  }

  private localToday(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  onDateChange(): void {
    if (this.changedCount > 0 && !confirm('Discard unsaved stock changes?')) {
      this.inventoryDate = this.loadedDate;
      return;
    }
    this.loadStock();
  }

  loadStock(): void {
    this.loading = true;
    this.rows = [];
    this.subscriptions.add(
      this.inventoryService.getAllTblDailyInventoryforStockEntry(this.inventoryDate)
        .subscribe({
          next: (items: StockEntryItem[]) => {
           
            this.rows = items
              .filter(x => x.fldIsActive)
              .map((item): StockEntryRow => {

                const availableStock = Number(item.fldAvailableStock ?? 0);
                const newStock = Number(item.fldNewStock ?? 0);
                const sellingRate = Number(item.fldSellingRate ?? 0);

                const currentStock = availableStock + newStock;
                const isAvailable = currentStock > 0;

                return {
                  ...item,

                  fldFKItemMasterId: item.fldFKItemMasterId,

                  fldIsDisplay: item.fldIsDisplay,
                  fldIsAddMore: item.fldIsAddMore,

                  fldAvailableStock: availableStock,
                  fldNewStock: newStock,
                  fldCurrentStock: currentStock,
                  fldSellingRate: sellingRate,
                  fldIsAvailable: isAvailable,

                  // Existing tracking properties
                  quantityEdited: false,
                  rateEdited: false,
                  availabilityEdited: false,

                  // Missing properties required by StockEntryRow
                  isChanged: false,
                  originalSellingRate: sellingRate,
                  originalNewStock: newStock,
                  originalIsAvailable: isAvailable
                };

              });

            

            this.loadedDate = this.inventoryDate;
            this.loading = false;

            // Drop the category selection if it no longer exists for this date.
            if (this.selectedCategory &&
              !this.rows.some(r => r.fldIsDisplay && this.categoryNameOf(r) === this.selectedCategory)) {
              this.selectedCategory = '';
            }

            // Drop the item type selection if it no longer exists within the category.
            if (this.selectedItemType && !this.itemTypes.some(t => t.name === this.selectedItemType)) {
              this.selectedItemType = '';
            }

            this.cdr.detectChanges();
          },
          error: err => {
            this.loading = false;

            this.cdr.detectChanges();

            this.toastr.error('Unable to load stock-entry items.');
          },
        })
    );
  }

  private categoryNameOf(row: StockEntryRow): string {
    return (row.fldCategoryName || '').trim();
  }

  private typeNameOf(row: StockEntryRow): string {
    const direct = (row.fldType || row.fldItemType || '').trim();
    if (direct) return direct;
    return this.itemTypeById.get(row.fldFKItemMasterId) ?? '';
  }

  get categories(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const row of this.rows) {
      if (!row.fldIsDisplay) continue;
      const name = this.categoryNameOf(row);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }

  setCategory(name: string): void {
    this.selectedCategory = name;
    // Reset the cascaded item type filter if it does not exist in the new category.
    if (this.selectedItemType && !this.itemTypes.some(t => t.name === this.selectedItemType)) {
      this.selectedItemType = '';
    }
  }

  setItemType(name: string): void {
    this.selectedItemType = name;
  }

  get itemTypes(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const row of this.rows) {
      if (!row.fldIsDisplay) continue;
      if (this.selectedCategory && this.categoryNameOf(row) !== this.selectedCategory) continue;
      const name = this.typeNameOf(row);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }

  get itemTypeScopeCount(): number {
    return this.rows.filter(r =>
      r.fldIsDisplay &&
      (!this.selectedCategory || this.categoryNameOf(r) === this.selectedCategory)
    ).length;
  }

  get displayedCount(): number {
    return this.rows.filter(r => r.fldIsDisplay).length;
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.selectedItemType = '';
  }

  get visibleRows(): StockEntryRow[] {

    const q = this.searchText.trim().toLowerCase();

    return this.rows.filter(row =>

      // Display only rows marked as visible
      row.fldIsDisplay &&

      // Category filter (chip bar)
      (!this.selectedCategory || this.categoryNameOf(row) === this.selectedCategory) &&

      // Item type filter (cascades from the selected category)
      (!this.selectedItemType || this.typeNameOf(row) === this.selectedItemType) &&

      // Existing Changed Only filter
      (!this.showOnlyChanged || this.isChanged(row)) &&

      // Existing search filter
      (!q || [
        row.fldItemName,
        row.fldItemNameTamil ?? '',
        row.fldItemNameUrdu ?? '',
        row.fldCategoryName
      ].some(text => text.toLowerCase().includes(q)))

    );

  }

  isChanged(row: StockEntryRow): boolean {
    return row.quantityEdited || row.rateEdited || row.availabilityEdited;
  }

  get changedCount(): number { return this.rows.filter(r => this.isChanged(r)).length; }

  quantityChanged(row: StockEntryRow): void {
    row.quantityEdited = true;
    row.fldCurrentStock = (Number(row.fldAvailableStock) || 0) + (Number(row.fldNewStock) || 0);
    if (!row.availabilityEdited) {
      row.fldIsAvailable = row.fldCurrentStock > 0;
    }
  }

  rateChanged(row: StockEntryRow): void { row.rateEdited = true; }

  availabilityChanged(row: StockEntryRow): void { row.availabilityEdited = true; }

  stockStep(row: StockEntryRow): number {
    return row.fldAllowFractionalQuantity ? (row.fldMinOrderQuantityStep || 0.1) : 1;
  }

  isEnteredToday(row: StockEntryRow): boolean {
    return (Number(row.fldNewStock) || 0) > 0;
  }

  incrementStock(row: StockEntryRow): void {
    const step = this.stockStep(row) || 1;
    row.fldNewStock = this.roundToStep((Number(row.fldNewStock) || 0) + step);
    this.quantityChanged(row);
  }

  decrementStock(row: StockEntryRow): void {
    const step = this.stockStep(row) || 1;
    row.fldNewStock = this.roundToStep(Math.max(0, (Number(row.fldNewStock) || 0) - step));
    this.quantityChanged(row);
  }

  private roundToStep(value: number): number {
    return Math.round(value * 1000) / 1000;
  }

  private invalidRow(row: StockEntryRow): string | null {
    const qty = Number(row.fldNewStock);
    const rate = Number(row.fldSellingRate);
    const step = this.stockStep(row);
    if (!Number.isFinite(qty) || qty < 0) return `${row.fldItemName}: stock must be zero or greater.`;
    if (!row.fldAllowFractionalQuantity && !Number.isInteger(qty)) {
      return `${row.fldItemName}: stock must be a whole number.`;
    }
    const multiple = qty / step;
    if (qty > 0 && Math.abs(multiple - Math.round(multiple)) > 1e-7) {
      return `${row.fldItemName}: quantity must be in steps of ${step}.`;
    }
    if (row.fldSellingRate === null || !Number.isFinite(rate) || rate <= 0) {
      return `${row.fldItemName}: enter a selling rate greater than zero.`;
    }
    return null;
  }

  save(closeAfterSave: boolean): void {
    if (this.isSaving || this.loading) return;
    const changed = this.rows.filter(r => this.isChanged(r));
    if (!changed.length) {
      this.toastr.warning('Enter stock or change a rate/availability before saving.');
      return;
    }
    for (const row of changed) {
      const error = this.invalidRow(row);
      if (error) { this.toastr.warning(error); return; }
    }
    const payload: DailyStockEntrySaveRequest = {
      fldInventoryDate: this.inventoryDate,
      items: changed.map(row => ({
        ...row,

        fldFKItemMasterId: row.fldFKItemMasterId,
        fldNewStock: Number(row.fldNewStock),
        fldSellingRate: Number(row.fldSellingRate),
        fldIsAvailable: row.fldIsAvailable,
      })),
    };
    this.isSaving = true;

    this.subscriptions.add(
      this.inventoryService.saveDailyStockEntry(payload).subscribe({
        next: () => {
          this.isSaving = false;

          this.cdr.detectChanges();

          this.toastr.success(`${changed.length} item(s) saved successfully.`);
          if (closeAfterSave) {
            this.backToHome();
          } else {
            // Re-read from server to avoid adding saved quantities twice.
            this.loadStock();
          }
        },
        error: err => {
          this.isSaving = false;
          console.error('Stock entry save failed', err);

          this.cdr.detectChanges();

          this.toastr.error(err?.error?.message || 'Unable to save daily stock.');
        },
      })
    );
  }

  imageUrl(row: StockEntryRow): string | null {
    return this.resolveItemImageUrl(row.fldItemImagePath);
  }

  trackByItemId(_index: number, row: StockEntryRow): number {
    return row.fldFKItemId;
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblDailyInventory');
  }

  ngOnDestroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.onMediaChange);
      this.mediaQuery = null;
    }
    this.subscriptions.unsubscribe();
  }

  readonly imageFallbackUrl = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="8" fill="#f1f5f0"/><path d="M18 56l16-19 11 12 8-9 12 16z" fill="#92ad91"/><circle cx="52" cy="26" r="7" fill="#92ad91"/></svg>'
  );

  private resolveItemImageUrl(imagePath?: string | null): string {
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
    if (!/^uploads\/items\//i.test(path)) path = 'uploads/items/' + path;
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

  getItemImageUrl(imagePath?: string | null): string {
    return this.resolveItemImageUrl(imagePath);
  }

  trackByStockRow(
    index: number,
    row: StockEntryRow
  ): string {
    return `${row.fldFKItemMasterId}-${row.fldSubSlNo}`;
  }

  addMoreStockRow(currentRow: StockEntryRow): void {

    // Step 1: Check whether both quantity and rate are zero.
    const quantity = Number(currentRow.fldNewStock) || 0;
    const rate = Number(currentRow.fldSellingRate) || 0;

    if (quantity === 0 && rate === 0) {

      const confirmed = window.confirm(
        `You have not entered the quantity and selling rate for ` +
        `${currentRow.fldItemName}.\n\n` +
        `Do you still want to add another stock entry?`
      );

      // If user clicks Cancel, do nothing.
      if (!confirmed) {
        return;
      }
    }

    // Step 2: Find the next hidden row for the same vegetable.
    const nextRow = this.rows
      .filter(row =>
        row.fldFKItemMasterId === currentRow.fldFKItemMasterId &&
        row.fldSubSlNo > currentRow.fldSubSlNo &&
        !row.fldIsDisplay
      )
      .sort((a, b) => a.fldSubSlNo - b.fldSubSlNo)[0];

    if (!nextRow) {
      this.toastr.warning(
        `No additional row available for ${currentRow.fldItemName}.`
      );
      return;
    }

    // Step 3: Hide + on the current row.
    currentRow.fldIsAddMore = false;

    // Step 4: Display the next row.
    nextRow.fldIsDisplay = true;

    // Step 5: Show + on the new row only if another hidden row exists.
    nextRow.fldIsAddMore = this.rows.some(row =>
      row.fldFKItemMasterId === currentRow.fldFKItemMasterId &&
      row.fldSubSlNo > nextRow.fldSubSlNo &&
      !row.fldIsDisplay
    );

    this.cdr.detectChanges();
  }


}
