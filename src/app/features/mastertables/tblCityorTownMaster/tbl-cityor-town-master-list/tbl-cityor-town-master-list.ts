import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TblCityorTownMaster } from '../models/tblCityorTownMaster.model';
import { TblCityorTownMasterService } from '../services/tbl-cityor-town-master';

@Component({
  selector: 'app-tbl-cityor-town-master-list',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './tbl-cityor-town-master-list.html',
  styleUrl: './tbl-cityor-town-master-list.css',
})

export class TblCityorTownMasterListComponent implements OnInit {
tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All

constructor(private tblCityorTownMasterService: TblCityorTownMasterService) {
}
ngOnInit(): void {
  console.log('City/Town Master Component Loaded');

	this.actionType = 'Load All';
	this.tblCityorTownMaster$ = this.tblCityorTownMasterService.getAllTblCityorTownMasters();
}
OnFormSubmit(action: string): void {
	if (action === 'Load All')
	{
		this.actionType = "Load All";
		this.tblCityorTownMaster$ = this.tblCityorTownMasterService.getAllTblCityorTownMasters();
	}
	else
	{
		this.actionType = "Active Only";
		this.tblCityorTownMaster$ = this.tblCityorTownMasterService.getActiveTblCityorTownMasters();
	}
}
}

