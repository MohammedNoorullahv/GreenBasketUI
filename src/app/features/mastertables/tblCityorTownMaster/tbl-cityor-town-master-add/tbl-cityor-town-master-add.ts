import { Component, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblCityorTownMaster } from '../models/tblCityorTownMaster.model';
import { TblCityorTownMasterAdd } from '../models/tblCityorTownMaster-Add.model';
import { TblCityorTownMasterService } from '../services/tbl-cityor-town-master';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-tbl-cityor-town-master-add',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './tbl-cityor-town-master-add.html',
  styleUrl: './tbl-cityor-town-master-add.css',
})

export class TblCityorTownMasterAddComponent implements OnDestroy {
  model: TblCityorTownMasterAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblCityorTownMasterSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  constructor(private tblCityorTownMasterService: TblCityorTownMasterService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef,
  private translate: TranslateService) {
    this.model = {
      fldId: 0,
      fldCityorTownName: '',
      fldAreaName: '',
      fldPincode: '',
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
    
  }

  changeLanguage(language: string) {
    this.translate.use(language);
  }

  ngOnInit(): void {
  }

  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {
    console.log("On Form Submit called with action:", action, "and form validity:", form.valid);
    if (this.isSaving) {
      return;
    }

    this.submitAction = action;

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.fldCityorTownName?.trim()) {
      return;
    }

    if (!this.model.fldPincode?.trim()) {
      return;
    }

    this.isSaving = true;

    this.addTblCityorTownMasterSubscription = this.tblCityorTownMasterService.addTblCityorTownMaster(this.model)
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
            this.router.navigateByUrl('mastertables/tblCityorTownMaster');
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
      fldCityorTownName: '',
      fldAreaName: '',
      fldPincode: '',
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
    this.router.navigateByUrl('mastertables/tblCityorTownMaster');
  }

  ngOnDestroy(): void {
    this.addTblCityorTownMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldCityorTownName?.trim()) {
      return false;
    }

    if (!this.model.fldPincode?.trim()) {
      return false;
    }

    return true;
  }

}

