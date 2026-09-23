import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { TblOrderDetailUpdate } from '../models/tblOrderDetail-Update.model';
import { TblOrder } from '../../tblOrder/models/tblOrder.model';
import { TblItemMaster } from '../../../mastertables/tblItemMaster/models/tblItemMaster.model';
import { TblDailyInventory } from '../../tblDailyInventory/models/tblDailyInventory.model';
import { TblOrderDetailService } from '../services/tbl-order-detail';
import { TblOrderService } from '../../tblOrder/services/tbl-order';
import { TblItemMasterService } from '../../../mastertables/tblItemMaster/services/tbl-item-master';
import { TblDailyInventoryService } from '../../tblDailyInventory/services/tbl-daily-inventory';


@Component({
  selector: 'app-tbl-order-detail-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-order-detail-update.html',
  styleUrl: './tbl-order-detail-update.css',
})

export class TblOrderDetailUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private editTblOrderDetailSubscription?: Subscription;
  private deleteTblOrderDetailSubscription?: Subscription;
  tblOrderDetail?: TblOrderDetailUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

  @ViewChild('form') form!: NgForm;

  tblOrder$?: Observable<TblOrder[]>
  tblItemMaster$?: Observable<TblItemMaster[]>
  tblDailyInventory$?: Observable<TblDailyInventory[]>

  constructor(private tblOrderDetailService: TblOrderDetailService,
    private tblOrderService: TblOrderService,
    private tblItemMasterService: TblItemMasterService,
    private tblDailyInventoryService: TblDailyInventoryService,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }
  ngOnInit(): void {


    this.tblOrder$ = this.tblOrderService.getActiveTblOrders();
    this.tblItemMaster$ = this.tblItemMasterService.getActiveTblItemMasters();
    this.tblDailyInventory$ = this.tblDailyInventoryService.getAllTblDailyInventorys();



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
          this.tblOrderDetailService.getTblOrderDetailById(this.id)
            .subscribe({
              next: (response) => {
                this.tblOrderDetail = response;
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

    if (!this.tblOrderDetail?.fldFKOrderHeaderId || this.tblOrderDetail?.fldFKOrderHeaderId <= 0) {
      return;
    }

    if (!this.tblOrderDetail?.fldFKItemId || this.tblOrderDetail?.fldFKItemId <= 0) {
      return;
    }

    if (!this.tblOrderDetail?.fldFKDailyInventoryId || this.tblOrderDetail?.fldFKDailyInventoryId <= 0) {
      return;
    }

    if (!this.tblOrderDetail?.fldRate || this.tblOrderDetail?.fldRate <= 0) {
      return;
    }

    if (!this.tblOrderDetail?.value || this.tblOrderDetail?.value <= 0) {
      return;
    }

    const TblOrderDetailUpdateRequest: TblOrderDetailUpdate = {
      fldId: this.tblOrderDetail?.fldId ?? 0,
      fldFKOrderHeaderId: this.tblOrderDetail?.fldFKOrderHeaderId ?? 0,
      fldFKItemId: this.tblOrderDetail?.fldFKItemId ?? 0,
      fldFKDailyInventoryId: this.tblOrderDetail?.fldFKDailyInventoryId ?? 0,
      fldQuantity: this.tblOrderDetail?.fldQuantity ?? 0,
      fldUnit: this.tblOrderDetail?.fldUnit ?? '',
      fldRate: this.tblOrderDetail?.fldRate ?? 0,
      fldFlatRupeeBookingValue: this.tblOrderDetail?.fldFlatRupeeBookingValue ?? 0,
      value: this.tblOrderDetail?.value ?? 0,
    };

    if (this.id) {
      if (this.submitAction === 'Edit') {
        this.editTblOrderDetailSubscription = this.tblOrderDetailService.updateTblOrderDetail(TblOrderDetailUpdateRequest)
          .subscribe({
            next: (response) => {
              this.toastr.success('Record updated successfully!', 'Success', {
                toastClass: 'ngx-toastr custom-toast'
              });

              this.router.navigateByUrl('transactiontables/tblOrderDetail');
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
          this.deleteTblOrderDetailSubscription = this.tblOrderDetailService.deleteTblOrderDetail(TblOrderDetailUpdateRequest)
            .subscribe({
              next: (response) => {
                if (response.status === 200) {
                  this.toastr.success('Record deleted successfully!', 'Success', {
                    toastClass: 'ngx-toastr custom-toast'
                  });

                  this.router.navigateByUrl('transactiontables/tblOrderDetail');
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
    this.router.navigateByUrl('transactiontables/tblOrderDetail');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.editTblOrderDetailSubscription?.unsubscribe();
    this.deleteTblOrderDetailSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblOrderDetail?.fldFKOrderHeaderId || this.tblOrderDetail?.fldFKOrderHeaderId <= 0) {
      return false;
    }

    if (!this.tblOrderDetail?.fldFKItemId || this.tblOrderDetail?.fldFKItemId <= 0) {
      return false;
    }

    if (!this.tblOrderDetail?.fldFKDailyInventoryId || this.tblOrderDetail?.fldFKDailyInventoryId <= 0) {
      return false;
    }

    if (!this.tblOrderDetail?.fldRate || this.tblOrderDetail?.fldRate <= 0) {
      return false;
    }

    if (!this.tblOrderDetail?.value || this.tblOrderDetail?.value <= 0) {
      return false;
    }

    return true;
  }

}
