import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';

import { TblStreetMaster } from '../models/tblStreetMaster.model';
import { TblStreetMasterService } from '../services/tbl-street-master';

@Component({
  selector: 'app-tbl-street-master-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent],
  templateUrl: './tbl-street-master-list.html',
  styleUrl: './tbl-street-master-list.css',
})

export class TblStreetMasterListComponent implements OnInit {
tblStreetMaster$?: Observable<TblStreetMaster[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
filters: Record<string, string> = {};

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

