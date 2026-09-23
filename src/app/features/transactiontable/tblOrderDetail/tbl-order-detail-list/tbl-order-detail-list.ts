import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblOrderDetail } from '../models/tblOrderDetail.model';
import { TblOrderDetailService } from '../services/tbl-order-detail';


@Component({
  selector: 'app-tbl-order-detail-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-order-detail-list.html',
  styleUrl: './tbl-order-detail-list.css',
})

export class TblOrderDetailListComponent implements OnInit {
  tblOrderDetail$?: Observable<TblOrderDetail[]>;
  actionType: string = '';
  submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

  constructor(private tblOrderDetailService: TblOrderDetailService) {
  }
  ngOnInit(): void {
    this.actionType = 'Load All';
    this.tblOrderDetail$ = this.tblOrderDetailService.getAllTblOrderDetails();
  }
  OnFormSubmit(action: string): void {
    if (action === 'Load All') {
      this.actionType = "Load All";
      this.tblOrderDetail$ = this.tblOrderDetailService.getAllTblOrderDetails();
    }
    else {
      this.actionType = "Active Only";
      this.tblOrderDetail$ = this.tblOrderDetailService.getActiveTblOrderDetails();
    }
  }
}

