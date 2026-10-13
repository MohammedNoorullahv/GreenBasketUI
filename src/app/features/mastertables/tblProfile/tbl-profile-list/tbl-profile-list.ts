import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { TblProfile } from '../models/tblProfile.model';
import { TblProfileService } from '../services/tbl-profile';
@Component({
  selector: 'app-tbl-profile-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-profile-list.html',
  styleUrl: './tbl-profile-list.css',
})

export class TblProfileListComponent implements OnInit {
  tblProfile$?: Observable<TblProfile[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
  isAdmin: boolean = false;

  constructor(private tblProfileService: TblProfileService, private router: Router) {
  }
  ngOnInit(): void {

    const storedProfile =
      sessionStorage.getItem('gbProfile');

    if (!storedProfile) {
      return;
    }

    const loggedInProfile =
      JSON.parse(storedProfile);

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
    if (action === 'Load All') {
      this.actionType = "Load All";
      this.tblProfile$ = this.tblProfileService.getAllTblProfiles();
    }
    else {
      this.actionType = "Active Only";
      this.tblProfile$ = this.tblProfileService.getActiveTblProfiles();
    }
  }
}
