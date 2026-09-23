import { Component, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TblOrderDetailAdd } from '../models/tblOrderDetail-Add.model';
import { TblOrder } from '../../tblOrder/models/tblOrder.model';
import { TblItemMaster } from '../../../mastertables/tblItemMaster/models/tblItemMaster.model';
import { TblDailyInventory } from '../../tblDailyInventory/models/tblDailyInventory.model';
import { TblOrderDetailService } from '../services/tbl-order-detail';
import { TblOrderService } from '../../tblOrder/services/tbl-order';
import { TblItemMasterService } from '../../../mastertables/tblItemMaster/services/tbl-item-master';
import { TblDailyInventoryService } from '../../tblDailyInventory/services/tbl-daily-inventory';


@Component({
  selector: 'app-tbl-order-detail-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-order-detail-add.html',
  styleUrl: './tbl-order-detail-add.css',
})

export class TblOrderDetailAddComponent implements OnDestroy {
  model: TblOrderDetailAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblOrderDetailSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  tblOrder$?: Observable<TblOrder[]>
  tblItemMaster$?: Observable<TblItemMaster[]>
  tblDailyInventory$?: Observable<TblDailyInventory[]>

  constructor(private tblOrderDetailService: TblOrderDetailService,
    private tblOrderService: TblOrderService,
    private tblItemMasterService: TblItemMasterService,
    private tblDailyInventoryService: TblDailyInventoryService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = {
      fldId: 0,
      fldFKOrderHeaderId: 0,
      fldFKItemId: 0,
      fldFKDailyInventoryId: 0,
      fldQuantity: 0,
      fldUnit: '',
      fldRate: 0,
      fldFlatRupeeBookingValue: 0,
      value: 0,
    };
  }

  ngOnInit(): void {


    this.tblOrder$ = this.tblOrderService.getActiveLeanTblOrders();
    this.tblItemMaster$ = this.tblItemMasterService.getActiveLeanTblItemMasters();
    this.tblDailyInventory$ = this.tblDailyInventoryService.getAllTblDailyInventorys();



    setTimeout(() => {
      if (this.form && this.form.controls['fldDescription']) {
        this.form.controls['fldDescription'].markAsTouched();
      }
    });
  }

  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {

    if (this.isSaving) {
      return;
    }

    this.submitAction = action;

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.fldFKOrderHeaderId || this.model.fldFKOrderHeaderId <= 0) {
      return;
    }

    if (!this.model.fldFKItemId || this.model.fldFKItemId <= 0) {
      return;
    }

    if (!this.model.fldFKDailyInventoryId || this.model.fldFKDailyInventoryId <= 0) {
      return;
    }

    if (!this.model.fldRate || this.model.fldRate <= 0) {
      return;
    }

    if (!this.model.value || this.model.value <= 0) {
      return;
    }

    this.isSaving = true;

    this.addTblOrderDetailSubscription = this.tblOrderDetailService.addTblOrderDetail(this.model)
      .subscribe({
        next: (response) => {
          this.isSaving = false;

          this.toastr.success('Record saved successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          if (this.submitAction === 'SaveAndAddNew') {
            this.resetForm();
            this.cdr.detectChanges();
          } else {
            this.router.navigateByUrl('transactiontables/tblOrderDetail');
          }
        },
        error: (err) => {
          this.isSaving = false;

          const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

          this.toastr.error(errorMsg, 'Error', {
            toastClass: 'ngx-toastr custom-toast error-toast'
          });

          console.error('API Error:', err);
        }
      });
  }

  resetForm() {
    this.model = {
      fldId: 0,
      fldFKOrderHeaderId: 0,
      fldFKItemId: 0,
      fldFKDailyInventoryId: 0,
      fldQuantity: 0,
      fldUnit: '',
      fldRate: 0,
      fldFlatRupeeBookingValue: 0,
      value: 0,
    },
      setTimeout(() => {
        const firstInput = document.getElementById('fldDescription');
        if (firstInput) {
          firstInput.focus();
        }
      });
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblOrderDetail');
  }

  ngOnDestroy(): void {
    this.addTblOrderDetailSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKOrderHeaderId || this.model.fldFKOrderHeaderId <= 0) {
      return false;
    }

    if (!this.model.fldFKItemId || this.model.fldFKItemId <= 0) {
      return false;
    }

    if (!this.model.fldFKDailyInventoryId || this.model.fldFKDailyInventoryId <= 0) {
      return false;
    }

    if (!this.model.fldRate || this.model.fldRate <= 0) {
      return false;
    }

    if (!this.model.value || this.model.value <= 0) {
      return false;
    }

    return true;
  }

}
