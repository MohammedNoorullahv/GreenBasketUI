import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblStreetMaster } from '../models/tblStreetMaster.model';
import { TblStreetMasterService } from '../services/tbl-street-master';

@Component({
  selector: 'app-tbl-street-master-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-street-master-list.html',
  styleUrl: './tbl-street-master-list.css',
})

export class TblStreetMasterListComponent implements OnInit {
tblStreetMaster$?: Observable<TblStreetMaster[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

constructor(private tblStreetMasterService: TblStreetMasterService) {
}
ngOnInit(): void {
	this.actionType = 'Load All';
	this.tblStreetMaster$ = this.tblStreetMasterService.getAllTblStreetMasters();
}
OnFormSubmit(action: string): void {
	if (action === 'Load All')
	{
		this.actionType = "Load All";
		this.tblStreetMaster$ = this.tblStreetMasterService.getAllTblStreetMasters();
	}
	else
	{
		this.actionType = "Active Only";
		this.tblStreetMaster$ = this.tblStreetMasterService.getActiveTblStreetMasters();
	}
}
}

