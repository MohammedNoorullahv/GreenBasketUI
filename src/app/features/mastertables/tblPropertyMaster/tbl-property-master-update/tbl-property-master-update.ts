// Path: src/app/features/mastertables/tblPropertyMaster/tbl-property-master-update/tbl-property-master-update.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblPropertyMasterService } from '../services/tbl-property-master';
import { TblPropertyMasterUpdate } from '../models/tblPropertyMaster-Update.model';

@Component({
  selector: 'app-tbl-property-master-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-property-master-update.html',
  styleUrl: './tbl-property-master-update.css',
})
export class TblPropertyMasterUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private getTblPropertyMasterSubscription?: Subscription;
  private editTblPropertyMasterSubscription?: Subscription;
  private deleteTblPropertyMasterSubscription?: Subscription;
  tblPropertyMaster?: TblPropertyMasterUpdate;
  actionType: string = '';
  isSaving: boolean = false;

  @ViewChild('form') form!: NgForm;

  constructor(private tblPropertyMasterService: TblPropertyMasterService,
    
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
          this.getTblPropertyMasterSubscription?.unsubscribe();
          this.getTblPropertyMasterSubscription = this.tblPropertyMasterService.getTblPropertyMasterById(this.id)
            .subscribe({
              next: (response) => {
                this.tblPropertyMaster = response;
                this.cdr.detectChanges();
                // first field of the form
                setTimeout(() => this.form?.controls['fldSlNo']?.markAsTouched());
              }
            });
        }
      });
  }

  OnFormSubmit(form: NgForm): void {

    if (this.isSaving) {
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isFormValid(form)) {
      return;
    }

    const request: TblPropertyMasterUpdate = {
      fldId: this.tblPropertyMaster?.fldId ?? 0,
      fldSlNo: this.tblPropertyMaster?.fldSlNo ?? 0,
      fldDescription: this.tblPropertyMaster?.fldDescription ?? '',
      fldShortName: this.tblPropertyMaster?.fldShortName ?? '',
      fldIsActive: this.tblPropertyMaster?.fldIsActive ?? true,
      fldCreatedBy: this.tblPropertyMaster?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblPropertyMaster?.fldCreatedDt ?? new Date(),
      fldModifiedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldModifiedDt: new Date(), // placeholder; server overwrites
    };

    if (!this.id) {
      return;
    }

    if (this.actionType === 'Edit') {
      this.isSaving = true;
      this.editTblPropertyMasterSubscription?.unsubscribe();
      this.editTblPropertyMasterSubscription = this.tblPropertyMasterService.updateTblPropertyMaster(request)
        .subscribe({
          next: () => {
            this.isSaving = false;
          

            this.toastr.success('Record updated successfully!', 'Success', {
              toastClass: 'ngx-toastr custom-toast'
            });

            this.router.navigateByUrl('mastertables/tblPropertyMaster');
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
    } else if (this.actionType === 'Delete') {

      const proceed = confirm('R U Sure, U Want to Delete the selected Record?');

      if (proceed) {
        this.isSaving = true;
        this.deleteTblPropertyMasterSubscription?.unsubscribe();
        this.deleteTblPropertyMasterSubscription = this.tblPropertyMasterService.deleteTblPropertyMaster(request)
          .subscribe({
            next: (response) => {
              this.isSaving = false;
              if (response.status === 200) {
                

                this.toastr.success('Record deleted successfully!', 'Success', {
                  toastClass: 'ngx-toastr custom-toast'
                });

                this.router.navigateByUrl('mastertables/tblPropertyMaster');
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
    }
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblPropertyMaster');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.getTblPropertyMasterSubscription?.unsubscribe();
    this.editTblPropertyMasterSubscription?.unsubscribe();
    this.deleteTblPropertyMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblPropertyMaster?.fldSlNo || this.tblPropertyMaster.fldSlNo <= 0) {
      return false;
    }

    if (!this.tblPropertyMaster?.fldDescription?.trim()) {
      return false;
    }

    return true;
  }
}
