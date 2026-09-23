import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblOrderService } from '../services/tbl-order';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';
import { TblOrderUpdate } from '../models/tblOrder-Update.model';


@Component({
  selector: 'app-tbl-order-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-order-update.html',
  styleUrl: './tbl-order-update.css',
})

export class TblOrderUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private editTblOrderSubscription?: Subscription;
  private deleteTblOrderSubscription?: Subscription;
  tblOrder?: TblOrderUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

  @ViewChild('form') form!: NgForm;

  tblCustomerProfile$?: Observable<TblProfile[]>
  tblVendorProfile$?: Observable<TblProfile[]>

  constructor(private tblOrderService: TblOrderService,
    private tblCustomerProfileService: TblProfileService,
    private tblVendorProfileService: TblProfileService,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }
  ngOnInit(): void {


    this.tblCustomerProfile$ = this.tblCustomerProfileService.getActiveTblProfiles();
    this.tblVendorProfile$ = this.tblVendorProfileService.getActiveTblProfiles();



    setTimeout(() => {
      if (this.form && this.form.controls['fldDescription']) {
        this.form.controls['fldDescription'].markAsTouched();
      }
    });
    this.paramSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ])
      .subscribe(([params, queryParams]) => {
        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;
        this.actionType = queryParams['action'];

        if (this.id) {
          this.tblOrderService.getTblOrderById(this.id)
            .subscribe({
              next: (response) => {
                this.tblOrder = response;
                this.cdr.detectChanges();
              }
            });
        }
      });
  }
  OnFormSubmit(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.tblOrder?.fldFKCustomerId || this.tblOrder?.fldFKCustomerId <= 0) {
      return;
    }

    if (!this.tblOrder?.fldFKVendorId || this.tblOrder?.fldFKVendorId <= 0) {
      return;
    }

    if (!this.tblOrder?.fldOrderNumber?.trim()) {
      return;
    }

    if (!this.tblOrder?.fldItemSubTotal || this.tblOrder?.fldItemSubTotal <= 0) {
      return;
    }

    if (!this.tblOrder?.fldDeliveryCharges || this.tblOrder?.fldDeliveryCharges <= 0) {
      return;
    }

    if (!this.tblOrder?.fldGrandTotal || this.tblOrder?.fldGrandTotal <= 0) {
      return;
    }

    if (!this.tblOrder?.fldOrderStatus?.trim()) {
      return;
    }

    if (!this.tblOrder?.fldDeliveryGPSLocation?.trim()) {
      return;
    }

    const TblOrderUpdateRequest: TblOrderUpdate = {
      fldId: this.tblOrder?.fldId ?? 0,
      fldFKCustomerId: this.tblOrder?.fldFKCustomerId ?? 0,
      fldFKVendorId: this.tblOrder?.fldFKVendorId ?? 0,
      fldOrderNumber: this.tblOrder?.fldOrderNumber ?? '',
      fldOrderDate: this.tblOrder?.fldOrderDate ?? new Date(),
      fldItemSubTotal: this.tblOrder?.fldItemSubTotal ?? 0,
      fldDeliveryCharges: this.tblOrder?.fldDeliveryCharges ?? 0,
      fldGrandTotal: this.tblOrder?.fldGrandTotal ?? 0,
      fldOrderStatus: this.tblOrder?.fldOrderStatus ?? '',
      fldDeliveryGPSLocation: this.tblOrder?.fldDeliveryGPSLocation ?? '',
      fldIsActive: this.tblOrder?.fldIsActive ?? true,
      fldCreatedBy: this.tblOrder?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblOrder?.fldCreatedDt ?? new Date(),
      fldModifiedBy: this.tblOrder?.fldModifiedBy ?? 0,
      fldModifiedDt: this.tblOrder?.fldModifiedDt ?? new Date(),
    };

    if (this.id) {
      if (this.submitAction === 'Edit') {
        this.editTblOrderSubscription = this.tblOrderService.updateTblOrder(TblOrderUpdateRequest)
          .subscribe({
            next: (response) => {
              this.toastr.success('Record updated successfully!', 'Success', {
                toastClass: 'ngx-toastr custom-toast'
              });

              this.router.navigateByUrl('transactiontables/tblOrder');
            },
            error: (err) => {
              const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

              this.toastr.error(errorMsg, 'Error', {
                toastClass: 'ngx-toastr custom-toast error-toast'
              });

              console.error('API Error:', err);
            }
          });
      } else {

        const proceed = confirm('R U Sure, U Want to Delete the selected Record?');

        if (proceed) {
          this.deleteTblOrderSubscription = this.tblOrderService.deleteTblOrder(TblOrderUpdateRequest)
            .subscribe({
              next: (response) => {
                if (response.status === 200) {
                  this.toastr.success('Record deleted successfully!', 'Success', {
                    toastClass: 'ngx-toastr custom-toast'
                  });

                  this.router.navigateByUrl('transactiontables/tblOrder');
                }
              },
              error: (err) => {
                const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

                this.toastr.error(errorMsg, 'Error', {
                  toastClass: 'ngx-toastr custom-toast error-toast'
                });

                console.error('API Error:', err);
              }
            });
        }
      }
    }
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblOrder');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.editTblOrderSubscription?.unsubscribe();
    this.deleteTblOrderSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblOrder?.fldFKCustomerId || this.tblOrder?.fldFKCustomerId <= 0) {
      return false;
    }

    if (!this.tblOrder?.fldFKVendorId || this.tblOrder?.fldFKVendorId <= 0) {
      return false;
    }

    if (!this.tblOrder?.fldOrderNumber?.trim()) {
      return false;
    }

    if (!this.tblOrder?.fldItemSubTotal || this.tblOrder?.fldItemSubTotal <= 0) {
      return false;
    }

    if (!this.tblOrder?.fldDeliveryCharges || this.tblOrder?.fldDeliveryCharges <= 0) {
      return false;
    }

    if (!this.tblOrder?.fldGrandTotal || this.tblOrder?.fldGrandTotal <= 0) {
      return false;
    }

    if (!this.tblOrder?.fldOrderStatus?.trim()) {
      return false;
    }

    if (!this.tblOrder?.fldDeliveryGPSLocation?.trim()) {
      return false;
    }

    return true;
  }

}

