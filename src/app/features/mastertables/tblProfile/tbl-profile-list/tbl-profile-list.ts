import { Component, OnInit, PLATFORM_ID, inject, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { TblProfile } from '../models/tblProfile.model';
import { TblProfileUpdate } from '../models/tblProfile-Update.model';
import { TblProfileService } from '../services/tbl-profile';
@Component({
  selector: 'app-tbl-profile-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent, ConfirmDialogComponent],
  templateUrl: './tbl-profile-list.html',
  styleUrl: './tbl-profile-list.css',
})

export class TblProfileListComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  tblProfile$?: Observable<TblProfile[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
  filters: Record<string, string> = {};
  isAdmin: boolean = false;

  @ViewChild('deleteDialog') deleteDialog!: ConfirmDialogComponent;

  deleteTargetLabel = '';
  private pendingDeleteRequest?: TblProfileUpdate;

  constructor(private tblProfileService: TblProfileService, private router: Router, private toastr: ToastrService) {
  }
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const storedProfile =
      sessionStorage.getItem('gbProfile');

    if (!storedProfile) {
      return;
    }

    let loggedInProfile: { fldUserType?: string; fldId?: number };
    try {
      loggedInProfile = JSON.parse(storedProfile);
      if (!loggedInProfile || typeof loggedInProfile !== 'object') return;
    } catch {
      return;
    }

    const loggedInUserType =
      loggedInProfile.fldUserType;

    const loggedInUserId =
      Number(loggedInProfile.fldId);




    // =====================================================
    // CUSTOMER / VENDOR
    // Do not load Profile List.
    // Redirect directly to their own Profile Edit page.
    // =====================================================
    if (loggedInUserType !== 'Admin') {

      this.router.navigate([
        '/mastertables/tblProfile/Edit',
        loggedInUserId
      ]);

      return;
    }


    // =====================================================
    // ADMIN
    // Continue your existing Profile List loading code.
    // =====================================================
    this.isAdmin = true;

    this.actionType = 'Load All';
    this.tblProfile$ = this.tblProfileService.getAllTblProfiles();


  }
  OnFormSubmit(action: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.isAdmin) return;
    if (action === 'Load All') {
      this.actionType = "Load All";
      this.tblProfile$ = this.tblProfileService.getAllTblProfiles();
    }
    else {
      this.actionType = "Active Only";
      this.tblProfile$ = this.tblProfileService.getActiveTblProfiles();
    }
  }

  /** Opens the delete confirmation dialog from the row delete icon only. */
  askDelete(profile: TblProfile): void {
    this.deleteTargetLabel = profile.fldFullName || `profile #${profile.fldId}`;
    this.pendingDeleteRequest = {
      fldId: profile.fldId,
      fldUserType: profile.fldUserType ?? '',
      fldContactNumber: profile.fldContactNumber ?? '',
      fldAlternateContactNumber: profile.fldAlternateContactNumber ?? '',
      fldFullName: profile.fldFullName ?? '',
      fldComplexOrBuildingName: profile.fldComplexOrBuildingName ?? '',
      fldDoorNo: profile.fldDoorNo ?? '',
      fldFKStreetId: profile.fldFKStreetId ?? 0,
      fldStreetName: profile.fldStreetName ?? '',
      fldGPSLocation: profile.fldGPSLocation ?? '',
      fldHouseImagePath: profile.fldHouseImagePath ?? '',
      fldIsTermsAgreed: profile.fldIsTermsAgreed ?? true,
      fldIsActive: profile.fldIsActive ?? true,
      fldCreatedBy: profile.fldCreatedBy ?? 0,
      fldCreatedDt: profile.fldCreatedDt ?? new Date(),
      fldModifiedBy: profile.fldModifiedBy ?? 0,
      fldModifiedDt: profile.fldModifiedDt ?? new Date(),
      fldvVendorName: profile.fldvVendorName ?? '',
      fldvAllowAdvanceOrder: profile.fldvAllowAdvanceOrder ?? false,
      fldvADEndTime: profile.fldvADEndTime ?? '',
      fldvADCharges: profile.fldvADCharges ?? 0,
      fldvRegularDeliveryStartTime: profile.fldvRegularDeliveryStartTime ?? '',
      fldvRDCharges: profile.fldvRDCharges ?? 0,
      fldvAcceptingPriortyOrder: profile.fldvAcceptingPriortyOrder ?? false,
      fldvPDDuration: profile.fldvPDDuration ?? '',
      fldvPDCharges: profile.fldvPDCharges ?? 0,
      fldvCoveredRadius: profile.fldvCoveredRadius ?? 0,
      fldvAdditionalChargesPerKm: profile.fldvAdditionalChargesPerKm ?? 0,
      fldvMaxCoveredRadius: profile.fldvMaxCoveredRadius ?? 0,
      fldvUPIId: profile.fldvUPIId ?? '',
      fldvUPIPayeeName: profile.fldvUPIPayeeName ?? '',
      fldvADMinBillValue: profile.fldvADMinBillValue ?? 0,
      fldvADChargesWaiverValue: profile.fldvADChargesWaiverValue ?? 0,
      fldvRDMinBillValue: profile.fldvRDMinBillValue ?? 0,
      fldvRDChargesWaiverValue: profile.fldvRDChargesWaiverValue ?? 0,
      fldvPDMinBillValue: profile.fldvPDMinBillValue ?? 0,
      fldvPDChargesWaiverValue: profile.fldvPDChargesWaiverValue ?? 0,
      fldEmailId: profile.fldEmailId ?? '',
      fldPasswordHash: profile.fldPasswordHash ?? '',
    };
    this.deleteDialog.show();
  }

  confirmDelete(): void {
    if (!this.pendingDeleteRequest) {
      this.deleteDialog.close();
      return;
    }

    this.deleteDialog.busy = true;

    this.tblProfileService.deleteTblProfile(this.pendingDeleteRequest).subscribe({
      next: (response) => {
        this.deleteDialog.busy = false;
        this.deleteDialog.close();
        this.pendingDeleteRequest = undefined;

        if (response.status === 200) {
          this.toastr.success('Record deleted successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          this.OnFormSubmit(this.actionType);
        }
      },
      error: (err) => {
        this.deleteDialog.busy = false;

        const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

        this.toastr.error(errorMsg, 'Error', {
          toastClass: 'ngx-toastr custom-toast error-toast'
        });

        console.error('Delete Error:', err);
      }
    });
  }

  cancelDelete(): void {
    this.pendingDeleteRequest = undefined;
  }
}
