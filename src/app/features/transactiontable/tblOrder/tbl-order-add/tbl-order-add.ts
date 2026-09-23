import { Component, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TblOrderAdd } from '../models/tblOrder-Add.model';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblOrderService } from '../services/tbl-order';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';


@Component({
  selector: 'app-tbl-order-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-order-add.html',
  styleUrl: './tbl-order-add.css',
})

export class TblOrderAddComponent implements OnDestroy {
  model: TblOrderAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblOrderSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  tblCustomerProfile$?: Observable<TblProfile[]>
  tblVendorProfile$?: Observable<TblProfile[]>

  constructor(private tblOrderService: TblOrderService,
    private tblCustomerProfileService: TblProfileService,
    private tblVendorProfileService: TblProfileService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = {
      fldId: 0,
      fldFKCustomerId: 0,
      fldFKVendorId: 0,
      fldOrderNumber: '',
      fldOrderDate: new Date(),
      fldItemSubTotal: 0,
      fldDeliveryCharges: 0,
      fldGrandTotal: 0,
      fldOrderStatus: '',
      fldDeliveryGPSLocation: '',
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  ngOnInit(): void {


    this.tblCustomerProfile$ = this.tblCustomerProfileService.getActiveLeanTblProfiles();
    this.tblVendorProfile$ = this.tblVendorProfileService.getActiveLeanTblProfiles();



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

    if (!this.model.fldFKCustomerId || this.model.fldFKCustomerId <= 0) {
      return;
    }

    if (!this.model.fldFKVendorId || this.model.fldFKVendorId <= 0) {
      return;
    }

    if (!this.model.fldOrderNumber?.trim()) {
      return;
    }

    if (!this.model.fldItemSubTotal || this.model.fldItemSubTotal <= 0) {
      return;
    }

    if (!this.model.fldDeliveryCharges || this.model.fldDeliveryCharges <= 0) {
      return;
    }

    if (!this.model.fldGrandTotal || this.model.fldGrandTotal <= 0) {
      return;
    }

    if (!this.model.fldOrderStatus?.trim()) {
      return;
    }

    if (!this.model.fldDeliveryGPSLocation?.trim()) {
      return;
    }

    this.isSaving = true;

    this.addTblOrderSubscription = this.tblOrderService.addTblOrder(this.model)
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
            this.router.navigateByUrl('transactiontables/tblOrder');
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
      fldFKCustomerId: 0,
      fldFKVendorId: 0,
      fldOrderNumber: '',
      fldOrderDate: new Date(),
      fldItemSubTotal: 0,
      fldDeliveryCharges: 0,
      fldGrandTotal: 0,
      fldOrderStatus: '',
      fldDeliveryGPSLocation: '',
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    },
      setTimeout(() => {
        const firstInput = document.getElementById('fldDescription');
        if (firstInput) {
          firstInput.focus();
        }
      });
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblOrder');
  }

  ngOnDestroy(): void {
    this.addTblOrderSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKCustomerId || this.model.fldFKCustomerId <= 0) {
      return false;
    }

    if (!this.model.fldFKVendorId || this.model.fldFKVendorId <= 0) {
      return false;
    }

    if (!this.model.fldOrderNumber?.trim()) {
      return false;
    }

    if (!this.model.fldItemSubTotal || this.model.fldItemSubTotal <= 0) {
      return false;
    }

    if (!this.model.fldDeliveryCharges || this.model.fldDeliveryCharges <= 0) {
      return false;
    }

    if (!this.model.fldGrandTotal || this.model.fldGrandTotal <= 0) {
      return false;
    }

    if (!this.model.fldOrderStatus?.trim()) {
      return false;
    }

    if (!this.model.fldDeliveryGPSLocation?.trim()) {
      return false;
    }

    return true;
  }

}

