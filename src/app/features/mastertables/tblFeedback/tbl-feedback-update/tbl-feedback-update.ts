// Path: src/app/features/mastertables/tblFeedback/tbl-feedback-update/tbl-feedback-update.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblFeedbackService } from '../services/tbl-feedback';
import { TblFeedbackUpdate } from '../models/tblFeedback-Update.model';
import { TblProfile } from '../../tblProfile/models/tblProfile.model';
import { TblProfileService } from '../../tblProfile/services/tbl-profile';

@Component({
  selector: 'app-tbl-feedback-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-feedback-update.html',
  styleUrl: './tbl-feedback-update.css',
})
export class TblFeedbackUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private getTblFeedbackSubscription?: Subscription;
  private editTblFeedbackSubscription?: Subscription;
  private deleteTblFeedbackSubscription?: Subscription;
  private profilesSubscription?: Subscription;
  tblFeedback?: TblFeedbackUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

  categories: string[] = ['Existing Feature', 'New Requirement'];
  feedbackTypes: string[] = ['Error', 'Improvement', 'New Requirement'];
  statuses: string[] = ['Submitted', 'Under Review', 'Planned', 'In Progress', 'Resolved', 'Declined', 'Closed'];

  // FK picker (FldFKProfileId -> TblProfile, grid selection)
  profiles: TblProfile[] = [];
  showProfilePicker: boolean = false;
  selectedProfileName: string = '';

  @ViewChild('form') form!: NgForm;

  constructor(private tblFeedbackService: TblFeedbackService, private tblProfileService: TblProfileService,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      if (this.form && this.form.controls['fldFKProfileId']) {
        this.form.controls['fldFKProfileId'].markAsTouched();
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
          this.getTblFeedbackSubscription?.unsubscribe();
          this.getTblFeedbackSubscription = this.tblFeedbackService.getTblFeedbackById(this.id)
            .subscribe({
              next: (response) => {
                this.tblFeedback = response;
                this.loadSelectedProfileName(response.fldFKProfileId);
                this.cdr.detectChanges();
              }
            });
        }
      });
  }

  private loadSelectedProfileName(profileId: number): void {
    this.profilesSubscription?.unsubscribe();
    this.profilesSubscription = this.tblProfileService.getActiveLeanTblProfiles()
      .subscribe({
        next: (response) => {
          this.profiles = response;
          const match = response.find(p => p.fldId === profileId);
          this.selectedProfileName = match ? match.fldFullName : '';
          this.cdr.detectChanges();
        }
      });
  }

  openProfilePicker(): void {
    this.showProfilePicker = true;
  }

  closeProfilePicker(): void {
    this.showProfilePicker = false;
  }

  selectProfile(profile: TblProfile): void {
    if (this.tblFeedback) {
      this.tblFeedback.fldFKProfileId = profile.fldId;
      this.tblFeedback.fldUserType = profile.fldUserType;
    }
    this.selectedProfileName = profile.fldFullName;
    this.showProfilePicker = false;
  }

  OnFormSubmit(form: NgForm): void {

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isFormValid(form)) {
      form.control.markAllAsTouched();
      return;
    }

    const TblFeedbackUpdateRequest: TblFeedbackUpdate = {
      fldId: this.tblFeedback?.fldId ?? 0,
      fldFKProfileId: this.tblFeedback?.fldFKProfileId ?? 0,
      fldUserType: this.tblFeedback?.fldUserType ?? '',
      fldCategory: this.tblFeedback?.fldCategory ?? '',
      fldFeedbackType: this.tblFeedback?.fldFeedbackType ?? '',
      fldMenuName: this.tblFeedback?.fldMenuName ?? '',
      fldFeatureName: this.tblFeedback?.fldFeatureName ?? '',
      fldSubject: this.tblFeedback?.fldSubject ?? '',
      fldDescription: this.tblFeedback?.fldDescription ?? '',
      fldAttachmentPath: this.tblFeedback?.fldAttachmentPath ?? '',
      fldAppVersion: this.tblFeedback?.fldAppVersion ?? '',
      fldStatus: this.tblFeedback?.fldStatus ?? 'Submitted',
      fldAdminResponse: this.tblFeedback?.fldAdminResponse ?? '',
      fldRespondedBy: this.tblFeedback?.fldRespondedBy,
      fldRespondedDt: this.tblFeedback?.fldRespondedDt,
      fldIsActive: this.tblFeedback?.fldIsActive ?? true,
      fldCreatedBy: this.tblFeedback?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblFeedback?.fldCreatedDt ?? new Date(),
      fldModifiedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldModifiedDt: new Date(), // placeholder; server overwrites
    };

    if (this.id) {
      if (this.submitAction === 'Edit') {
        this.editTblFeedbackSubscription = this.tblFeedbackService.updateTblFeedback(TblFeedbackUpdateRequest)
          .subscribe({
            next: () => {
              this.toastr.success('Record updated successfully!', 'Success', {
                toastClass: 'ngx-toastr custom-toast'
              });

              this.router.navigateByUrl('mastertables/tblFeedback');
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
          this.deleteTblFeedbackSubscription = this.tblFeedbackService.deleteTblFeedback(TblFeedbackUpdateRequest)
            .subscribe({
              next: (response) => {
                if (response.status === 200) {
                  this.toastr.success('Record deleted successfully!', 'Success', {
                    toastClass: 'ngx-toastr custom-toast'
                  });

                  this.router.navigateByUrl('mastertables/tblFeedback');
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
    this.router.navigateByUrl('mastertables/tblFeedback');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.getTblFeedbackSubscription?.unsubscribe();
    this.editTblFeedbackSubscription?.unsubscribe();
    this.deleteTblFeedbackSubscription?.unsubscribe();
    this.profilesSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    const m = this.tblFeedback;

    if (!m?.fldFKProfileId || m.fldFKProfileId <= 0) {
      return false;
    }

    if (!m.fldUserType?.trim()) {
      return false;
    }

    if (!m.fldCategory?.trim()) {
      return false;
    }

    if (!m.fldFeedbackType?.trim()) {
      return false;
    }

    // Menu Name is required for Existing Feature feedback
    if (m.fldCategory === 'Existing Feature' && !m.fldMenuName?.trim()) {
      return false;
    }

    if (!m.fldSubject?.trim()) {
      return false;
    }

    if (!m.fldDescription?.trim()) {
      return false;
    }

    if (!m.fldStatus?.trim()) {
      return false;
    }

    return true;
  }
}
