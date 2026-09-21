import { Component, OnDestroy, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblItemMaster } from '../models/tblItemMaster.model';
import { TblItemMasterAdd } from '../models/tblItemMaster-Add.model';
import { TblItemMasterService } from '../services/tbl-item-master';

@Component({
  selector: 'app-tbl-item-master-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-item-master-add.html',
  styleUrl: './tbl-item-master-add.css',
})

export class TblItemMasterAddComponent implements OnDestroy {
  model: TblItemMasterAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblItemMasterSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  @ViewChild('itemImageInput') itemImageInput!: ElementRef<HTMLInputElement>;
  isSaving: boolean = false;

  selecteditemImage: File | null = null;

  itemImagePreview: string | null = null;

  constructor(private tblItemMasterService: TblItemMasterService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = {
      fldId: 0,
      fldItemName: '',
      fldItemNameUrdu: '',
      fldItemNameTamil: '',
      fldItemType: '',
      fldCategoryName: '',
      fldBaseUnit: '',
      fldAllowFractionalQuantity: false,
      fldSubUnitLabel: '',
      fldAllowFlatRupeeValueBooking: true,
      fldMinOrderQuantityStep: 0,
      fldItemImagePath: '',
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  onFractionalQuantityChange(allowed: boolean): void {
    if (!allowed) {
      this.model.fldSubUnitLabel = '';
      if (this.model.fldMinOrderQuantityStep != null) {
        this.model.fldMinOrderQuantityStep = Math.trunc(this.model.fldMinOrderQuantityStep);
      }
    }
  }

  onMinOrderQuantityChange(): void {
    if (!this.model.fldAllowFractionalQuantity &&
        this.model.fldMinOrderQuantityStep != null &&
        Number.isFinite(this.model.fldMinOrderQuantityStep)) {
      this.model.fldMinOrderQuantityStep = Math.trunc(this.model.fldMinOrderQuantityStep);
    }
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

    if (!this.model.fldItemName?.trim()) {
      return;
    }

    if (!this.model.fldItemType?.trim()) {
      return;
    }

    if (!this.model.fldCategoryName?.trim()) {
      return;
    }

    if (!this.model.fldBaseUnit?.trim()) {
      return;
    }

    if (!this.model.fldMinOrderQuantityStep || this.model.fldMinOrderQuantityStep <= 0) {
      return;
    }

    if (!this.model.fldAllowFractionalQuantity) {
      this.model.fldSubUnitLabel = '';
    } else if (!this.model.fldSubUnitLabel?.trim()) {
      form.controls['fldSubUnitLabel']?.markAsTouched();
      this.toastr.error('Sub Unit Label is required when fractional quantity is allowed.');
      return;
    }

    if (!this.model.fldAllowFractionalQuantity &&
        !Number.isInteger(this.model.fldMinOrderQuantityStep)) {
      form.controls['fldMinOrderQuantityStep']?.markAsTouched();
      this.toastr.error('Min Order Quantity Step must be a whole number.');
      return;
    }

    this.isSaving = true;

    const formData = new FormData();

    formData.append(
      'FldItemName',
      this.model.fldItemName
    );

    formData.append(
      'FldItemType',
      this.model.fldItemType
    );

    formData.append(
      'FldCategoryName',
      this.model.fldCategoryName
    );

    formData.append(
      'FldBaseUnit',
      this.model.fldBaseUnit
    );

    formData.append(
      'FldAllowFractionalQuantity',
      String(this.model.fldAllowFractionalQuantity)
    );

    formData.append(
      'FldSubUnitLabel',
      this.model.fldSubUnitLabel ?? ''
    );

    formData.append(
      'FldAllowFlatRupeeValueBooking',
      String(this.model.fldAllowFlatRupeeValueBooking)
    );

    formData.append(
      'FldMinOrderQuantityStep',
      String(this.model.fldMinOrderQuantityStep)
    );

    // Attach selected image

    if (this.selecteditemImage) {

      formData.append(
        'ItemImage',
        this.selecteditemImage,
        this.selecteditemImage.name
      );

    }

    // Submit to API

    this.addTblItemMasterSubscription = this.tblItemMasterService.addTblItemMaster(formData)
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

  resetForm(): void {
    // Keep all shared item settings for the next entry.
    this.model.fldId = 0;
    this.model.fldItemName = '';
    this.model.fldItemNameUrdu = '',
    this.model.fldItemNameTamil ='',
    this.model.fldItemImagePath = '';
    this.model.fldCreatedBy = 0;
    this.model.fldCreatedDt = new Date();

    this.selecteditemImage = null;
    this.itemImagePreview = null;
    if (this.itemImageInput) {
      this.itemImageInput.nativeElement.value = '';
    }

    // Reset validation state without resetting the other model values.
    this.form?.controls['fldItemName']?.reset('');
    this.form?.form.markAsPristine();
    this.form?.form.markAsUntouched();

    setTimeout(() => {
      document.getElementById('fldItemName')?.focus();
    });
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblItemMaster');
  }

  ngOnDestroy(): void {
    this.addTblItemMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldItemName?.trim()) {
      return false;
    }

    if (!this.model.fldItemType?.trim()) {
      return false;
    }

    if (!this.model.fldCategoryName?.trim()) {
      return false;
    }

    if (!this.model.fldBaseUnit?.trim()) {
      return false;
    }

    if (!this.model.fldMinOrderQuantityStep || this.model.fldMinOrderQuantityStep <= 0) {
      return false;
    }

    if (this.model.fldAllowFractionalQuantity &&
        !this.model.fldSubUnitLabel?.trim()) {
      return false;
    }

    if (!this.model.fldAllowFractionalQuantity &&
        !Number.isInteger(this.model.fldMinOrderQuantityStep)) {
      return false;
    }

    return true;
  }

  onItemImageSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

      this.toastr.error(
        "Please select a JPG, PNG or WebP image."
      );

      input.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      this.toastr.error(
        "Image size must not exceed 5 MB."
      );

      input.value = "";

      return;
    }

    this.selecteditemImage = file;

    const reader = new FileReader();

    reader.onload = () => {

      this.itemImagePreview =
        reader.result as string;

      this.cdr.detectChanges();

    };

    reader.readAsDataURL(file);

  }

  removeitemImage(
    input: HTMLInputElement
  ): void {

    this.selecteditemImage = null;

    this.itemImagePreview = null;

    this.model.fldItemImagePath = "";

    input.value = "";

  }

}

