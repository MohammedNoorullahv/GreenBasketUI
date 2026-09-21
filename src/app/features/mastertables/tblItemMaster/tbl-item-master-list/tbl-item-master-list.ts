import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblItemMaster } from '../models/tblItemMaster.model';
import { TblItemMasterService } from '../services/tbl-item-master'

@Component({
  selector: 'app-tbl-item-master-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-item-master-list.html',
  styleUrl: './tbl-item-master-list.css',
})

export class TblItemMasterListComponent implements OnInit {
tblItemMaster$?: Observable<TblItemMaster[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

constructor(private tblItemMasterService: TblItemMasterService) {
}
ngOnInit(): void {
	this.actionType = 'Load All';
	this.tblItemMaster$ = this.tblItemMasterService.getAllTblItemMasters();
}
OnFormSubmit(action: string): void {
	if (action === 'Load All')
	{
		this.actionType = "Load All";
		this.tblItemMaster$ = this.tblItemMasterService.getAllTblItemMasters();
	}
	else
	{
		this.actionType = "Active Only";
		this.tblItemMaster$ = this.tblItemMasterService.getActiveTblItemMasters();
	}
}
}
