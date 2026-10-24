import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblDailyInventory } from '../models/tblDailyInventory.model';
import { TblDailyInventoryUpdate } from '../models/tblDailyInventory-Update.model';
import { TblDailyInventoryService } from '../services/tbl-daily-inventory';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Console } from 'node:console';

@Component({
  selector: 'app-tbl-daily-inventory-list',
  imports: [AsyncPipe, CommonModule, RouterLink, FormsModule, ColumnFilterPipe, ColumnFilterIconComponent, ConfirmDialogComponent],
  templateUrl: './tbl-daily-inventory-list.html',
  styleUrl: './tbl-daily-inventory-list.css',
})

export class TblDailyInventoryListComponent implements OnInit {
  tblDailyInventory$?: Observable<TblDailyInventory[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Active Only'; // default to Load All
  filters: Record<string, string> = {};
  isAdmin: boolean = false;

  removeMultipleItems: boolean = false;

  selectedInventoryIds: number[] = [];

  @ViewChild('deleteDialog') deleteDialog!: ConfirmDialogComponent;

  deleteTargetLabel = '';
  private pendingDeleteRequest?: TblDailyInventoryUpdate;

  constructor(private tblDailyInventoryService: TblDailyInventoryService,
    private toastr: ToastrService) {
  }

  ngOnInit(): void {
    const storedProfile =
      sessionStorage.getItem('gbProfile');

    if (storedProfile) {

      const loggedInProfile =
        JSON.parse(storedProfile);

      this.isAdmin =
        loggedInProfile.fldUserType === 'Admin';
    }



    this.actionType = 'Active Only';
    this.tblDailyInventory$ = this.tblDailyInventoryService.getActiveLeanTblDailyInventorys();
  }

  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = "Load All";
      this.tblDailyInventory$ = this.tblDailyInventoryService.getAllTblDailyInventorys();
    }
    else {
      this.actionType = "Active Only";
      this.tblDailyInventory$ = this.tblDailyInventoryService.getActiveTblDailyInventorys();
    }
  }

  onRemoveMultipleChange(): void {

    // Clear previous selections whenever mode changes
    this.selectedInventoryIds = [];
  }

  onInventorySelectionChange(
    inventoryId: number,
    checked: boolean
  ): void {

    if (checked) {

      if (!this.selectedInventoryIds.includes(inventoryId)) {
        this.selectedInventoryIds.push(inventoryId);
      }

    } else {

      this.selectedInventoryIds =
        this.selectedInventoryIds.filter(
          id => id !== inventoryId
        );
    }
  }


  isInventorySelected(
    inventoryId: number
  ): boolean {

    return this.selectedInventoryIds.includes(
      inventoryId
    );
  }


  removeSelectedItems(): void {

    if (this.selectedInventoryIds.length === 0) {

      this.toastr.warning(
        'Please select at least one item to remove.'
      );

      return;
    }

    this.tblDailyInventoryService
      .removeTblDailyInventory(this.selectedInventoryIds)
      .subscribe({
        next: () => {
          console.log("01. Removed");
          
          this.toastr.success(
            'Selected items removed successfully.',
            'Success'
          );

          // Clear selected IDs
          this.selectedInventoryIds = [];

          // Exit multiple-remove mode
          this.removeMultipleItems = false;

          // Reload the grid
          console.log("02. Load Active Only");
          this.actionType = "Active Only";
          this.OnFormSubmit(this.actionType);
        },

        error: (err) => {

          console.error(
            'Remove Daily Inventory Error:',
            err
          );

          const errorMsg =
            err?.error?.message ||
            err?.error ||
            'Unable to remove selected items.';

          this.toastr.error(
            errorMsg,
            'Error'
          );
        }

      });
  }

  /** Opens the delete confirmation dialog from the row delete icon only. */
  askDelete(inventory: TblDailyInventory): void {
    this.deleteTargetLabel = inventory.fldItemName || `record #${inventory.fldId}`;
    this.pendingDeleteRequest = {
      fldId: inventory.fldId,
      fldFKVendorId: inventory.fldFKVendorId ?? 0,
      fldFKItemId: inventory.fldFKItemId ?? 0,
      fldItemName: inventory.fldItemName ?? '',
      fldBaseUnit: inventory.fldBaseUnit ?? '',
      fldInventoryDate: inventory.fldInventoryDate ?? new Date(),
      fldSellingRate: inventory.fldSellingRate ?? 0,
      fldAvailableStock: inventory.fldAvailableStock ?? 0,
      fldInitialStock: inventory.fldInitialStock ?? 0,
      fldIsAvailable: inventory.fldIsAvailable ?? true,
      fldIsActive: inventory.fldIsActive ?? true,
      fldCreatedBy: inventory.fldCreatedBy ?? 0,
      fldCreatedDt: inventory.fldCreatedDt ?? new Date(),
      fldModifiedBy: inventory.fldModifiedBy ?? 0,
      fldModifiedDt: inventory.fldModifiedDt ?? new Date(),
    };
    this.deleteDialog.show();
  }

  confirmDelete(): void {
    if (!this.pendingDeleteRequest) {
      this.deleteDialog.close();
      return;
    }

    this.deleteDialog.busy = true;

    this.tblDailyInventoryService.deleteTblDailyInventory(this.pendingDeleteRequest).subscribe({
      next: (response) => {
        this.deleteDialog.busy = false;
        this.deleteDialog.close();
        this.pendingDeleteRequest = undefined;

        if (response.status === 200) {
          this.toastr.success('Record deleted successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          this.OnFormSubmit(this.actionType);
        }
      },
      error: (err) => {
        this.deleteDialog.busy = false;

        const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

        this.toastr.error(errorMsg, 'Error', {
          toastClass: 'ngx-toastr custom-toast error-toast'
        });

        console.error('Delete Error:', err);
      }
    });
  }

  cancelDelete(): void {
    this.pendingDeleteRequest = undefined;
  }

}

