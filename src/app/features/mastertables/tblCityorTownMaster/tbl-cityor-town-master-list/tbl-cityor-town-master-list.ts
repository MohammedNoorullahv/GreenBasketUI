import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';

import { TblCityorTownMaster } from '../models/tblCityorTownMaster.model';
import { TblCityorTownMasterService } from '../services/tbl-cityor-town-master';

@Component({
  selector: 'app-tbl-cityor-town-master-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent],
  templateUrl: './tbl-cityor-town-master-list.html',
  styleUrl: './tbl-cityor-town-master-list.css',
})

export class TblCityorTownMasterListComponent implements OnInit {
tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
filters: Record<string, string> = {};

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

