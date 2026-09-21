import { Component, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblCityorTownMaster } from '../../tblCityorTownMaster/models/tblCityorTownMaster.model';
import { TblCityorTownMasterService } from '../../tblCityorTownMaster/services/tbl-cityor-town-master';

import { TblStreetMaster } from '../models/tblStreetMaster.model';
import { TblStreetMasterAdd } from '../models/tblStreetMaster-Add.model';
import { TblStreetMasterService } from '../services/tbl-street-master';


@Component({
  selector: 'app-tbl-street-master-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-street-master-add.html',
  styleUrl: './tbl-street-master-add.css',
})

export class TblStreetMasterAddComponent implements OnDestroy {
  model: TblStreetMasterAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblStreetMasterSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>

  constructor(private tblStreetMasterService: TblStreetMasterService,
    private tblCityorTownMasterService: TblCityorTownMasterService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = {
      fldId: 0,
      fldFKCity: 0,
      fldStreetName: '',
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  ngOnInit(): void {


    this.tblCityorTownMaster$ = this.tblCityorTownMasterService.getActiveLeanTblCityorTownMasters();



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

    if (!this.model.fldFKCity || this.model.fldFKCity <= 0) {
      return;
    }

    if (!this.model.fldStreetName?.trim()) {
      return;
    }

    this.isSaving = true;

    this.addTblStreetMasterSubscription = this.tblStreetMasterService.addTblStreetMaster(this.model)
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
            this.router.navigateByUrl('mastertables/tblStreetMaster');
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
      fldFKCity: 0,
      fldStreetName: '',
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
    this.router.navigateByUrl('mastertables/tblStreetMaster');
  }

  ngOnDestroy(): void {
    this.addTblStreetMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKCity || this.model.fldFKCity <= 0) {
      return false;
    }

    if (!this.model.fldStreetName?.trim()) {
      return false;
    }

    return true;
  }

}

