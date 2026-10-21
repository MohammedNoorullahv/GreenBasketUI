// Path: src/app/features/mastertables/tblProperty/tbl-property-add/tbl-property-add.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblPropertyAdd } from '../models/tblProperty-Add.model';
import { TblPropertyService } from '../services/tbl-property';
import { TblPropertyMaster } from '../../tblPropertyMaster/models/tblPropertyMaster.model';
import { TblPropertyMasterService } from '../../tblPropertyMaster/services/tbl-property-master';
import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';

@Component({
  selector: 'app-tbl-property-add',
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: './tbl-property-add.html',
  styleUrl: './tbl-property-add.css',
})
export class TblPropertyAddComponent implements OnInit, OnDestroy {
  model: TblPropertyAdd;
  tblPropertyMaster$?: Observable<TblPropertyMaster[]>; // FldFKProperty combo (parent: TblPropertyMaster)
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit';
  private addTblPropertySubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  constructor(private tblPropertyService: TblPropertyService,
    private tblPropertyMasterService: TblPropertyMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = this.newModel();
  }

  private newModel(): TblPropertyAdd {
    return {
      fldFKProperty: 0,
      fldSlNo: 0,
      fldDescription: '',
      fldShortName: '',
      fldSetAsDefault: false,
      fldIsActive: true,
      fldCreatedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldCreatedDt: new Date(), // placeholder; server overwrites
    };
  }

  ngOnInit(): void {
    this.tblPropertyMaster$ = this.tblPropertyMasterService.getActiveLeanTblPropertyMasters();
    setTimeout(() => {
      if (this.form && this.form.controls['fldFKProperty']) {
        this.form.controls['fldFKProperty'].markAsTouched();
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

    if (!this.model.fldFKProperty || this.model.fldFKProperty <= 0) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.fldSlNo || this.model.fldSlNo <= 0) {
      return;
    }

    if (!this.model.fldDescription?.trim()) {
      return;
    }

    this.isSaving = true;

    this.addTblPropertySubscription = this.tblPropertyService.addTblProperty(this.model)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.tblPropertySharedService.refreshProperties();

          this.toastr.success('Record saved successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          if (this.submitAction === 'SaveAndAddNew') {
            this.resetForm();
            this.cdr.detectChanges();
          } else {
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

  resetForm() {
    this.model = this.newModel();
    this.form?.resetForm(this.model);
    setTimeout(() => {
      // first field of the form
      this.form?.controls['fldFKProperty']?.markAsTouched();
      document.getElementById('fldFKProperty')?.focus();
    });
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblProperty');
  }

  ngOnDestroy(): void {
    this.addTblPropertySubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKProperty || this.model.fldFKProperty <= 0) {
      return false;
    }

    if (!this.model.fldSlNo || this.model.fldSlNo <= 0) {
      return false;
    }

    if (!this.model.fldDescription?.trim()) {
      return false;
    }

    return true;
  }
}
