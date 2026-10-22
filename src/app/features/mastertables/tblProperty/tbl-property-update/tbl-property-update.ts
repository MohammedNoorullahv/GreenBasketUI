// Path: src/app/features/mastertables/tblProperty/tbl-property-update/tbl-property-update.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblPropertyService } from '../services/tbl-property';
import { TblPropertyUpdate } from '../models/tblProperty-Update.model';
import { TblPropertyMaster } from '../../tblPropertyMaster/models/tblPropertyMaster.model';
import { TblPropertyMasterService } from '../../tblPropertyMaster/services/tbl-property-master';
import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';
// import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared';

@Component({
  selector: 'app-tbl-property-update',
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: './tbl-property-update.html',
  styleUrl: './tbl-property-update.css',
})
export class TblPropertyUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private getTblPropertySubscription?: Subscription;
  private editTblPropertySubscription?: Subscription;
  private deleteTblPropertySubscription?: Subscription;
  tblProperty?: TblPropertyUpdate;
  tblPropertyMaster$?: Observable<TblPropertyMaster[]>; // FldFKProperty combo (parent: TblPropertyMaster)
  actionType: string = '';
  isSaving: boolean = false;

  @ViewChild('form') form!: NgForm;

  constructor(private tblPropertyService: TblPropertyService,
    private tblPropertyMasterService: TblPropertyMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.tblPropertyMaster$ = this.tblPropertyMasterService.getActiveLeanTblPropertyMasters();

    this.paramSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ])
      .subscribe(([params, queryParams]) => {
        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;
        this.actionType = queryParams['action'];

        if (this.id) {
          this.getTblPropertySubscription?.unsubscribe();
          this.getTblPropertySubscription = this.tblPropertyService.getTblPropertyById(this.id)
            .subscribe({
              next: (response) => {
                this.tblProperty = response;
                this.cdr.detectChanges();
                // first field of the form
                setTimeout(() => this.form?.controls['fldFKProperty']?.markAsTouched());
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
      form.control.markAllAsTouched();
      return;
    }

    const request: TblPropertyUpdate = {
      fldId: this.tblProperty?.fldId ?? 0,
      fldFKProperty: this.tblProperty?.fldFKProperty ?? 0,
      fldSlNo: this.tblProperty?.fldSlNo ?? 0,
      fldDescription: this.tblProperty?.fldDescription ?? '',
      fldShortName: this.tblProperty?.fldShortName ?? '',
      fldSetAsDefault: this.tblProperty?.fldSetAsDefault ?? false,
      fldIsActive: this.tblProperty?.fldIsActive ?? true,
      fldCreatedBy: this.tblProperty?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblProperty?.fldCreatedDt ?? new Date(),
      fldModifiedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldModifiedDt: new Date(), // placeholder; server overwrites
    };

    if (!this.id) {
      return;
    }

    if (this.actionType === 'Edit') {
      this.isSaving = true;
      this.editTblPropertySubscription?.unsubscribe();
      this.editTblPropertySubscription = this.tblPropertyService.updateTblProperty(request)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.tblPropertySharedService.refreshProperties();

            this.toastr.success('Record updated successfully!', 'Success', {
              toastClass: 'ngx-toastr custom-toast'
            });

            this.router.navigateByUrl('mastertables/tblProperty');
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
        this.deleteTblPropertySubscription?.unsubscribe();
        this.deleteTblPropertySubscription = this.tblPropertyService.deleteTblProperty(request)
          .subscribe({
            next: (response) => {
              this.isSaving = false;
              if (response.status === 200) {
                this.tblPropertySharedService.refreshProperties();

                this.toastr.success('Record deleted successfully!', 'Success', {
                  toastClass: 'ngx-toastr custom-toast'
                });

                this.router.navigateByUrl('mastertables/tblProperty');
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
    this.router.navigateByUrl('mastertables/tblProperty');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.getTblPropertySubscription?.unsubscribe();
    this.editTblPropertySubscription?.unsubscribe();
    this.deleteTblPropertySubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblProperty?.fldFKProperty || this.tblProperty.fldFKProperty <= 0) {
      return false;
    }

    if (!this.tblProperty?.fldSlNo || this.tblProperty.fldSlNo <= 0) {
      return false;
    }

    if (!this.tblProperty?.fldDescription?.trim()) {
      return false;
    }

    return true;
  }
}
