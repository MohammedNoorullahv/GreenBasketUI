import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment'; // Verify path in your project.
import { TblDailyInventoryService } from '../services/tbl-daily-inventory';

import { StockEntryItem, StockEntryRow, DailyStockEntrySaveRow, DailyStockEntrySaveRequest } from '../models/tblDailyInventoryforStockEntry.model';

@Component({
  selector: 'app-tbl-daily-inventory-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  private subscriptions = new Subscription();
  readonly imageBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  fldInventoryDate = Date;

  constructor(
    private inventoryService: TblDailyInventoryService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadStock();
    // this.fldInventoryDate = this.getTodayDate();
    console.log("Inventory Loaded");
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

            

            this.cdr.detectChanges();
          },
          error: err => {
            this.loading = false;
            
            this.toastr.error('Unable to load stock-entry items.');
          },
        })
    );
  }

  get visibleRows(): StockEntryRow[] {

    const q = this.searchText.trim().toLowerCase();

    return this.rows.filter(row =>

      // Display only rows marked as visible
      row.fldIsDisplay &&

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
          this.toastr.error(err?.error?.message || 'Unable to save daily stock.');
        },
      })
    );
  }

  imageUrl(row: StockEntryRow): string | null {
    if (!row.fldItemImagePath) return null;
    return `${this.imageBaseUrl}/${row.fldItemImagePath.replace(/^\/+/, '')}`;
  }

  trackByItemId(_index: number, row: StockEntryRow): number {
    return row.fldFKItemId;
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblDailyInventory');
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  getItemImageUrl(imagePath?: string | null): string {

    if (!imagePath) {
      return '/images/no-image.png';
    }

    // If API already returns a complete URL
    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

    const path = imagePath.startsWith('/')
      ? imagePath
      : `/${imagePath}`;


    console.log(
      'Generated Image URL:',
      `${environment.apiBaseUrl.replace(/\/$/, '')}/${imagePath?.replace(/^\//, '')}`
    );

    return `${baseUrl}${encodeURI(path)}`;
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
