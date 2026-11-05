// Path: src/app/features/transactiontables/tblFeature/tbl-feature-add/tbl-feature-add.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, shareReplay } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblFeatureAdd } from '../models/tblFeature-Add.model';
import { TblFeatureService } from '../services/tbl-feature';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';

@Component({
  selector: 'app-tbl-feature-add',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './tbl-feature-add.html',
  styleUrl: './tbl-feature-add.css',
})
export class TblFeatureAddComponent implements OnInit, OnDestroy {
  model: TblFeatureAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblFeatureSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  // Values allowed by the database check constraints
  readonly userTypes: string[] = ['Customer', 'Vendor', 'Admin'];
  readonly categories: string[] = ['Existing Feature', 'New Requirement'];
  featureTypeOptions: string[] = [];

  // FK grid selection (FldFKProfileId -> TblProfile)
  tblProfile$: Observable<TblProfile[]>;
  profileDisplay: string = '';
  profileFilter: string = '';
  showProfilePicker: boolean = false;

  constructor(private tblFeatureService: TblFeatureService,
    private tblProfileService: TblProfileService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = this.newModel();
    this.tblProfile$ = this.tblProfileService.getActiveLeanTblProfiles().pipe(shareReplay(1));
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.form && this.form.controls['fldProfileDisplay']) {
        this.form.controls['fldProfileDisplay'].markAsTouched();
      }
    });
  }

  private newModel(): TblFeatureAdd {
    return {
      fldFKProfileId: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldUserType: '', // AUTH-STAGE-2: server sets this from the logged-in user
      fldCategory: '',
      fldFeatureType: '',
      fldMenuName: null,
      fldFeatureName: null,
      fldSubject: '',
      fldDescription: '',
      fldAttachmentPath: null,
      fldAppVersion: null,
      fldStatus: 'Pending',
      fldAdminResponse: null,
      fldRespondedBy: null,
      fldRespondedDt: null,
      fldIsActive: true,
      fldCreatedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldCreatedDt: new Date(), // placeholder; server overwrites
    };
  }

  // ---------- FK grid selection ----------
  openProfilePicker(): void {
    this.profileFilter = '';
    this.showProfilePicker = true;
  }

  closeProfilePicker(): void {
    this.showProfilePicker = false;
    if (this.form && this.form.controls['fldProfileDisplay']) {
      this.form.controls['fldProfileDisplay'].markAsTouched();
    }
  }

  filterProfiles(profiles: TblProfile[]): TblProfile[] {
    const text = this.profileFilter.trim().toLowerCase();
    if (!text) {
      return profiles;
    }
    return profiles.filter(p =>
      String(p.fldId).includes(text) ||
      (p.fldFullName ?? '').toLowerCase().includes(text) ||
      (p.fldUserType ?? '').toLowerCase().includes(text) ||
      (p.fldContactNumber ?? '').toLowerCase().includes(text));
  }

  selectProfile(profile: TblProfile): void {
    this.model.fldFKProfileId = profile.fldId;
    this.model.fldUserType = profile.fldUserType; // snapshot of the submitter's role
    this.profileDisplay = `${profile.fldFullName} (${profile.fldUserType})`;
    this.closeProfilePicker();
  }

  // ---------- Category / Feature Type ----------
  onCategoryChange(): void {
    if (this.model.fldCategory === 'Existing Feature') {
      this.featureTypeOptions = ['Error', 'Improvement'];
      if (!this.featureTypeOptions.includes(this.model.fldFeatureType)) {
        this.model.fldFeatureType = '';
      }
    } else if (this.model.fldCategory === 'New Requirement') {
      this.featureTypeOptions = ['New Requirement'];
      this.model.fldFeatureType = 'New Requirement';
    } else {
      this.featureTypeOptions = [];
      this.model.fldFeatureType = '';
    }
  }

  private blankToNull(value: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
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

    if (!this.isFormValid(form)) {
      form.control.markAllAsTouched();
      return;
    }

    const payload: TblFeatureAdd = {
      ...this.model,
      fldUserType: this.model.fldUserType.trim(),
      fldSubject: this.model.fldSubject.trim(),
      fldDescription: this.model.fldDescription.trim(),
      fldMenuName: this.blankToNull(this.model.fldMenuName),
      fldFeatureName: this.blankToNull(this.model.fldFeatureName),
      fldAttachmentPath: this.blankToNull(this.model.fldAttachmentPath),
      fldAppVersion: this.blankToNull(this.model.fldAppVersion),
    };

    this.isSaving = true;

    this.addTblFeatureSubscription = this.tblFeatureService.addTblFeature(payload)
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
            this.router.navigateByUrl('transactiontables/tblFeature');
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
    this.profileDisplay = '';
    this.featureTypeOptions = [];
    setTimeout(() => {
      const firstInput = document.getElementById('fldProfileDisplay');
      if (firstInput) {
        firstInput.focus();
      }
    });
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblFeature');
  }

  ngOnDestroy(): void {
    this.addTblFeatureSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKProfileId || this.model.fldFKProfileId <= 0) {
      return false;
    }

    if (!this.userTypes.includes(this.model.fldUserType)) {
      return false;
    }

    if (!this.categories.includes(this.model.fldCategory)) {
      return false;
    }

    if (!this.featureTypeOptions.includes(this.model.fldFeatureType)) {
      return false;
    }

    // Menu Name is required for an Existing Feature, optional for a New Requirement
    if (this.model.fldCategory === 'Existing Feature' && !this.model.fldMenuName?.trim()) {
      return false;
    }

    if (!this.model.fldSubject?.trim()) {
      return false;
    }

    if (!this.model.fldDescription?.trim()) {
      return false;
    }

    return true;
  }
}
