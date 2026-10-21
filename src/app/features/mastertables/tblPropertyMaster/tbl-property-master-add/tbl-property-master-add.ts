// Path: src/app/features/mastertables/tblPropertyMaster/tbl-property-master-add/tbl-property-master-add.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblPropertyMasterAdd } from '../models/tblPropertyMaster-Add.model';
import { TblPropertyMasterService } from '../services/tbl-property-master';

@Component({
  selector: 'app-tbl-property-master-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-property-master-add.html',
  styleUrl: './tbl-property-master-add.css',
})
export class TblPropertyMasterAddComponent implements OnInit, OnDestroy {
  model: TblPropertyMasterAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit';
  private addTblPropertyMasterSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  constructor(private tblPropertyMasterService: TblPropertyMasterService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = this.newModel();
  }

  private newModel(): TblPropertyMasterAdd {
    return {
      fldSlNo: 0,
      fldDescription: '',
      fldShortName: '',
      fldIsActive: true,
      fldCreatedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldCreatedDt: new Date(), // placeholder; server overwrites
    };
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.form && this.form.controls['fldSlNo']) {
        this.form.controls['fldSlNo'].markAsTouched();
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

    if (!this.model.fldSlNo || this.model.fldSlNo <= 0) {
      return;
    }

    if (!this.model.fldDescription?.trim()) {
      return;
    }

    this.isSaving = true;

    this.addTblPropertyMasterSubscription = this.tblPropertyMasterService.addTblPropertyMaster(this.model)
      .subscribe({
        next: () => {
          this.isSaving = false;
          
          this.toastr.success('Record saved successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          if (this.submitAction === 'SaveAndAddNew') {
            this.resetForm();
            this.cdr.detectChanges();
          } else {
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

  resetForm() {
    this.model = this.newModel();
    this.form?.resetForm(this.model);
    setTimeout(() => {
      // first field of the form
      this.form?.controls['fldSlNo']?.markAsTouched();
      document.getElementById('fldSlNo')?.focus();
    });
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblPropertyMaster');
  }

  ngOnDestroy(): void {
    this.addTblPropertyMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
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
