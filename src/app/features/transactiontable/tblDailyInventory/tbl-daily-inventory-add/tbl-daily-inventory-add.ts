import { Component, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { TblDailyInventory } from '../models/tblDailyInventory.model';
import { TblDailyInventoryAdd } from '../models/tblDailyInventory-Add.model';
import { TblDailyInventoryService } from '../services/tbl-daily-inventory';
import { TblProfile } from '../../../mastertables/tblProfile/models/tblProfile.model';
import { TblItemMaster } from '../../../mastertables/tblItemMaster/models/tblItemMaster.model';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';
import { TblItemMasterService } from '../../../mastertables/tblItemMaster/services/tbl-item-master';


@Component({
  selector: 'app-tbl-daily-inventory-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-daily-inventory-add.html',
  styleUrl: './tbl-daily-inventory-add.css',
})

export class TblDailyInventoryAddComponent implements OnDestroy {
  model: TblDailyInventoryAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblDailyInventorySubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  tblProfile$?: Observable<TblProfile[]>
  tblItemMaster$?: Observable<TblItemMaster[]>

  constructor(private tblDailyInventoryService: TblDailyInventoryService,
    private tblProfileService: TblProfileService,
    private tblItemMasterService: TblItemMasterService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = {
      fldId: 0,
      fldFKVendorId: 0,
      fldFKItemId: 0,
      fldItemName: '',
      fldBaseUnit: '',
      fldInventoryDate: new Date(),
      fldSellingRate: 0,
      fldAvailableStock: 0,
      fldInitialStock: 0,
      fldIsAvailable: true,
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  ngOnInit(): void {


    this.tblProfile$ = this.tblProfileService.getActiveLeanTblProfiles();
    this.tblItemMaster$ = this.tblItemMasterService.getActiveLeanTblItemMasters();



    setTimeout(() => {
      if (this.form && this.form.controls['fldDescription']) {
        this.form.controls['fldDescription'].markAsTouched();
      }
    });
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

    if (!this.model.fldFKVendorId || this.model.fldFKVendorId <= 0) {
      return;
    }

    if (!this.model.fldFKItemId || this.model.fldFKItemId <= 0) {
      return;
    }

    if (!this.model.fldSellingRate || this.model.fldSellingRate <= 0) {
      return;
    }

    if (!this.model.fldAvailableStock || this.model.fldAvailableStock <= 0) {
      return;
    }

    if (!this.model.fldInitialStock || this.model.fldInitialStock <= 0) {
      return;
    }

    this.isSaving = true;

    this.addTblDailyInventorySubscription = this.tblDailyInventoryService.addTblDailyInventory(this.model)
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
            this.router.navigateByUrl('transactiontables/tblDailyInventory');
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
    this.model = {
      fldId: 0,
      fldFKVendorId: 0,
      fldFKItemId: 0,
      fldItemName: '',
      fldBaseUnit: '',
      fldInventoryDate: new Date(),
      fldSellingRate: 0,
      fldAvailableStock: 0,
      fldInitialStock: 0,
      fldIsAvailable: true,
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    },
      setTimeout(() => {
        const firstInput = document.getElementById('fldDescription');
        if (firstInput) {
          firstInput.focus();
        }
      });
  }

  backToHome(): void {
    this.router.navigateByUrl('transactiontables/tblDailyInventory');
  }

  ngOnDestroy(): void {
    this.addTblDailyInventorySubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFKVendorId || this.model.fldFKVendorId <= 0) {
      return false;
    }

    if (!this.model.fldFKItemId || this.model.fldFKItemId <= 0) {
      return false;
    }

    if (!this.model.fldSellingRate || this.model.fldSellingRate <= 0) {
      return false;
    }

    if (!this.model.fldAvailableStock || this.model.fldAvailableStock <= 0) {
      return false;
    }

    if (!this.model.fldInitialStock || this.model.fldInitialStock <= 0) {
      return false;
    }

    return true;
  }

}

