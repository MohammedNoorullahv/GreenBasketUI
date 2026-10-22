// Path: src/app/features/mastertables/tblMenuMaster/tbl-menu-master-list/tbl-menu-master-list.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblMenuMaster } from '../models/tblMenuMaster.model';
import { TblMenuMasterService } from '../services/tbl-menu-master';

@Component({
  selector: 'app-tbl-menu-master-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-menu-master-list.html',
  styleUrl: './tbl-menu-master-list.css',
})
export class TblMenuMasterListComponent implements OnInit {
  tblMenuMaster$?: Observable<TblMenuMaster[]>;
  actionType: string = '';

  constructor(private tblMenuMasterService: TblMenuMasterService) {
  }

  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblMenuMaster$ = this.tblMenuMasterService.getAllTblMenuMasters();
  }

  OnFormSubmit(action: 'Load All' | 'Active Only'): void {
    if (action === 'Load All') {
      this.actionType = 'Load All';
      this.tblMenuMaster$ = this.tblMenuMasterService.getAllTblMenuMasters();
    }
    else {
      this.actionType = 'Active Only';
      this.tblMenuMaster$ = this.tblMenuMasterService.getActiveTblMenuMasters();
    }
  }
}
