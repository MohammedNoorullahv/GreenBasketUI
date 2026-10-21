// Path: src/app/features/mastertables/tblPropertyMaster/tbl-property-master-list/tbl-property-master-list.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblPropertyMaster } from '../models/tblPropertyMaster.model';
import { TblPropertyMasterService } from '../services/tbl-property-master';

@Component({
  selector: 'app-tbl-property-master-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-property-master-list.html',
  styleUrl: './tbl-property-master-list.css',
})
export class TblPropertyMasterListComponent implements OnInit {
  tblPropertyMaster$?: Observable<TblPropertyMaster[]>;
  actionType: string = '';

  constructor(private tblPropertyMasterService: TblPropertyMasterService) {
  }

  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblPropertyMaster$ = this.tblPropertyMasterService.getAllTblPropertyMasters();
  }

  OnFormSubmit(action: 'Load All' | 'Active Only'): void {
    if (action === 'Load All') {
      this.actionType = 'Load All';
      this.tblPropertyMaster$ = this.tblPropertyMasterService.getAllTblPropertyMasters();
    }
    else {
      this.actionType = 'Active Only';
      this.tblPropertyMaster$ = this.tblPropertyMasterService.getActiveTblPropertyMasters();
    }
  }
}
