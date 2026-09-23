import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TblOrder } from '../models/tblOrder.model';
import { TblOrderService } from '../services/tbl-order';



@Component({
  selector: 'app-tbl-order-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-order-list.html',
  styleUrl: './tbl-order-list.css',
})

export class TblOrderListComponent implements OnInit {
tblOrder$?: Observable<TblOrder[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

constructor(private tblOrderService: TblOrderService) {
}
ngOnInit(): void {
	this.actionType = 'Load All';
	this.tblOrder$ = this.tblOrderService.getAllTblOrders();
}
OnFormSubmit(action: string): void {
	if (action === 'Load All')
	{
		this.actionType = "Load All";
		this.tblOrder$ = this.tblOrderService.getAllTblOrders();
	}
	else
	{
		this.actionType = "Active Only";
		this.tblOrder$ = this.tblOrderService.getActiveTblOrders();
	}
}
}

