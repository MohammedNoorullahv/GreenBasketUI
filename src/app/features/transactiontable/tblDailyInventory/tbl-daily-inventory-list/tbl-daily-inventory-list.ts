import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblDailyInventory } from '../models/tblDailyInventory.model';
import { TblDailyInventoryService } from '../services/tbl-daily-inventory';

@Component({
  selector: 'app-tbl-daily-inventory-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-daily-inventory-list.html',
  styleUrl: './tbl-daily-inventory-list.css',
})

export class TblDailyInventoryListComponent implements OnInit {
  tblDailyInventory$?: Observable<TblDailyInventory[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

  constructor(private tblDailyInventoryService: TblDailyInventoryService) {
  }
  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblDailyInventory$ = this.tblDailyInventoryService.getAllTblDailyInventorys();
  }
  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = "Load All";
      this.tblDailyInventory$ = this.tblDailyInventoryService.getAllTblDailyInventorys();
    }
    else {
      this.actionType = "Active Only";
      this.tblDailyInventory$ = this.tblDailyInventoryService.getActiveTblDailyInventorys();
    }
  }
}

