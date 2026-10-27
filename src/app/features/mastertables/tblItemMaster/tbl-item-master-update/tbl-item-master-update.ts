// Path: src/app/features/mastertables/tblItemMaster/tbl-item-master-update/tbl-item-master-update.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblItemMasterService } from '../services/tbl-item-master';
import { TblProperty } from '../../tblProperty/models/tblProperty.model';
import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';

import { TblItemMasterUpdate } from '../models/tblItemMaster-Update.model';

@Component({
  selector: 'app-tbl-item-master-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-item-master-update.html',
  styleUrl: './tbl-item-master-update.css',
})
export class TblItemMasterUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private getTblItemMasterSubscription?: Subscription;
  private editTblItemMasterSubscription?: Subscription;
  private deleteTblItemMasterSubscription?: Subscription;
  private uploadImageSubscription?: Subscription;
  tblItemMaster?: TblItemMasterUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit
  isUploading: boolean = false;
  imageError: string = '';

  // FK combo sources (parent = TblProperty, type text must match a TblPropertyMaster FldDescription)
  tblPropertyCategoryName$?: Observable<TblProperty[]>;
  tblPropertyItemType$?: Observable<TblProperty[]>;
  tblPropertyItem$?: Observable<TblProperty[]>;
  tblPropertyBaseUnit$?: Observable<TblProperty[]>;
  tblPropertyFractionalUnit$?: Observable<TblProperty[]>;

  @ViewChild('form') form!: NgForm;
  isDeleteDialogOpen = false;
  isSaving = false;

  private pendingDeleteRequest?: TblItemMasterUpdate;

  constructor(private tblItemMasterService: TblItemMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.tblPropertyCategoryName$ = this.tblPropertySharedService.getPropertiesByType('Item Category');
    this.tblPropertyItem$ = this.tblPropertySharedService.getPropertiesByType('Item');
    this.tblPropertyItemType$ = this.tblPropertySharedService.getPropertiesByType('Item Type');
    this.tblPropertyBaseUnit$ = this.tblPropertySharedService.getPropertiesByType('Unit of Measurement');
    this.tblPropertyFractionalUnit$ = this.tblPropertySharedService.getPropertiesByType('Unit of Measurement');

    setTimeout(() => {
      if (this.form && this.form.controls['fldFKCategoryName']) {
        this.form.controls['fldFKCategoryName'].markAsTouched();
      }
    });

    this.paramSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ])
      .subscribe(([params, queryParams]) => {
        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;
        this.actionType = queryParams['action'] === 'Delete' ? 'Delete' : 'Edit';

        if (this.id) {
          this.getTblItemMasterSubscription?.unsubscribe();
          this.getTblItemMasterSubscription = this.tblItemMasterService.getTblItemMasterById(this.id)
            .subscribe({
              next: (response) => {
                this.tblItemMaster = response;
                this.cdr.detectChanges();
              }
            });
        }
      });
  }

  // ---- FK combo handlers: store the selected Id in FldFK<X> and its text in Fld<X> ----
  onCategoryChange(id: number, list: TblProperty[]): void {
    if (!this.tblItemMaster) { return; }
    const selected = list.find(p => p.fldId === Number(id));
    this.tblItemMaster.fldFKCategoryName = selected ? selected.fldId : 0;
    this.tblItemMaster.fldCategoryName = selected ? selected.fldDescription : '';
  }

  onItemChange(id: number, list: TblProperty[]): void {
    if (!this.tblItemMaster) return;
    this.tblItemMaster.fldFKItem = list.find(p => p.fldId === Number(id))?.fldId ?? 0;
  }

  onItemTypeChange(id: number, list: TblProperty[]): void {
    if (!this.tblItemMaster) { return; }
    const selected = list.find(p => p.fldId === Number(id));
    this.tblItemMaster.fldFKItemType = selected ? selected.fldId : 0;
    this.tblItemMaster.fldItemType = selected ? selected.fldDescription : '';
  }

  onBaseUnitChange(id: number, list: TblProperty[]): void {
    if (!this.tblItemMaster) { return; }
    const selected = list.find(p => p.fldId === Number(id));
    this.tblItemMaster.fldFKBaseUnit = selected ? selected.fldId : 0;
    this.tblItemMaster.fldBaseUnit = selected ? selected.fldDescription : '';
  }

  onFractionalUnitChange(id: number, list: TblProperty[]): void {
    if (!this.tblItemMaster) { return; }
    const selected = list.find(p => p.fldId === Number(id));
    this.tblItemMaster.fldFKFractionalUnit = selected ? selected.fldId : 0;
    this.tblItemMaster.fldFractionalUnit = selected ? selected.fldDescription : '';
  }

  // Sub Measuring Unit only applies when fractional quantity is allowed
  onAllowFractionalChange(allowed: boolean): void {
    if (!this.tblItemMaster) { return; }
    if (!allowed) {
      this.tblItemMaster.fldFKFractionalUnit = 0;
      this.tblItemMaster.fldFractionalUnit = '';
    }
  }

  // ---- Image upload (JPG / PNG / WebP, max 5 MB) ----
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again

    if (!file || !this.tblItemMaster) {
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
          if (this.tblItemMaster) {
            this.tblItemMaster.fldItemImagePath = response.path;
          }
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
          this.cdr.detectChanges();
        }
      });
  }

  removeImage(): void {
    if (!this.tblItemMaster) { return; }
    this.tblItemMaster.fldItemImagePath = '';
    this.imageError = '';
  }

  imageUrl(path?: string | null): string {
    return this.tblItemMasterService.getItemImageUrl(path);
  }

  OnFormSubmit(form: NgForm): void {

    if (this.isSaving || this.isUploading || !this.tblItemMaster || !this.id) {
      return;
    }

    if (this.submitAction === 'Delete') {
      this.pendingDeleteRequest = this.buildUpdateRequest();
      this.isDeleteDialogOpen = true;
      return;
    }

    if (!this.isFormValid(form)) {
      form.control.markAllAsTouched();
      return;
    }

    const TblItemMasterUpdateRequest: TblItemMasterUpdate = this.buildUpdateRequest();

    if (!this.id) {
      return;
    }

    this.isSaving = true;
    this.editTblItemMasterSubscription = this.tblItemMasterService.updateTblItemMaster(TblItemMasterUpdateRequest)
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.toastr.success('Record updated successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          this.router.navigateByUrl('mastertables/tblItemMaster');
        },
        error: (err) => {
          this.isSaving = false;
          this.cdr.detectChanges();
          const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

          this.toastr.error(errorMsg, 'Error', {
            toastClass: 'ngx-toastr custom-toast error-toast'
          });

          console.error('API Error:', err);
          this.cdr.detectChanges();
        }
      });
  }

  private buildUpdateRequest(): TblItemMasterUpdate {
    return {
      fldId: this.tblItemMaster?.fldId ?? this.id ?? 0,
      fldItemName: this.tblItemMaster?.fldItemName ?? '',
      fldItemNameUrdu: this.tblItemMaster?.fldItemNameUrdu ?? '',
      fldItemNameTamil: this.tblItemMaster?.fldItemNameTamil ?? '',
      fldItemType: this.tblItemMaster?.fldItemType ?? '',
      fldCategoryName: this.tblItemMaster?.fldCategoryName ?? '',
      fldBaseUnit: this.tblItemMaster?.fldBaseUnit ?? '',
      fldAllowFractionalQuantity: this.tblItemMaster?.fldAllowFractionalQuantity ?? false,
      fldFractionalUnit: this.tblItemMaster?.fldFractionalUnit ?? '',
      fldSubUnitLabel: this.tblItemMaster?.fldSubUnitLabel ?? '',
      fldAllowFlatRupeeValueBooking: this.tblItemMaster?.fldAllowFlatRupeeValueBooking ?? false,
      fldMinOrderQuantityStep: this.tblItemMaster?.fldMinOrderQuantityStep ?? 1,
      fldItemImagePath: this.tblItemMaster?.fldItemImagePath ?? '',
      fldFKItem: this.tblItemMaster?.fldFKItem ?? 0,
      fldFKItemType: this.tblItemMaster?.fldFKItemType ?? 0,
      fldFKCategoryName: this.tblItemMaster?.fldFKCategoryName ?? 0,
      fldFKBaseUnit: this.tblItemMaster?.fldFKBaseUnit ?? 0,
      fldFKFractionalUnit: this.tblItemMaster?.fldFKFractionalUnit ?? 0,
      fldIsOpenPackingItem: this.tblItemMaster?.fldIsOpenPackingItem ?? true,
      fldFKGroupId: this.tblItemMaster?.fldFKGroupId ?? 0,
      fldConversionRatetoBaseUnit: this.tblItemMaster?.fldConversionRatetoBaseUnit ?? 0,
      fldIsActive: this.tblItemMaster?.fldIsActive ?? true,
      fldCreatedBy: this.tblItemMaster?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblItemMaster?.fldCreatedDt ?? new Date(),
      fldModifiedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldModifiedDt: new Date(), // placeholder; server overwrites
    };

  }

  confirmDelete(): void {
    if (!this.pendingDeleteRequest || this.isSaving || !this.id) return;
    this.isSaving = true;
    this.deleteTblItemMasterSubscription = this.tblItemMasterService
      .deleteTblItemMaster(this.pendingDeleteRequest).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDeleteDialogOpen = false;
          this.pendingDeleteRequest = undefined;
          this.toastr.success('Record deleted successfully!', 'Success');
          void this.router.navigateByUrl('mastertables/tblItemMaster');
        },
        error: (err) => {
          this.isSaving = false;
          this.toastr.error(err?.error?.message || 'Unable to delete this item.', 'Error');
          this.cdr.detectChanges();
        }
      });
  }

  cancelDelete(): void {
    if (this.isSaving) return;
    this.isDeleteDialogOpen = false;
    this.pendingDeleteRequest = undefined;
    this.submitAction = 'Edit';
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblItemMaster');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.getTblItemMasterSubscription?.unsubscribe();
    this.editTblItemMasterSubscription?.unsubscribe();
    this.deleteTblItemMasterSubscription?.unsubscribe();
    this.uploadImageSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblItemMaster?.fldFKCategoryName || this.tblItemMaster.fldFKCategoryName <= 0 || !this.tblItemMaster.fldCategoryName?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldFKItemType || this.tblItemMaster.fldFKItemType <= 0 || !this.tblItemMaster.fldItemType?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldItemName?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldFKBaseUnit || this.tblItemMaster.fldFKBaseUnit <= 0 || !this.tblItemMaster.fldBaseUnit?.trim()) {
      return false;
    }

    if (!this.tblItemMaster?.fldMinOrderQuantityStep || this.tblItemMaster.fldMinOrderQuantityStep <= 0) {
      return false;
    }

    return true;
  }
}
