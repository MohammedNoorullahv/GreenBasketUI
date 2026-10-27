// Path: src/app/features/mastertables/tblFeedback/tbl-feedback-add/tbl-feedback-add.ts
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { finalize, Subscription, timeout } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TblFeedbackAdd } from '../models/tblFeedback-Add.model';
import { TblFeedbackService } from '../services/tbl-feedback';
import { APP_VERSION } from '../../../../shared/app-version';

@Component({
  selector: 'app-tbl-feedback-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-feedback-add.html',
  styleUrl: './tbl-feedback-add.css',
})
export class TblFeedbackAddComponent implements OnInit, OnDestroy {
  model: TblFeedbackAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit';
  private addTblFeedbackSubscription?: Subscription;
  private destroyed = false;
  @ViewChild('form') form!: NgForm;
  isSaving = false;
  sessionError = '';
  validationMessage = '';
  categories = ['Existing Feature', 'New Requirement'];
  readonly statuses = ['Submitted'];

  constructor(
    private tblFeedbackService: TblFeedbackService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.model = this.newModel();
  }

  private newModel(): TblFeedbackAdd {
    return {
      fldFKProfileId: 0, fldUserType: '', fldCategory: '', fldFeedbackType: '',
      fldMenuName: '', fldFeatureName: '', fldSubject: '', fldDescription: '',
      fldAttachmentPath: '', fldAppVersion: APP_VERSION.version,
      fldStatus: 'Submitted', fldAdminResponse: '', fldIsActive: true,
      fldCreatedBy: 0, fldCreatedDt: new Date()
    };
  }

  ngOnInit(): void {
    this.loadLoggedInProfile();
  }

  private loadLoggedInProfile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    this.sessionError = '';
    this.model.fldFKProfileId = 0;
    this.model.fldUserType = '';
    this.model.fldCreatedBy = 0;
    try {
      if (!sessionStorage.getItem('gbAccessToken')) throw new Error('Missing session');
      const raw = sessionStorage.getItem('gbProfile');
      if (!raw) throw new Error('Missing profile');
      const profile: unknown = JSON.parse(raw);
      if (!profile || typeof profile !== 'object') throw new Error('Invalid profile');
      const p = profile as { fldId?: unknown; fldUserType?: unknown };
      const id = Number(p.fldId);
      const role = typeof p.fldUserType === 'string' ? p.fldUserType : '';
      if (!Number.isSafeInteger(id) || id <= 0 || !['Customer', 'Vendor', 'Admin'].includes(role)) {
        throw new Error('Invalid profile');
      }
      this.model.fldFKProfileId = id;
      this.model.fldUserType = role;
      this.model.fldCreatedBy = id;
      return true;
    } catch {
      this.sessionError = 'Your login session is unavailable. Please log in again before submitting feedback.';
      return false;
    }
  }

  get feedbackTypes(): string[] {
    return this.model.fldCategory === 'Existing Feature' ? ['Error', 'Improvement'] :
      this.model.fldCategory === 'New Requirement' ? ['New Requirement'] : [];
  }

  onCategoryChange(): void {
    this.validationMessage = '';
    if (this.model.fldCategory === 'New Requirement') this.model.fldFeedbackType = 'New Requirement';
    else if (!this.feedbackTypes.includes(this.model.fldFeedbackType)) this.model.fldFeedbackType = '';
  }

  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {
    if (this.isSaving || !this.loadLoggedInProfile()) return;
    // Add mode always uses these values, regardless of form/DOM changes.
    this.model.fldStatus = 'Submitted';
    this.model.fldAdminResponse = '';
    this.model.fldIsActive = true;
    this.model.fldAppVersion = APP_VERSION.version;
    this.model.fldSubject = this.model.fldSubject.trim();
    this.model.fldDescription = this.model.fldDescription.trim();
    this.validationMessage = '';
    if (!this.isFormValid(form)) {
      form.control.markAllAsTouched();
      this.validationMessage = 'Complete the required category, feedback type, menu (for an existing feature), subject and description.';
      return;
    }
    this.submitAction = action;
    this.isSaving = true;
    this.addTblFeedbackSubscription = this.tblFeedbackService.addTblFeedback(this.model)
      .pipe(timeout(30000), finalize(() => {
        this.isSaving = false;
        if (!this.destroyed) this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Record saved successfully!', 'Success', { toastClass: 'ngx-toastr custom-toast' });
          if (action === 'SaveAndAddNew') this.resetForm();
          else void this.router.navigateByUrl('/mastertables/tblFeedback');
        },
        error: (err: unknown) => {
          const e = err as { error?: unknown };
          const body = e?.error;
          const message = typeof body === 'string' ? body :
            body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
              ? body.message : 'Unable to save feedback. Please retry.';
          this.toastr.error(message, 'Error', { toastClass: 'ngx-toastr custom-toast error-toast' });
        }
      });
  }

  resetForm(): void {
    this.model = this.newModel();
    this.validationMessage = '';
    this.loadLoggedInProfile();
    this.form?.resetForm(this.model);
  }

  backToHome(): void {
    void this.router.navigateByUrl('/mastertables/tblFeedback');
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.addTblFeedbackSubscription?.unsubscribe();
  }

  isFormValid(form: NgForm): boolean {
    return !form.invalid && this.model.fldFKProfileId > 0 &&
      ['Customer', 'Vendor', 'Admin'].includes(this.model.fldUserType) &&
      this.categories.includes(this.model.fldCategory) &&
      this.feedbackTypes.includes(this.model.fldFeedbackType) &&
      (this.model.fldCategory !== 'Existing Feature' || !!this.model.fldMenuName?.trim()) &&
      !!this.model.fldSubject?.trim() && !!this.model.fldDescription?.trim();
  }
}
