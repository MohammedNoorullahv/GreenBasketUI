// Path: src/app/features/transactiontables/tblFeature/tbl-feature-update/tbl-feature-update.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest, shareReplay } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblFeatureService } from '../services/tbl-feature';
import { TblFeatureUpdate } from '../models/tblFeature-Update.model';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';

@Component({
  selector: 'app-tbl-feature-update',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './tbl-feature-update.html',
  styleUrl: './tbl-feature-update.css',
})
export class TblFeatureUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private getTblFeatureSubscription?: Subscription;
  private editTblFeatureSubscription?: Subscription;
  private deleteTblFeatureSubscription?: Subscription;
  private profileSubscription?: Subscription;
  tblFeature?: TblFeatureUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

  @ViewChild('form') form!: NgForm;

  // Values allowed by the database check constraints
  readonly userTypes: string[] = ['Customer', 'Vendor', 'Admin'];
  readonly categories: string[] = ['Existing Feature', 'New Requirement'];
  readonly statuses: string[] = ['Pending', 'Under Review', 'Planned', 'In Progress', 'Resolved', 'Declined', 'Closed'];
  featureTypeOptions: string[] = [];

  // FK grid selection (FldFKProfileId -> TblProfile)
  tblProfile$: Observable<TblProfile[]>;
  private profiles: TblProfile[] = [];
  profileDisplay: string = '';
  profileFilter: string = '';
  showProfilePicker: boolean = false;

  // Used to detect that the admin has written / changed the response
  private originalStatus: string = '';
  private originalAdminResponse: string | null = null;

  constructor(private tblFeatureService: TblFeatureService,
    private tblProfileService: TblProfileService,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
    this.tblProfile$ = this.tblProfileService.getActiveLeanTblProfiles().pipe(shareReplay(1));
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.form && this.form.controls['fldProfileDisplay']) {
        this.form.controls['fldProfileDisplay'].markAsTouched();
      }
    });

    this.profileSubscription = this.tblProfile$.subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        this.refreshProfileDisplay();
        this.cdr.detectChanges();
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
          this.getTblFeatureSubscription?.unsubscribe();
          this.getTblFeatureSubscription = this.tblFeatureService.getTblFeatureById(this.id)
            .subscribe({
              next: (response) => {
                this.tblFeature = response;
                this.originalStatus = response.fldStatus;
                this.originalAdminResponse = response.fldAdminResponse;
                this.setFeatureTypeOptions();
                this.refreshProfileDisplay();
                this.cdr.detectChanges();
              }
            });
        }
      });
  }

  // ---------- FK grid selection ----------
  private refreshProfileDisplay(): void {
    if (!this.tblFeature) {
      return;
    }
    const profile = this.profiles.find(p => p.fldId === this.tblFeature?.fldFKProfileId);
    this.profileDisplay = profile
      ? `${profile.fldFullName} (${profile.fldUserType})`
      : `Profile #${this.tblFeature.fldFKProfileId}`;
  }

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
    if (this.tblFeature) {
      this.tblFeature.fldFKProfileId = profile.fldId;
      this.tblFeature.fldUserType = profile.fldUserType; // snapshot of the submitter's role
    }
    this.profileDisplay = `${profile.fldFullName} (${profile.fldUserType})`;
    this.closeProfilePicker();
  }

  // ---------- Category / Feature Type ----------
  private setFeatureTypeOptions(): void {
    if (this.tblFeature?.fldCategory === 'Existing Feature') {
      this.featureTypeOptions = ['Error', 'Improvement'];
    } else if (this.tblFeature?.fldCategory === 'New Requirement') {
      this.featureTypeOptions = ['New Requirement'];
    } else {
      this.featureTypeOptions = [];
    }
  }

  onCategoryChange(): void {
    if (!this.tblFeature) {
      return;
    }
    this.setFeatureTypeOptions();
    if (this.tblFeature.fldCategory === 'New Requirement') {
      this.tblFeature.fldFeatureType = 'New Requirement';
    } else if (!this.featureTypeOptions.includes(this.tblFeature.fldFeatureType)) {
      this.tblFeature.fldFeatureType = '';
    }
  }

  // null means "leave unchanged" for a PATCH, so a null is kept as null and only typed text is trimmed
  private txt(value: string | null | undefined): string | null {
    return value == null ? null : value.trim();
  }

  OnFormSubmit(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isFormValid(form) || !this.tblFeature) {
      form.control.markAllAsTouched();
      return;
    }

    const responseText = this.tblFeature.fldAdminResponse;
    const hasResponded = !!responseText?.trim() &&
      (responseText !== this.originalAdminResponse || this.tblFeature.fldStatus !== this.originalStatus);

    const TblFeatureUpdateRequest: TblFeatureUpdate = {
      fldId: this.tblFeature.fldId ?? 0,
      fldFKProfileId: this.tblFeature.fldFKProfileId ?? 0,
      fldUserType: this.tblFeature.fldUserType?.trim() ?? '',
      fldCategory: this.tblFeature.fldCategory ?? '',
      fldFeatureType: this.tblFeature.fldFeatureType ?? '',
      fldMenuName: this.txt(this.tblFeature.fldMenuName),
      fldFeatureName: this.txt(this.tblFeature.fldFeatureName),
      fldSubject: this.tblFeature.fldSubject?.trim() ?? '',
      fldDescription: this.tblFeature.fldDescription?.trim() ?? '',
      fldAttachmentPath: this.txt(this.tblFeature.fldAttachmentPath),
      fldAppVersion: this.txt(this.tblFeature.fldAppVersion),
      fldStatus: this.tblFeature.fldStatus ?? 'Pending',
      fldAdminResponse: this.txt(this.tblFeature.fldAdminResponse),
      fldRespondedBy: hasResponded ? 0 : (this.tblFeature.fldRespondedBy ?? null), // AUTH-STAGE-2: server sets this from the logged-in user
      fldRespondedDt: hasResponded ? new Date() : (this.tblFeature.fldRespondedDt ?? null),
      fldIsActive: this.tblFeature.fldIsActive ?? true,
      fldCreatedBy: this.tblFeature.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblFeature.fldCreatedDt ?? new Date(),
      fldModifiedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldModifiedDt: new Date(), // placeholder; server overwrites
    };

    if (this.id) {
      if (this.submitAction === 'Edit') {
        this.editTblFeatureSubscription = this.tblFeatureService.updateTblFeature(TblFeatureUpdateRequest)
          .subscribe({
            next: () => {
              this.toastr.success('Record updated successfully!', 'Success', {
                toastClass: 'ngx-toastr custom-toast'
              });

              this.router.navigateByUrl('transactiontables/tblFeature');
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
          this.deleteTblFeatureSubscription = this.tblFeatureService.deleteTblFeature(TblFeatureUpdateRequest)
            .subscribe({
              next: (response) => {
                if (response.status === 200) {
                  this.toastr.success('Record deleted successfully!', 'Success', {
                    toastClass: 'ngx-toastr custom-toast'
                  });

                  this.router.navigateByUrl('transactiontables/tblFeature');
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
    this.router.navigateByUrl('transactiontables/tblFeature');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.getTblFeatureSubscription?.unsubscribe();
    this.editTblFeatureSubscription?.unsubscribe();
    this.deleteTblFeatureSubscription?.unsubscribe();
    this.profileSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblFeature?.fldFKProfileId || this.tblFeature.fldFKProfileId <= 0) {
      return false;
    }

    if (!this.userTypes.includes(this.tblFeature.fldUserType)) {
      return false;
    }

    if (!this.categories.includes(this.tblFeature.fldCategory)) {
      return false;
    }

    if (!this.featureTypeOptions.includes(this.tblFeature.fldFeatureType)) {
      return false;
    }

    // Menu Name is required for an Existing Feature, optional for a New Requirement
    if (this.tblFeature.fldCategory === 'Existing Feature' && !this.tblFeature.fldMenuName?.trim()) {
      return false;
    }

    if (!this.tblFeature.fldSubject?.trim()) {
      return false;
    }

    if (!this.tblFeature.fldDescription?.trim()) {
      return false;
    }

    if (!this.statuses.includes(this.tblFeature.fldStatus)) {
      return false;
    }

    return true;
  }
}
