import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

import { TblStreetMasterService } from '../services/tbl-street-master';
import { TblStreetMaster } from '../models/tblStreetMaster.model';
import { TblStreetMasterUpdate } from '../models/tblStreetMaster-Update.model';

import { TblCityorTownMaster } from '../../tblCityorTownMaster/models/tblCityorTownMaster.model';
import { TblCityorTownMasterService } from '../../tblCityorTownMaster/services/tbl-cityor-town-master';

@Component({
  selector: 'app-tbl-street-master-update',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-street-master-update.html',
  styleUrl: './tbl-street-master-update.css',
})

export class TblStreetMasterUpdateComponent implements OnInit, OnDestroy {
  id: number | null = null;
  paramSubscription?: Subscription;
  private editTblStreetMasterSubscription?: Subscription;
  private deleteTblStreetMasterSubscription?: Subscription;
  tblStreetMaster?: TblStreetMasterUpdate;
  actionType: string = '';
  submitAction: 'Edit' | 'Delete' = 'Edit'; // default to Edit

  @ViewChild('form') form!: NgForm;

  tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>

  constructor(private tblStreetMasterService: TblStreetMasterService,
    private tblCityorTownMasterService: TblCityorTownMasterService,
    private router: Router, private route: ActivatedRoute, private toastr: ToastrService,
    private cdr: ChangeDetectorRef) {
  }
  ngOnInit(): void {


    this.tblCityorTownMaster$ = this.tblCityorTownMasterService.getActiveTblCityorTownMasters();



    setTimeout(() => {
      if (this.form && this.form.controls['fldDescription']) {
        this.form.controls['fldDescription'].markAsTouched();
      }
    });
    this.paramSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ])
      .subscribe(([params, queryParams]) => {
        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;
        this.actionType = queryParams['action'];

        if (this.id) {
          this.tblStreetMasterService.getTblStreetMasterById(this.id)
            .subscribe({
              next: (response) => {
                this.tblStreetMaster = response;
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

    if (!this.tblStreetMaster?.fldFKCity || this.tblStreetMaster?.fldFKCity <= 0) {
      return;
    }

    if (!this.tblStreetMaster?.fldStreetName?.trim()) {
      return;
    }

    const TblStreetMasterUpdateRequest: TblStreetMasterUpdate = {
      fldId: this.tblStreetMaster?.fldId ?? 0,
      fldFKCity: this.tblStreetMaster?.fldFKCity ?? 0,
      fldStreetName: this.tblStreetMaster?.fldStreetName ?? '',
      fldIsActive: this.tblStreetMaster?.fldIsActive ?? true,
      fldCreatedBy: this.tblStreetMaster?.fldCreatedBy ?? 0,
      fldCreatedDt: this.tblStreetMaster?.fldCreatedDt ?? new Date(),
      fldModifiedBy: this.tblStreetMaster?.fldModifiedBy ?? 0,
      fldModifiedDt: this.tblStreetMaster?.fldModifiedDt ?? new Date(),
    };

    if (this.id) {
      if (this.submitAction === 'Edit') {
        this.editTblStreetMasterSubscription = this.tblStreetMasterService.updateTblStreetMaster(TblStreetMasterUpdateRequest)
          .subscribe({
            next: (response) => {
              this.toastr.success('Record updated successfully!', 'Success', {
                toastClass: 'ngx-toastr custom-toast'
              });

              this.router.navigateByUrl('mastertables/tblStreetMaster');
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
          this.deleteTblStreetMasterSubscription = this.tblStreetMasterService.deleteTblStreetMaster(TblStreetMasterUpdateRequest)
            .subscribe({
              next: (response) => {
                if (response.status === 200) {
                  this.toastr.success('Record deleted successfully!', 'Success', {
                    toastClass: 'ngx-toastr custom-toast'
                  });

                  this.router.navigateByUrl('mastertables/tblStreetMaster');
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
    this.router.navigateByUrl('mastertables/tblStreetMaster');
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
    this.editTblStreetMasterSubscription?.unsubscribe();
    this.deleteTblStreetMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.tblStreetMaster?.fldFKCity || this.tblStreetMaster?.fldFKCity <= 0) {
      return false;
    }

    if (!this.tblStreetMaster?.fldStreetName?.trim()) {
      return false;
    }

    return true;
  }

}

