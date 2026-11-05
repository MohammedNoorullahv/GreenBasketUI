// Path: src/app/features/transactiontables/tblFeature/tbl-feature-list/tbl-feature-list.ts
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblFeature } from '../models/tblFeature.model';
import { TblFeatureService } from '../services/tbl-feature';
import { TblProfileService } from '../../../mastertables/tblProfile/services/tbl-profile';

@Component({
  selector: 'app-tbl-feature-list',
  imports: [AsyncPipe, NgClass, RouterLink],
  templateUrl: './tbl-feature-list.html',
  styleUrl: './tbl-feature-list.css',
})
export class TblFeatureListComponent implements OnInit, OnDestroy {
  tblFeature$?: Observable<TblFeature[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

  // TblFeature has no navigation object, so the submitter name is looked up from TblProfile
  profileNames: Record<number, string> = {};
  private profileSubscription?: Subscription;

  constructor(private tblFeatureService: TblFeatureService,
    private tblProfileService: TblProfileService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblFeature$ = this.tblFeatureService.getAllTblFeatures();

    this.profileSubscription = this.tblProfileService.getAllTblProfiles().subscribe({
      next: (profiles) => {
        profiles.forEach(p => this.profileNames[p.fldId] = p.fldFullName);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('API Error:', err)
    });
  }

  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = 'Load All';
      this.tblFeature$ = this.tblFeatureService.getAllTblFeatures();
    }
    else {
      this.actionType = 'Active Only';
      this.tblFeature$ = this.tblFeatureService.getActiveTblFeatures();
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Under Review':
      case 'Planned':
      case 'In Progress':
        return 'status-packing';
      case 'Resolved':
        return 'status-delivered';
      case 'Declined':
        return 'status-cancelled';
      case 'Closed':
        return 'status-closed';
      default:
        return 'status-pending'; // Pending
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription?.unsubscribe();
  }
}
