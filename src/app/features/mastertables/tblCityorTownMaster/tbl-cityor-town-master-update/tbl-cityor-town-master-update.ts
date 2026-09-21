import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import {TblCityorTownMasterService } from '../services/tbl-cityor-town-master';
import {TblCityorTownMaster } from '../models/tblCityorTownMaster.model';
import {TblCityorTownMasterUpdate } from '../models/tblCityorTownMaster-Update.model';

@Component({
  selector: 'app-tbl-cityor-town-master-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-cityor-town-master-update.html',
  styleUrl: './tbl-cityor-town-master-update.css',
})

export class TblCityorTownMasterUpdateComponent implements OnInit, OnDestroy {
id: number | null = null;
paramSubscription?: Subscription;
private editTblCityorTownMasterSubscription?: Subscription;
private deleteTblCityorTownMasterSubscription?: Subscription;
tblCityorTownMaster?: TblCityorTownMasterUpdate;
actionType: string = '';
submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

@ViewChild('form') form!: NgForm;

constructor(private tblCityorTownMasterService: TblCityorTownMasterService,
	private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
	private cdr: ChangeDetectorRef) {
}
ngOnInit(): void {
	this.paramSubscription = combineLatest([
		this.route.paramMap,
		this.route.queryParams
	])
		.subscribe(([params, queryParams]) => {
			const idParam = params.get('id');
			this.id = idParam ? parseInt(idParam, 10) : null;
			this.actionType = queryParams['action'];

			if (this.id) {
				this.tblCityorTownMasterService.getTblCityorTownMasterById(this.id)
					.subscribe({
						next: (response) => {
							this.tblCityorTownMaster = response;
							this.cdr.detectChanges();
						}
					});
			}
		});
}
OnFormSubmit(form: NgForm): void {

	if (form.invalid) {
		form.control.markAllAsTouched();
		return;
	}

	if (!this.tblCityorTownMaster?.fldCityorTownName?.trim()) {
		return;
	}

	if (!this.tblCityorTownMaster?.fldPincode?.trim()) {
		return;
	}

	const TblCityorTownMasterUpdateRequest: TblCityorTownMasterUpdate = {
		fldId: this.tblCityorTownMaster?.fldId ?? 0,
		fldCityorTownName: this.tblCityorTownMaster?.fldCityorTownName ?? '',
		fldAreaName: this.tblCityorTownMaster?.fldAreaName ?? '',
		fldPincode: this.tblCityorTownMaster?.fldPincode ?? '',
		fldIsActive: this.tblCityorTownMaster?.fldIsActive ?? true,
		fldCreatedBy: this.tblCityorTownMaster?.fldCreatedBy ?? 0,
		fldCreatedDt: this.tblCityorTownMaster?.fldCreatedDt ?? new Date(),
		fldModifiedBy: this.tblCityorTownMaster?.fldModifiedBy ?? 0,
		fldModifiedDt: this.tblCityorTownMaster?.fldModifiedDt ?? new Date(),
	};

	if (this.id) {
		if (this.submitAction === 'Edit') {
			this.editTblCityorTownMasterSubscription = this.tblCityorTownMasterService.updateTblCityorTownMaster(TblCityorTownMasterUpdateRequest)
				.subscribe({
					next: (response) => {
						this.toastr.success('Record updated successfully!', 'Success', {
							toastClass: 'ngx-toastr custom-toast'
						});

						this.router.navigateByUrl('mastertables/tblCityorTownMaster');
					},
					error: (err) => {
						const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

						this.toastr.error(errorMsg, 'Error', {
							toastClass: 'ngx-toastr custom-toast error-toast'
						});

						console.error('API Error:', err);
					}
				});
		} else {

			const proceed = confirm('R U Sure, U Want to Delete the selected Record?');

			if (proceed) {
				this.deleteTblCityorTownMasterSubscription = this.tblCityorTownMasterService.deleteTblCityorTownMaster(TblCityorTownMasterUpdateRequest)
					.subscribe({
						next: (response) => {
							if (response.status === 200) {
								this.toastr.success('Record deleted successfully!', 'Success', {
									toastClass: 'ngx-toastr custom-toast'
								});

								this.router.navigateByUrl('mastertables/tblCityorTownMaster');
							}
						},
						error: (err) => {
							const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

							this.toastr.error(errorMsg, 'Error', {
								toastClass: 'ngx-toastr custom-toast error-toast'
							});

							console.error('API Error:', err);
						}
					});
			}
		}
	}
}

backToHome(): void {
	this.router.navigateByUrl('mastertables/tblCityorTownMaster');
}

ngOnDestroy(): void {
	this.paramSubscription?.unsubscribe();
	this.editTblCityorTownMasterSubscription?.unsubscribe();
	this.deleteTblCityorTownMasterSubscription?.unsubscribe();
}

isFormValid(form: any): boolean {

if (form.invalid) {
	return false;
}

if (!this.tblCityorTownMaster?.fldCityorTownName?.trim()) {
	return false;
}

if (!this.tblCityorTownMaster?.fldPincode?.trim()) {
	return false;
}

	return true;
}

}
