import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { TblOrderDetail } from '../models/tblOrderDetail.model';
import { TblOrderDetailUpdate } from '../models/tblOrderDetail-Update.model';
import { TblOrderDetailService } from '../services/tbl-order-detail';


@Component({
  selector: 'app-tbl-order-detail-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent, ConfirmDialogComponent],
  templateUrl: './tbl-order-detail-list.html',
  styleUrl: './tbl-order-detail-list.css',
})

export class TblOrderDetailListComponent implements OnInit {
  tblOrderDetail$?: Observable<TblOrderDetail[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
  filters: Record<string, string> = {};

  @ViewChild('deleteDialog') deleteDialog!: ConfirmDialogComponent;

  deleteTargetLabel = '';
  private pendingDeleteRequest?: TblOrderDetailUpdate;

  constructor(private tblOrderDetailService: TblOrderDetailService, private toastr: ToastrService) {
  }
  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblOrderDetail$ = this.tblOrderDetailService.getAllTblOrderDetails();
  }
  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = "Load All";
      this.tblOrderDetail$ = this.tblOrderDetailService.getAllTblOrderDetails();
    }
    else {
      this.actionType = "Active Only";
      this.tblOrderDetail$ = this.tblOrderDetailService.getActiveTblOrderDetails();
    }
  }

  /** Opens the delete confirmation dialog from the row delete icon only. */
  askDelete(detail: TblOrderDetail): void {
    this.deleteTargetLabel = `order detail #${detail.fldId}`;
    this.pendingDeleteRequest = {
      fldId: detail.fldId,
      fldFKOrderHeaderId: detail.fldFKOrderHeaderId ?? 0,
      fldFKItemId: detail.fldFKItemId ?? 0,
      fldFKDailyInventoryId: detail.fldFKDailyInventoryId ?? 0,
      fldQuantity: detail.fldQuantity ?? 0,
      fldUnit: detail.fldUnit ?? '',
      fldRate: detail.fldRate ?? 0,
      fldFlatRupeeBookingValue: detail.fldFlatRupeeBookingValue ?? 0,
      value: detail.value ?? 0,
    };
    this.deleteDialog.show();
  }

  confirmDelete(): void {
    if (!this.pendingDeleteRequest) {
      this.deleteDialog.close();
      return;
    }

    this.deleteDialog.busy = true;

    this.tblOrderDetailService.deleteTblOrderDetail(this.pendingDeleteRequest).subscribe({
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
