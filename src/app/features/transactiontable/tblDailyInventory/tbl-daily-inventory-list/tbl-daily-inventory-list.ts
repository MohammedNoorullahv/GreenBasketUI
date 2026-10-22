import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblDailyInventory } from '../models/tblDailyInventory.model';
import { TblDailyInventoryService } from '../services/tbl-daily-inventory';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { Console } from 'node:console';

@Component({
  selector: 'app-tbl-daily-inventory-list',
  imports: [AsyncPipe, CommonModule, RouterLink, FormsModule, ColumnFilterPipe, ColumnFilterIconComponent],
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

}

