import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblItemMasterService } from '../services/tbl-item-master';
import { TblItemMaster } from '../models/tblItemMaster.model';
import { TblItemMasterUpdate } from '../models/tblItemMaster-Update.model';

@Component({
  selector: 'app-tbl-item-master-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-item-master-update.html',
  styleUrl: './tbl-item-master-update.css',
})

export class TblItemMasterUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private editTblItemMasterSubscription?: Subscription;
  private deleteTblItemMasterSubscription?: Subscription;
  tblItemMaster?: TblItemMasterUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

  @ViewChild('form') form!: NgForm;

  constructor(private tblItemMasterService: TblItemMasterService,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }
  ngOnInit(): void {
    this.paramSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ])
      .subscribe(([params, queryParams]) => {
        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;
        this.actionType = queryParams['action'];

        if (this.id) {
          this.tblItemMasterService.getTblItemMasterById(this.id)
            .subscribe({
              next: (response) => {
                this.tblItemMaster = response;
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

    if (!this.tblItemMaster?.fldItemName?.trim()) {
      return;
    }

    if (!this.tblItemMaster?.fldItemType?.trim()) {
      return;
    }

    if (!this.tblItemMaster?.fldCategoryName?.trim()) {
      return;
    }

    if (!this.tblItemMaster?.fldBaseUnit?.trim()) {
      return;
    }

    if (!this.tblItemMaster?.fldMinOrderQuantityStep || this.tblItemMaster?.fldMinOrderQuantityStep <= 0) {
      return;
    }

    const TblItemMasterUpdateRequest: TblItemMasterUpdate = {
      fldId: this.tblItemMaster?.fldId ?? 0,
      fldItemName: this.tblItemMaster?.fldItemName ?? '',
      fldItemNameUrdu: this.tblItemMaster?.fldItemNameUrdu ?? '',
      fldItemNameTamil: this.tblItemMaster?.fldItemNameTamil ?? '',
      fldItemType: this.tblItemMaster?.fldItemType ?? '',
      fldCategoryName: this.tblItemMaster?.fldCategoryName ?? '',
      fldBaseUnit: this.tblItemMaster?.fldBaseUnit ?? '',
      fldAllowFractionalQuantity: this.tblItemMaster?.fldAllowFractionalQuantity ?? true,
      fldSubUnitLabel: this.tblItemMaster?.fldSubUnitLabel ?? '',
      fldAllowFlatRupeeValueBooking: this.tblItemMaster?.fldAllowFlatRupeeValueBooking ?? true,
      fldMinOrderQuantityStep: this.tblItemMaster?.fldMinOrderQuantityStep ?? 0,
      fldItemImagePath: this.tblItemMaster?.fldItemImagePath ?? '',
      fldIsActive: this.tblItemMaster?.fldIsActive ?? true,
      fldCreatedBy: this.tblItemMaster?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblItemMaster?.fldCreatedDt ?? new Date(),
      fldModifiedBy: this.tblItemMaster?.fldModifiedBy ?? 0,
      fldModifiedDt: this.tblItemMaster?.fldModifiedDt ?? new Date(),
    };

    if (this.id) {
      if (this.submitAction === 'Edit') {
        this.editTblItemMasterSubscription = this.tblItemMasterService.updateTblItemMaster(TblItemMasterUpdateRequest)
          .subscribe({
            next: (response) => {
              this.toastr.success('Record updated successfully!', 'Success', {
                toastClass: 'ngx-toastr custom-toast'
              });

              this.router.navigateByUrl('mastertables/tblItemMaster');
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
          this.deleteTblItemMasterSubscription = this.tblItemMasterService.deleteTblItemMaster(TblItemMasterUpdateRequest)
            .subscribe({
              next: (response) => {
                if (response.status === 200) {
                  this.toastr.success('Record deleted successfully!', 'Success', {
                    toastClass: 'ngx-toastr custom-toast'
                  });

                  this.router.navigateByUrl('mastertables/tblItemMaster');
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
    this.router.navigateByUrl('mastertables/tblItemMaster');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.editTblItemMasterSubscription?.unsubscribe();
    this.deleteTblItemMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblItemMaster?.fldItemName?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldItemType?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldCategoryName?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldBaseUnit?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldMinOrderQuantityStep || this.tblItemMaster?.fldMinOrderQuantityStep <= 0) {
      return false;
    }

    return true;
  }

}

