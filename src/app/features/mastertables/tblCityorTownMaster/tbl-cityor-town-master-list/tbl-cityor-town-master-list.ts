import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColumnFilterIconComponent } from '../../../../shared/components/column-filter-icon/column-filter-icon.component';
import { ColumnFilterPipe } from '../../../../shared/pipes/column-filter.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { TblCityorTownMaster } from '../models/tblCityorTownMaster.model';
import { TblCityorTownMasterUpdate } from '../models/tblCityorTownMaster-Update.model';
import { TblCityorTownMasterService } from '../services/tbl-cityor-town-master';

@Component({
  selector: 'app-tbl-cityor-town-master-list',
  imports: [AsyncPipe, CommonModule, FormsModule, RouterLink, ColumnFilterPipe, ColumnFilterIconComponent, ConfirmDialogComponent],
  templateUrl: './tbl-cityor-town-master-list.html',
  styleUrl: './tbl-cityor-town-master-list.css',
})

export class TblCityorTownMasterListComponent implements OnInit {
tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>;
actionType: string = '';
submitAction: 'Load All' | 'Active Only' = 'Load All'; // default to Load All
filters: Record<string, string> = {};

@ViewChild('deleteDialog') deleteDialog!: ConfirmDialogComponent;

deleteTargetLabel = '';
private pendingDeleteRequest?: TblCityorTownMasterUpdate;

constructor(private tblCityorTownMasterService: TblCityorTownMasterService, private toastr: ToastrService) {
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

/** Opens the delete confirmation dialog from the row delete icon only. */
askDelete(record: TblCityorTownMaster): void {
	this.deleteTargetLabel = record.fldCityorTownName || `record #${record.fldId}`;
	this.pendingDeleteRequest = {
		fldId: record.fldId,
		fldCityorTownName: record.fldCityorTownName ?? '',
		fldAreaName: record.fldAreaName ?? '',
		fldPincode: record.fldPincode ?? '',
		fldIsActive: record.fldIsActive ?? true,
		fldCreatedBy: record.fldCreatedBy ?? 0,
		fldCreatedDt: record.fldCreatedDt ?? new Date(),
		fldModifiedBy: record.fldModifiedBy ?? 0,
		fldModifiedDt: record.fldModifiedDt ?? new Date(),
	};
	this.deleteDialog.show();
}

confirmDelete(): void {
	if (!this.pendingDeleteRequest) {
		this.deleteDialog.close();
		return;
	}

	this.deleteDialog.busy = true;

	this.tblCityorTownMasterService.deleteTblCityorTownMaster(this.pendingDeleteRequest).subscribe({
		next: (response) => {
			this.deleteDialog.busy = false;
			this.deleteDialog.close();
			this.pendingDeleteRequest = undefined;

			if (response.status === 200) {
				this.toastr.success('Record deleted successfully!', 'Success', {
					toastClass: 'ngx-toastr custom-toast'
				});

				this.OnFormSubmit(this.actionType);
			}
		},
		error: (err) => {
			this.deleteDialog.busy = false;

			const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

			this.toastr.error(errorMsg, 'Error', {
				toastClass: 'ngx-toastr custom-toast error-toast'
			});

			console.error('Delete Error:', err);
		}
	});
}

cancelDelete(): void {
	this.pendingDeleteRequest = undefined;
}
}
