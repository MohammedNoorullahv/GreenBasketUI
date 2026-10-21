// Path: src/app/features/mastertables/tblMenuMaster/tbl-menu-master-add/tbl-menu-master-add.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblMenuMasterAdd } from '../models/tblMenuMaster-Add.model';
import { TblMenuMasterService } from '../services/tbl-menu-master';
import { TblProperty } from '../../tblProperty/models/tblProperty.model';
import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';

@Component({
  selector: 'app-tbl-menu-master-add',
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: './tbl-menu-master-add.html',
  styleUrl: './tbl-menu-master-add.css',
})
export class TblMenuMasterAddComponent implements OnInit, OnDestroy {
  model: TblMenuMasterAdd;
  tblPropertyCategory$?: Observable<TblProperty[]>; // FldFKCategory combo (parent: TblProperty, type 'Category')
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit';
  private addTblMenuMasterSubscription?: Subscription;
  private categorySubscription?: Subscription;
  private categories: TblProperty[] = [];
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  constructor(private tblMenuMasterService: TblMenuMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = this.newModel();
  }

  private newModel(): TblMenuMasterAdd {
    return {
      fldTableOrView: '',
      fldFKCategory: 0,
      fldCategory: '',
      fldMenuName: '',
      fldTableOrViewName: '',
      fldCondition: '',
      fldRoleOfTheMenu: '',
      fldControllerName: '',
      fldIcon: '',
      fldIsProcessProgram: false,
      fldIsActive: true,
      fldCreatedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldCreatedDt: new Date(), // placeholder; server overwrites
    };
  }

  ngOnInit(): void {
    // 'Category' must match a TblPropertyMaster FldDescription exactly
    this.tblPropertyCategory$ = this.tblPropertySharedService.getPropertiesByType('Category');
    this.categorySubscription = this.tblPropertyCategory$.subscribe(list => this.categories = list);

    setTimeout(() => {
      if (this.form && this.form.controls['fldFKCategory']) {
        this.form.controls['fldFKCategory'].markAsTouched();
      }
    });
  }

  // FldCategory is not shown: it stores the text of the selected Category
  onCategoryChange(id: number): void {
    const selected = this.categories.find(c => c.fldId === id);
    this.model.fldCategory = selected?.fldDescription ?? '';
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

    if (!this.model.fldFKCategory || this.model.fldFKCategory <= 0) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.fldTableOrView?.trim() || !this.model.fldMenuName?.trim() || !this.model.fldTableOrViewName?.trim()) {
      return;
    }

    this.onCategoryChange(this.model.fldFKCategory);

    this.isSaving = true;

    this.addTblMenuMasterSubscription = this.tblMenuMasterService.addTblMenuMaster(this.model)
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
            this.router.navigateByUrl('mastertables/tblMenuMaster');
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
      this.form?.controls['fldFKCategory']?.markAsTouched();
      document.getElementById('fldFKCategory')?.focus();
    });
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblMenuMaster');
  }

  ngOnDestroy(): void {
    this.addTblMenuMasterSubscription?.unsubscribe();
    this.categorySubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKCategory || this.model.fldFKCategory <= 0) {
      return false;
    }

    if (!this.model.fldTableOrView?.trim()) {
      return false;
    }

    if (!this.model.fldMenuName?.trim()) {
      return false;
    }

    if (!this.model.fldTableOrViewName?.trim()) {
      return false;
    }

    return true;
  }
}
