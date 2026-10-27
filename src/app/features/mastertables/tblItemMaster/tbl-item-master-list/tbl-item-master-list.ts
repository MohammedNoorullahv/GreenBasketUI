import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { TblItemMaster } from '../models/tblItemMaster.model';
import { TblItemMasterUpdate } from '../models/tblItemMaster-Update.model';
import { TblItemMasterService } from '../services/tbl-item-master'

@Component({
  selector: 'app-tbl-item-master-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent, ConfirmDialogComponent],
  templateUrl: './tbl-item-master-list.html',
  styleUrl: './tbl-item-master-list.css',
})

export class TblItemMasterListComponent implements OnInit {
  tblItemMaster$?: Observable<TblItemMaster[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

  @ViewChild('deleteDialog') deleteDialog!: ConfirmDialogComponent;

  deleteTargetLabel = '';
  private pendingDeleteRequest?: TblItemMasterUpdate;

  constructor(private tblItemMasterService: TblItemMasterService, private toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblItemMaster$ = this.tblItemMasterService.getAllTblItemMasters();
  }

  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = 'Load All';
      this.tblItemMaster$ = this.tblItemMasterService.getAllTblItemMasters();
    }
    else {
      this.actionType = 'Active Only';
      this.tblItemMaster$ = this.tblItemMasterService.getActiveTblItemMasters();
    }
  }

  imageUrl(path?: string | null): string {
    return this.tblItemMasterService.getItemImageUrl(path);
  }

  /** Opens the delete confirmation dialog from the row delete icon only. */
  askDelete(record: TblItemMaster): void {
    this.deleteTargetLabel = record.fldItemName || `record #${record.fldId}`;
    this.pendingDeleteRequest = {
      fldId: record.fldId,
      fldItemName: record.fldItemName ?? '',
      fldItemNameUrdu: record.fldItemNameUrdu ?? '',
      fldItemNameTamil: record.fldItemNameTamil ?? '',
      fldItemType: record.fldItemType ?? '',
      fldCategoryName: record.fldCategoryName ?? '',
      fldBaseUnit: record.fldBaseUnit ?? '',
      fldAllowFractionalQuantity: record.fldAllowFractionalQuantity ?? true,
      fldFractionalUnit: record.fldFractionalUnit ?? '',
      fldSubUnitLabel: record.fldSubUnitLabel ?? '',
      fldAllowFlatRupeeValueBooking: record.fldAllowFlatRupeeValueBooking ?? true,
      fldMinOrderQuantityStep: record.fldMinOrderQuantityStep ?? 0,
      fldItemImagePath: record.fldItemImagePath ?? '',
      fldFKItem: record.fldFKItem ?? 0,
      fldFKItemType: record.fldFKItemType ?? 0,
      fldFKCategoryName: record.fldFKCategoryName ?? 0,
      fldFKBaseUnit: record.fldFKBaseUnit ?? 0,
      fldFKFractionalUnit: record.fldFKFractionalUnit ?? 0,
      fldIsOpenPackingItem: record.fldIsOpenPackingItem ?? true,
      fldFKGroupId: record.fldFKGroupId ?? 0,
      fldConversionRatetoBaseUnit: record.fldConversionRatetoBaseUnit ?? 0,
      fldIsActive: record.fldIsActive ?? true,
      fldCreatedBy: record.fldCreatedBy ?? 0,
      fldCreatedDt: record.fldCreatedDt ?? new Date(),
      fldModifiedBy: record.fldModifiedBy ?? 0,
      fldModifiedDt: record.fldModifiedDt ?? new Date(),
    };
    this.deleteDialog.show();
  }

  confirmDelete(): void {
    if (!this.pendingDeleteRequest) {
      this.deleteDialog.close();
      return;
    }

    this.deleteDialog.busy = true;

    this.tblItemMasterService.deleteTblItemMaster(this.pendingDeleteRequest).subscribe({
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
