// Path: src/app/features/mastertables/tblMenuMaster/tbl-menu-master-update/tbl-menu-master-update.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblMenuMasterService } from '../services/tbl-menu-master';
import { TblMenuMasterUpdate } from '../models/tblMenuMaster-Update.model';
import { TblProperty } from '../../tblProperty/models/tblProperty.model';
import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared-service';
// import { TblPropertySharedservice } from '../../../../shared/services/tbl-property-shared';

@Component({
  selector: 'app-tbl-menu-master-update',
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: './tbl-menu-master-update.html',
  styleUrl: './tbl-menu-master-update.css',
})
export class TblMenuMasterUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private getTblMenuMasterSubscription?: Subscription;
  private editTblMenuMasterSubscription?: Subscription;
  private deleteTblMenuMasterSubscription?: Subscription;
  private categorySubscription?: Subscription;
  private categories: TblProperty[] = [];
  tblMenuMaster?: TblMenuMasterUpdate;
  tblPropertyCategory$?: Observable<TblProperty[]>; // FldFKCategory combo (parent: TblProperty, type 'Category')
  actionType: string = '';
  isSaving: boolean = false;

  @ViewChild('form') form!: NgForm;

  constructor(private tblMenuMasterService: TblMenuMasterService,
    private tblPropertySharedService: TblPropertySharedservice,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    // 'Category' must match a TblPropertyMaster FldDescription exactly
    this.tblPropertyCategory$ = this.tblPropertySharedService.getPropertiesByType('Category');
    this.categorySubscription = this.tblPropertyCategory$.subscribe(list => this.categories = list);

    this.paramSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ])
      .subscribe(([params, queryParams]) => {
        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;
        this.actionType = queryParams['action'];

        if (this.id) {
          this.getTblMenuMasterSubscription?.unsubscribe();
          this.getTblMenuMasterSubscription = this.tblMenuMasterService.getTblMenuMasterById(this.id)
            .subscribe({
              next: (response) => {
                this.tblMenuMaster = response;
                this.cdr.detectChanges();
                // first field of the form
                setTimeout(() => this.form?.controls['fldFKCategory']?.markAsTouched());
              }
            });
        }
      });
  }

  // FldCategory is not shown: it stores the text of the selected Category
  onCategoryChange(id: number): void {
    if (!this.tblMenuMaster) {
      return;
    }
    const selected = this.categories.find(c => c.fldId === id);
    if (selected) {
      this.tblMenuMaster.fldCategory = selected.fldDescription;
    }
  }

  OnFormSubmit(form: NgForm): void {

    if (this.isSaving) {
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.isFormValid(form)) {
      form.control.markAllAsTouched();
      return;
    }

    this.onCategoryChange(this.tblMenuMaster?.fldFKCategory ?? 0);

    const request: TblMenuMasterUpdate = {
      fldId: this.tblMenuMaster?.fldId ?? 0,
      fldTableOrView: this.tblMenuMaster?.fldTableOrView ?? '',
      fldFKCategory: this.tblMenuMaster?.fldFKCategory ?? 0,
      fldCategory: this.tblMenuMaster?.fldCategory ?? '',
      fldMenuName: this.tblMenuMaster?.fldMenuName ?? '',
      fldTableOrViewName: this.tblMenuMaster?.fldTableOrViewName ?? '',
      fldCondition: this.tblMenuMaster?.fldCondition ?? '',
      fldRoleOfTheMenu: this.tblMenuMaster?.fldRoleOfTheMenu ?? '',
      fldControllerName: this.tblMenuMaster?.fldControllerName ?? '',
      fldIcon: this.tblMenuMaster?.fldIcon ?? '',
      fldIsProcessProgram: this.tblMenuMaster?.fldIsProcessProgram ?? false,
      fldIsActive: this.tblMenuMaster?.fldIsActive ?? true,
      fldCreatedBy: this.tblMenuMaster?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblMenuMaster?.fldCreatedDt ?? new Date(),
      fldModifiedBy: 0, // AUTH-STAGE-2: server sets this from the logged-in user
      fldModifiedDt: new Date(), // placeholder; server overwrites
    };

    if (!this.id) {
      return;
    }

    if (this.actionType === 'Edit') {
      this.isSaving = true;
      this.editTblMenuMasterSubscription?.unsubscribe();
      this.editTblMenuMasterSubscription = this.tblMenuMasterService.updateTblMenuMaster(request)
        .subscribe({
          next: () => {
            this.isSaving = false;

            this.toastr.success('Record updated successfully!', 'Success', {
              toastClass: 'ngx-toastr custom-toast'
            });

            this.router.navigateByUrl('mastertables/tblMenuMaster');
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
    } else if (this.actionType === 'Delete') {

      const proceed = confirm('R U Sure, U Want to Delete the selected Record?');

      if (proceed) {
        this.isSaving = true;
        this.deleteTblMenuMasterSubscription?.unsubscribe();
        this.deleteTblMenuMasterSubscription = this.tblMenuMasterService.deleteTblMenuMaster(request)
          .subscribe({
            next: (response) => {
              this.isSaving = false;
              if (response.status === 200) {
                this.toastr.success('Record deleted successfully!', 'Success', {
                  toastClass: 'ngx-toastr custom-toast'
                });

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
    }
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblMenuMaster');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.getTblMenuMasterSubscription?.unsubscribe();
    this.editTblMenuMasterSubscription?.unsubscribe();
    this.deleteTblMenuMasterSubscription?.unsubscribe();
    this.categorySubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblMenuMaster?.fldFKCategory || this.tblMenuMaster.fldFKCategory <= 0) {
      return false;
    }

    if (!this.tblMenuMaster?.fldTableOrView?.trim()) {
      return false;
    }

    if (!this.tblMenuMaster?.fldMenuName?.trim()) {
      return false;
    }

    if (!this.tblMenuMaster?.fldTableOrViewName?.trim()) {
      return false;
    }

    return true;
  }
}
