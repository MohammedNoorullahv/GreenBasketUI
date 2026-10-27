// Path: src/app/features/mastertables/tblPropertyMaster/tbl-property-master-add/tbl-property-master-add.ts
import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblPropertyMasterAdd } from '../models/tblPropertyMaster-Add.model';
import { TblPropertyMasterService } from '../services/tbl-property-master';

import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';

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
  isLoading = true;
  loadError = '';
  private readonly subscriptions = new Subscription();
  private focusTimer?: ReturnType<typeof setTimeout>;
  @ViewChild('descriptionInput') descriptionInput?: ElementRef<HTMLInputElement>;

  constructor(private tblPropertyMasterService: TblPropertyMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object) {
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
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.loadError = '';
    this.subscriptions.add(this.tblPropertySharedService.ensureReady().subscribe({
      next: () => {
        this.isLoading = false;
        this.model.fldSlNo = this.tblPropertySharedService.getNextPropertyMasterSlNo();
        this.focusDescription();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'Unable to load property data. Please retry.';
        this.cdr.detectChanges();
      }
    }));
  }

  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {

    if (this.isSaving || this.isLoading || !!this.loadError) {
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
    const submitted = { ...this.model };

    this.addTblPropertyMasterSubscription = this.tblPropertyMasterService.addTblPropertyMaster(submitted)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.tblPropertySharedService.propertyMasterSaved(submitted.fldSlNo);
          this.tblPropertySharedService.refreshProperties();
          
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

  resetForm(): void {
    // Keep dropdown and flags; clear only Description and Short Name.
    this.model = {
      ...this.model,
      fldDescription: '',
      fldShortName: '',
      fldSlNo: this.tblPropertySharedService.getNextPropertyMasterSlNo()
    };
    this.form?.resetForm(this.model);
    this.focusDescription();
  }

  private focusDescription(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.focusTimer) clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => this.descriptionInput?.nativeElement.focus());
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblPropertyMaster');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.focusTimer) clearTimeout(this.focusTimer);
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
