// Path: src/app/features/mastertables/tblItemMaster/tbl-item-master-add/tbl-item-master-add.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblItemMasterAdd } from '../models/tblItemMaster-Add.model';
import { TblItemMasterService } from '../services/tbl-item-master';
import { TblProperty } from '../../tblProperty/models/tblProperty.model';
import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';


@Component({
  selector: 'app-tbl-item-master-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-item-master-add.html',
  styleUrl: './tbl-item-master-add.css',
})
export class TblItemMasterAddComponent implements OnInit, OnDestroy {
  model: TblItemMasterAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblItemMasterSubscription?: Subscription;
  private uploadImageSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;
  isUploading: boolean = false;
  imageError: string = '';

  // FK combo sources (parent = TblProperty, type text must match a TblPropertyMaster FldDescription)
  tblPropertyCategoryName$?: Observable<TblProperty[]>;
  tblPropertyItemType$?: Observable<TblProperty[]>;
  tblPropertyItem$?: Observable<TblProperty[]>;
  tblPropertyBaseUnit$?: Observable<TblProperty[]>;
  tblPropertyFractionalUnit$?: Observable<TblProperty[]>;

  constructor(private tblItemMasterService: TblItemMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = this.newModel();
  }

  private newModel(): TblItemMasterAdd {
    return {
      fldItemName: '',
      fldItemNameUrdu: '',
      fldItemNameTamil: '',
      fldItemType: '',
      fldCategoryName: '',
      fldBaseUnit: '',
      fldAllowFractionalQuantity: false,
      fldFractionalUnit: '',
      fldSubUnitLabel: '',
      fldAllowFlatRupeeValueBooking: true,
      fldMinOrderQuantityStep: 1,
      fldItemImagePath: '',
      fldFKItem: 0,
      fldFKItemType: 0,
      fldFKCategoryName: 0,
      fldFKBaseUnit: 0,
      fldFKFractionalUnit: 0,
      fldIsOpenPackingItem: true,
      fldFKGroupId: 0,
      fldConversionRatetoBaseUnit: 0,
      fldIsActive: true,
      fldCreatedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldCreatedDt: new Date(), // placeholder; server overwrites
    };
  }

  ngOnInit(): void {
    this.tblPropertyCategoryName$ = this.tblPropertySharedService.getPropertiesByType('Item Category');
    this.tblPropertyItemType$ = this.tblPropertySharedService.getPropertiesByType('Item Type');
    this.tblPropertyItem$ = this.tblPropertySharedService.getPropertiesByType('Item');
    this.tblPropertyBaseUnit$ = this.tblPropertySharedService.getPropertiesByType('Unit of Measurement');
    this.tblPropertyFractionalUnit$ = this.tblPropertySharedService.getPropertiesByType('Unit of Measurement');

    setTimeout(() => {
      if (this.form && this.form.controls['fldFKCategoryName']) {
        this.form.controls['fldFKCategoryName'].markAsTouched();
      }
    });
  }

  // ---- FK combo handlers: store the selected Id in FldFK<X> and its text in Fld<X> ----
  onCategoryChange(id: number, list: TblProperty[]): void {
    const selected = list.find(p => p.fldId === Number(id));
    this.model.fldFKCategoryName = selected ? selected.fldId : 0;
    this.model.fldCategoryName = selected ? selected.fldDescription : '';
  }

  onItemTypeChange(id: number, list: TblProperty[]): void {
    const selected = list.find(p => p.fldId === Number(id));
    this.model.fldFKItemType = selected ? selected.fldId : 0;
    this.model.fldItemType = selected ? selected.fldDescription : '';
  }

  onBaseUnitChange(id: number, list: TblProperty[]): void {
    const selected = list.find(p => p.fldId === Number(id));
    this.model.fldFKBaseUnit = selected ? selected.fldId : 0;
    this.model.fldBaseUnit = selected ? selected.fldDescription : '';
  }

  onFractionalUnitChange(id: number, list: TblProperty[]): void {
    const selected = list.find(p => p.fldId === Number(id));
    this.model.fldFKFractionalUnit = selected ? selected.fldId : 0;
    this.model.fldFractionalUnit = selected ? selected.fldDescription : '';
  }

  // Sub Measuring Unit only applies when fractional quantity is allowed
  onAllowFractionalChange(allowed: boolean): void {
    if (!allowed) {
      this.model.fldFKFractionalUnit = 0;
      this.model.fldFractionalUnit = '';
    }
  }

  // ---- Image upload (JPG / PNG / WebP, max 5 MB) ----
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.imageError = 'Only JPG, PNG or WebP images are allowed.';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'Image size must be 5 MB or less.';
      return;
    }

    this.imageError = '';
    this.isUploading = true;
    this.uploadImageSubscription?.unsubscribe();
    this.uploadImageSubscription = this.tblItemMasterService.uploadTblItemMasterImage(file)
      .subscribe({
        next: (response) => {
          this.model.fldItemImagePath = response.path;
          this.isUploading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUploading = false;

          const errorMsg = err?.error?.message || err?.error || 'Image upload failed';

          this.toastr.error(errorMsg, 'Error', {
            toastClass: 'ngx-toastr custom-toast error-toast'
          });

          console.error('API Error:', err);
        }
      });
  }

  removeImage(): void {
    this.model.fldItemImagePath = '';
    this.imageError = '';
  }

  imageUrl(path?: string | null): string {
    return this.tblItemMasterService.getItemImageUrl(path);
  }

  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {

    if (this.isSaving || this.isUploading) {
      return;
    }

    this.submitAction = action;

    if (!this.isFormValid(form)) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    this.addTblItemMasterSubscription = this.tblItemMasterService.addTblItemMaster(this.model)
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
            this.router.navigateByUrl('mastertables/tblItemMaster');
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
    this.imageError = '';
    this.form?.resetForm(this.model);
    setTimeout(() => {
      if (this.form && this.form.controls['fldFKCategoryName']) {
        this.form.controls['fldFKCategoryName'].markAsTouched();
      }
      const firstInput = document.getElementById('fldFKCategoryName');
      if (firstInput) {
        firstInput.focus();
      }
    });
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblItemMaster');
  }

  ngOnDestroy(): void {
    this.addTblItemMasterSubscription?.unsubscribe();
    this.uploadImageSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKCategoryName || this.model.fldFKCategoryName <= 0 || !this.model.fldCategoryName?.trim()) {
      return false;
    }

    if (!this.model.fldFKItemType || this.model.fldFKItemType <= 0 || !this.model.fldItemType?.trim()) {
      return false;
    }

    if (!this.model.fldItemName?.trim()) {
      return false;
    }

    if (!this.model.fldFKBaseUnit || this.model.fldFKBaseUnit <= 0 || !this.model.fldBaseUnit?.trim()) {
      return false;
    }

    if (!this.model.fldMinOrderQuantityStep || this.model.fldMinOrderQuantityStep <= 0) {
      return false;
    }

    return true;
  }
}
