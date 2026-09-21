import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

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

  constructor(private tblProfileService: TblProfileService) {
  }
  ngOnInit(): void {
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
