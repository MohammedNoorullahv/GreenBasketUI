// Path: src/app/features/mastertables/tblProperty/tbl-property-add/tbl-property-add.ts
import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { Observable, Subscription, asyncScheduler, observeOn } from 'rxjs';
import { AsyncPipe, CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblPropertyAdd } from '../models/tblProperty-Add.model';
import { TblPropertyService } from '../services/tbl-property';
import { TblPropertyMaster } from '../../tblPropertyMaster/models/tblPropertyMaster.model';
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
  isLoading = true;
  loadError = '';
  private readonly subscriptions = new Subscription();
  private focusTimer?: ReturnType<typeof setTimeout>;
  @ViewChild('descriptionInput') descriptionInput?: ElementRef<HTMLInputElement>;

  constructor(private tblPropertyService: TblPropertyService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object) {
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
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading = true;
    this.loadError = '';
    this.subscriptions.add(this.tblPropertySharedService.ensureReady()
      .pipe(observeOn(asyncScheduler))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.tblPropertyMaster$ = this.tblPropertySharedService.getPropertyMasters();
          this.onPropertyMasterChange(this.model.fldFKProperty);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.loadError = 'Unable to load property data. Please retry.';
          this.cdr.markForCheck();
        }
      }));
  }

  onPropertyMasterChange(parentId: number): void {
    this.model.fldFKProperty = Number(parentId);
    this.model.fldSlNo = this.isLoading || this.loadError ? 0 :
      this.tblPropertySharedService.getNextPropertySlNo(this.model.fldFKProperty);
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
    const submitted = { ...this.model };

    this.addTblPropertySubscription = this.tblPropertyService.addTblProperty(submitted)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.tblPropertySharedService.propertySaved(submitted.fldFKProperty, submitted.fldSlNo);
          this.tblPropertySharedService.refreshProperties();

          this.toastr.success('Record saved successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          if (this.submitAction === 'SaveAndAddNew') {
            this.resetForm();
            this.cdr.markForCheck();
          } else {
            this.router.navigateByUrl('mastertables/tblProperty');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.cdr.markForCheck();

          const body = err?.error;

          const validationErrors =
            body && typeof body === 'object' && body.errors
              ? Object.values(body.errors).flat().join('\n')
              : '';

          const errorMsg =
            validationErrors ||
            (typeof body === 'string'
              ? body
              : body?.message || body?.detail || body?.title) ||
            'Unable to save the property.';

          this.toastr.error(errorMsg, 'Error', {
            toastClass: 'ngx-toastr custom-toast error-toast',
            timeOut: 10000
          });

          console.error('Property save failed:', {
            status: err.status,
            response: body
          });
        }
      });
  }

  resetForm(): void {
    // Keep dropdown and flags; clear only Description and Short Name.
    this.model = {
      ...this.model,
      fldDescription: '',
      fldShortName: '',
      fldSlNo: this.tblPropertySharedService.getNextPropertySlNo(this.model.fldFKProperty)
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
    this.router.navigateByUrl('mastertables/tblProperty');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.focusTimer) clearTimeout(this.focusTimer);
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
