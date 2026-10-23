import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Component, OnDestroy, ViewChild, ChangeDetectorRef, HostBinding, HostListener } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import {

  inject,
  PLATFORM_ID
} from "@angular/core";

import { isPlatformBrowser } from "@angular/common";

import type * as Leaflet from "leaflet";




import { TblStreetMaster } from '../../tblStreetMaster/models/tblStreetMaster.model';
import { TblStreetMasterService } from '../../tblStreetMaster/services/tbl-street-master';
import { TblProfile } from '../models/tblProfile.model';
import { TblProfileAdd } from '../models/tblProfile-Add.model';
import { TblProfileService } from '../services/tbl-profile';
import { TblCityorTownMaster } from '../../tblCityorTownMaster/models/tblCityorTownMaster.model';
import { TblCityorTownMasterService } from '../../tblCityorTownMaster/services/tbl-cityor-town-master';
import { TblStreetMasterAdd } from '../../tblStreetMaster/models/tblStreetMaster-Add.model';

@Component({
  selector: 'app-tbl-profile-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-profile-add.html',
  styleUrl: './tbl-profile-add.css',

  styles: [`
    :host(.public-registration) { display: block; flex: 1 1 auto; min-height: 0; height: 100dvh; width: 100%; max-width: 100%; overflow: auto; overscroll-behavior: contain; }
    :host(.public-registration) .grid-page-shell { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; margin: 0 auto; padding: 16px; }
    :host(.public-registration) .profile-form, :host(.public-registration) .profile-field { min-width: 0; }
    :host(.public-registration) input, :host(.public-registration) select { max-width: 100%; box-sizing: border-box; scroll-margin-block: 24px; }
    :host(.public-registration) .page-actions-bar { position: static; flex-wrap: wrap; }
    .registration-errors { padding: 16px; margin: 12px 0; border: 2px solid #b42318; border-radius: 8px; background: #fff4f2; color: #8a1c13; }
    .registration-errors ul { margin: 8px 0 0; padding-inline-start: 20px; }
    .registration-errors button { background: transparent; border: 0; padding: 6px 0; color: #8a1c13; text-align: start; text-decoration: underline; cursor: pointer; font: inherit; }
    .registration-field-error { color: #b42318; font-size: 14px; font-weight: 600; margin: 6px 0; }
    input.ng-invalid.ng-touched, select.ng-invalid.ng-touched { border: 2px solid #b42318; }
    input:focus-visible, select:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid #1473c9; outline-offset: 3px; }
    .registration-location { border: 1px solid #b9d5c5; border-radius: 8px; padding: 12px; }
    .registration-location button { min-height: 44px; }
    .registration-location p { overflow-wrap: anywhere; }
    :host .profile-map-modal { max-height: calc(100dvh - 24px); overflow: auto; max-width: calc(100vw - 24px); }
    @media (max-width: 760px) {
      :host(.public-registration) .profile-form { grid-template-columns: minmax(0, 1fr); }
      :host(.public-registration) .vendor-delivery-grid { grid-template-columns: minmax(0, 1fr); }
      :host(.public-registration) .vendor-delivery-cell:nth-child(odd) { border-right: 0; }
      :host(.public-registration) .vendor-delivery-cell + .vendor-delivery-cell { border-top: 1px solid #cbdcf1; }
    }

    .vendor-delivery-card { border: 1px solid #8ba6b6; border-radius: 10px; padding: 14px; margin: 8px 0 20px; min-width: 0; grid-column: 1 / -1; }
    .vendor-delivery-heading { margin: 0 0 12px; padding: 10px; border: 1px solid #cbdcf1; border-radius: 6px; background: #f0f7fc; color: #17384a; text-align: center; font-size: 17px; font-weight: 700; }
    .vendor-delivery-toggle { margin-bottom: 14px; }
    .vendor-delivery-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; border: 1px solid #cbdcf1; border-radius: 6px; overflow: hidden; }
    .vendor-delivery-cell { padding: 12px; min-width: 0; }
    .vendor-delivery-cell:nth-child(odd) { border-right: 1px solid #cbdcf1; }
    .vendor-delivery-cell:nth-child(n+3) { border-top: 1px solid #cbdcf1; }
    .vendor-delivery-cell .form-label { display: block; margin-bottom: 8px; font-size: 13px; }
    .vendor-delivery-cell .form-control { width: 100%; min-width: 0; box-sizing: border-box; }
    .vendor-delivery-note { margin: 0 0 12px; color: #64748b; font-size: 13px; }
    @media (max-width: 360px) {
      .vendor-delivery-grid { grid-template-columns: 1fr; }
      .vendor-delivery-cell:nth-child(odd) { border-right: 0; }
      .vendor-delivery-cell + .vendor-delivery-cell { border-top: 1px solid #cbdcf1; }
      .vendor-delivery-card { padding: 10px; }
    }
  `],

})

export class TblProfileAddComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly registrationHttp = inject(HttpClient);
  readonly isRegistration = this.route.snapshot.data['publicRegistration'] === true;
  @HostBinding('class.public-registration') get publicRegistrationClass(): boolean { return this.isRegistration; }
  validationErrors: { field: string; message: string }[] = [];

  @HostListener('focusin', ['$event'])
  keepFocusedFieldVisible(event: FocusEvent): void {
    if (this.isRegistration && isPlatformBrowser(this.platformId)) {
      (event.target as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }

  focusField(field: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const target = document.getElementById(field) ||
        document.querySelector<HTMLElement>(`[name="${field}"]`) ||
        document.getElementById('registrationErrors');
      target?.scrollIntoView({ block: 'center', inline: 'nearest' });
      target?.focus({ preventScroll: true });
    });
  }

  fieldError(field: string): string {
    return this.validationErrors.find(x => x.field === field)?.message || '';
  }

  onMapKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLocationMap();
      this.focusField('deliveryLocationButton');
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLElement;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'
    )).filter(element => element.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  private validateRegistration(form: NgForm): boolean {
    form.control.markAllAsTouched();
    const errors: { field: string; message: string }[] = [];
    const add = (field: string, message: string) => {
      if (!errors.some(x => x.field === field)) errors.push({ field, message });
    };
    const labels: Record<string, string> = {
      fldUserType: 'User type', fldContactNumber: 'Phone number',
      fldPasswordHash: 'MPIN', fldFullName: 'Full name', fldDoorNo: 'Door number',
      fldEmailId: 'Email address', fldFKStreetId: 'Street', selectedCityorTownId: 'City / Town',
      newStreetName: 'New street name', fldvVendorName: 'Vendor / shop name',
      fldIsTermsAgreed: 'Terms & Conditions'
    };
    for (const [name, control] of Object.entries(form.controls)) {
      if (control.invalid) {
        const label = labels[name] || name.replace(/^fldv?/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
        const message = name === 'fldPasswordHash' ? 'MPIN must contain exactly six digits.'
          : control.errors?.['required'] ? `${label} is required.`
          : control.errors?.['email'] ? 'Enter a valid email address.'
          : `${label}: check the entered value and permitted range.`;
        add(name, message);
      }
    }
    if (!/^[6-9][0-9]{9}$/.test(this.model.fldContactNumber || ''))
      add('fldContactNumber', 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.');
    if (this.manualStreetEntry) {
      if (!this.selectedCityorTownId) add('selectedCityorTownId', 'Select City / Town.');
      if (!this.newStreetName.trim()) add('newStreetName', 'Enter the new street name.');
    } else if (!this.model.fldFKStreetId) add('fldFKStreetId', 'Select your street.');
    // if (!this.model.fldGPSLocation?.trim())
    //   add('deliveryLocationButton', 'Delivery location is required. Choose your location on the map and click Confirm Location.');
    if (!this.model.fldIsTermsAgreed) add('fldIsTermsAgreed', 'Please accept the Terms & Conditions.');
    this.validationErrors = errors;
    if (errors.length) {
      this.cdr.detectChanges();
      this.focusField(errors[0].field);
      return false;
    }
    return true;
  }

  private showSaveError(error: unknown): void {
    const response = error as { error?: unknown };
    const body = response?.error as { errors?: Record<string, string[]>; message?: string; detail?: string; title?: string; traceId?: string } | undefined;
    this.validationErrors = [];
    if (body && typeof body === 'object' && body.errors) {
      for (const [key, messages] of Object.entries(body.errors)) {
        const name = key.split('.').pop() || '';
        const field = name ? name[0].toLowerCase() + name.slice(1) : 'registrationErrors';
        for (const message of Array.isArray(messages) ? messages : [String(messages)])
          this.validationErrors.push({ field, message });
      }
    }
    if (!this.validationErrors.length) this.validationErrors = [{
      field: 'registrationErrors',
      message: (typeof body === 'object' && (body?.detail || body?.message || body?.title)) ||
        'Unable to save registration. Please try again. If it continues, contact support.'
    }];
    this.cdr.detectChanges();
    this.focusField(this.validationErrors[0].field);
  }

  model: TblProfileAdd;
  modelsm: TblStreetMasterAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblProfileSubscription?: Subscription;
  private addTblStreetMasterSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  tblStreetMaster$?: Observable<TblStreetMaster[]>
  tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>;

  selectedCityorTownId: number = 0;
  newStreetName: string = '';

  private readonly platformId = inject(PLATFORM_ID);


  manualStreetEntry = false;

  showLocationMap = false;

  selectedLatitude: number | null = null;

  selectedLongitude: number | null = null;

  private map: Leaflet.Map | null = null;

  private locationMarker: Leaflet.Marker | null = null;

  private leaflet: typeof Leaflet | null = null;

  selectedHouseImage: File | null = null;

  houseImagePreview: string | null = null;

  isLocating = false;
  locationAccuracy: number | null = null;
  locationMessage = '';
  mapLoadMessage = '';
  private accuracyCircle: Leaflet.Circle | null = null;
  private mapResizeObserver: ResizeObserver | null = null;
  private geoWatchId: number | null = null;
  private geoTimer: ReturnType<typeof setTimeout> | null = null;
  private locationRequest = 0;
  private mapSession = 0;
  private addressRequest = 0;
  private addressTimer: ReturnType<typeof setTimeout> | null = null;
  private addressAbort: AbortController | null = null;
  private lastAddressRequestAt = 0;

  selectedMapAddress = "";
  showPassword: boolean = false;
  tblStreetMasterList: TblStreetMaster[] = [];

  constructor(private tblProfileService: TblProfileService,
    private tblStreetMasterService: TblStreetMasterService,
    private tblCityorTownMasterService: TblCityorTownMasterService,
    private router: Router, private toastr: ToastrService, private cdr: ChangeDetectorRef) {
    this.model = {
      fldId: 0,
      fldUserType: 'Customer',
      fldContactNumber: '',
      fldAlternateContactNumber: '',
      fldFullName: '',
      fldComplexOrBuildingName: '',
      fldDoorNo: '',
      fldFKStreetId: 0,
      fldStreetName: '',
      fldGPSLocation: '',
      fldHouseImagePath: '',
      fldvADMinBillValue: 0,
      fldvADChargesWaiverValue: 0,
      fldvRDMinBillValue: 0,
      fldvRDChargesWaiverValue: 0,
      fldvPDMinBillValue: 0,
      fldvPDChargesWaiverValue: 0,
      fldIsTermsAgreed: true,
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
    this.modelsm = {
      fldId: 0,
      fldFKCity: 0,
      fldStreetName: '',
      fldIsActive: false,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  ngOnInit(): void {


    this.tblStreetMaster$ =
      (this.isRegistration
        ? this.tblStreetMasterService.getRegistrationStreets()
        : this.tblStreetMasterService.getActiveLeanTblStreetMasters())
        .pipe(
          tap((streets) => {
            this.tblStreetMasterList = streets;
          })
        );

    this.tblCityorTownMaster$ = this.isRegistration
      ? this.tblCityorTownMasterService.getRegistrationCities()
      : this.tblCityorTownMasterService.getActiveLeanTblCityorTownMasters();

    setTimeout(() => {
      if (this.form && this.form.controls['fldDescription']) {
        this.form.controls['fldDescription'].markAsTouched();
      }
    });
  }

  OnFormSubmit(form: NgForm, action: 'SaveAndAddNew' | 'SaveAndClose'): void {

    if (this.isSaving) {
      return;
    }


    this.submitAction = action;

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.model.fldUserType?.trim()) {
      return;
    }

    if (!this.model.fldContactNumber?.trim()) {
      return;
    }

    if (!this.model.fldFullName?.trim()) {
      return;
    }

    if (!this.model.fldDoorNo?.trim()) {
      return;
    }

    console.log("2. New street Name", this.newStreetName);
    console.log("3. Existing Old Street Id", this.model.fldFKStreetId);
    console.log("4. City / Town Id", this.selectedCityorTownId);


    if (this.manualStreetEntry) {

      if (
        !this.selectedCityorTownId ||
        this.selectedCityorTownId <= 0
      ) {
        this.toastr.warning(
          'Please select City / Town.'
        );
        return;
      }

      if (!this.newStreetName?.trim()) {
        this.toastr.warning(
          'Please enter New Street Name.'
        );
        return;
      }

    } else {

      if (
        !this.model.fldFKStreetId ||
        this.model.fldFKStreetId <= 0
      ) {
        this.toastr.warning(
          'Please select Street Name.'
        );
        return;
      }
    }

    // if (!this.model.fldGPSLocation?.trim()) {
    //   return;
    // }

    this.isSaving = true;

    if (this.manualStreetEntry) {
      // const newStreet = {
      //   fldId: 0,
      //   fldFKCityorTownId: this.selectedCityorTownId,
      //   fldStreetName: this.model.fldStreetName.trim(),
      //   fldIsActive: true
      // };

      this.modelsm.fldId = 0,
        this.modelsm.fldFKCity = this.selectedCityorTownId,
        this.modelsm.fldStreetName = this.newStreetName.trim(),
        this.modelsm.fldIsActive = true,

        this.addTblStreetMasterSubscription =
        (this.isRegistration
          ? this.tblStreetMasterService.addRegistrationStreet(this.modelsm)
          : this.tblStreetMasterService.addTblStreetMaster(this.modelsm))
          .subscribe({
            next: (response) => {

              console.log("5. Street Master Response After Saving", response);

              // Newly created Street ID
              this.model.fldFKStreetId = response.fldId;
              // New Street Name
              this.model.fldStreetName = response.fldStreetName;

              console.log(
                "6. New Street ID assigned to Profile",
                this.model.fldFKStreetId
              );

              // NOW save Profile
              this.saveProfile();
            },
            error: (err) => {
              this.isSaving = false;
              this.showSaveError(err);
              this.cdr.detectChanges();
            }
          });
    } else {
      // Existing streets must also save the profile.
      this.saveProfile();
    }


    // console.log(
    //   "7. BEFORE Profile API - Street ID:",
    //   this.model.fldFKStreetId
    // );

    // console.log(
    //   "8. BEFORE Profile API - Complete Model:",
    //   JSON.stringify(this.model)
    // );

    // this.addTblProfileSubscription = this.tblProfileService.addTblProfile(this.model)
    //   .subscribe({
    //     next: (response) => {
    //       this.isSaving = false;

    //       this.toastr.success('Record saved successfully!', 'Success', {
    //         toastClass: 'ngx-toastr custom-toast'
    //       });

    //       if (this.submitAction === 'SaveAndAddNew') {
    //         this.resetForm();
    //         this.cdr.detectChanges();
    //       } else {
    //         this.router.navigateByUrl('mastertables/tblProfile');
    //       }
    //     },
    //     error: (err) => {
    //       this.isSaving = false;

    //       const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

    //       this.toastr.error(errorMsg, 'Error', {
    //         toastClass: 'ngx-toastr custom-toast error-toast'
    //       });

    //       console.error('API Error:', err);
    //     }
    //   });

  }

  private saveProfile(): void {

    console.log(
      "7. BEFORE Profile API - Street ID:",
      this.model.fldFKStreetId
    );



    const saveRequest: Observable<unknown> = this.isRegistration
      ? this.registrationHttp.post(
          `${environment.apiBaseUrl}/api/TblProfile/RegisterProfile`, this.model)
      : this.tblProfileService.addTblProfile(this.model);
    this.addTblProfileSubscription = saveRequest.subscribe({

          next: (response) => {

            this.isSaving = false;

            this.toastr.success(
              'Record saved successfully!',
              'Success',
              {
                toastClass: 'ngx-toastr custom-toast'
              }
            );

            if (this.isRegistration) {
              void this.router.navigateByUrl('/login');
              return;
            }
            if (this.submitAction === 'SaveAndAddNew') {

              this.resetForm();
              this.cdr.detectChanges();

            } else {

              this.router.navigateByUrl(
                'mastertables/tblProfile'
              );
            }
          },

          error: (err) => {

            this.isSaving = false;

            this.showSaveError(err);
          }

        });
  }

  resetForm() {
    this.model = {
      fldId: 0,
      fldUserType: '',
      fldContactNumber: '',
      fldAlternateContactNumber: '',
      fldFullName: '',
      fldComplexOrBuildingName: '',
      fldDoorNo: '',
      fldFKStreetId: 0,
      fldStreetName: '',
      fldGPSLocation: '',
      fldHouseImagePath: '',
      fldvADMinBillValue: 0,
      fldvADChargesWaiverValue: 0,
      fldvRDMinBillValue: 0,
      fldvRDChargesWaiverValue: 0,
      fldvPDMinBillValue: 0,
      fldvPDChargesWaiverValue: 0,
      fldIsTermsAgreed: true,
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    },
      setTimeout(() => {
        const firstInput = document.getElementById('fldDescription');
        if (firstInput) {
          firstInput.focus();
        }
      });
  }

  backToHome(): void {
    this.router.navigateByUrl(this.isRegistration ? '/login' : '/mastertables/tblProfile');
  }

  ngOnDestroy(): void {
    this.closeLocationMap();
    this.addTblProfileSubscription?.unsubscribe();
    this.addTblStreetMasterSubscription?.unsubscribe();
  }

  isFormValid(form: any): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldUserType?.trim()) {
      return false;
    }

    if (!this.model.fldContactNumber?.trim()) {
      return false;
    }

    if (!this.model.fldFullName?.trim()) {
      return false;
    }

    if (!this.model.fldDoorNo?.trim()) {
      return false;
    }

    if (this.manualStreetEntry) {

      if (
        !this.selectedCityorTownId ||
        this.selectedCityorTownId <= 0
      ) {
        this.toastr.warning(
          'Please select City / Town.'
        );

        return false;
      }

      if (!this.model.fldStreetName?.trim()) {

        this.toastr.warning(
          'Please enter the new Street Name.'
        );

        return false;
      }

    } else {

      if (
        !this.model.fldFKStreetId ||
        this.model.fldFKStreetId <= 0
      ) {
        this.toastr.warning(
          'Please select Street Name.'
        );

        return false;
      }
    }

    if (!this.model.fldGPSLocation?.trim()) {
      return false;
    }

    return true;
  }


  toggleManualStreet(): void {

    this.manualStreetEntry =
      !this.manualStreetEntry;

    if (this.manualStreetEntry) {

      // Switching to NEW STREET mode
      this.model.fldFKStreetId = 0;
      this.model.fldStreetName = '';

      this.selectedCityorTownId = 0;
      this.newStreetName = '';

    } else {

      // Switching back to EXISTING STREET mode
      this.model.fldFKStreetId = 0;
      this.model.fldStreetName = '';

      this.selectedCityorTownId = 0;
      this.newStreetName = '';
    }
  }

  async openLocationMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.showLocationMap) return;
    this.showLocationMap = true;
    this.locationMessage = 'Choose a point, or use Current Location.';
    this.mapLoadMessage = '';
    this.selectedMapAddress = '';
    const session = ++this.mapSession;
    this.cdr.detectChanges();
    this.focusField('closeRegistrationMap');
    try {
      await this.initializeLocationMap(session);
    } catch (error) {
      if (session !== this.mapSession || !this.showLocationMap) return;
      this.mapLoadMessage = 'Map could not load. Check your connection and Leaflet installation.';
      console.error('Map initialization failed', error);
      this.cdr.detectChanges();
    }
  }

  private async initializeLocationMap(session: number): Promise<void> {
    const L = await import('leaflet');
    if (session !== this.mapSession || !this.showLocationMap) return;
    const container = document.getElementById('profileLocationMap');
    if (!container) return;
    this.leaflet = L;
    const parts = this.model.fldGPSLocation?.split(',').map(value => value.trim());
    const values = parts?.map(Number);
    const valid = !!parts && parts.length === 2 && parts.every(value => value !== '') &&
      !!values && values.every(Number.isFinite) &&
      Math.abs(values[0]) <= 90 && Math.abs(values[1]) <= 180;
    // Default view only: this is never presented as the detected location.
    const latitude = valid ? values![0] : 12.9380;
    const longitude = valid ? values![1] : 79.2810;
    this.selectedLatitude = null;
    this.selectedLongitude = null;
    this.map = L.map(container, {
      minZoom: 3, maxZoom: 19, zoomControl: true,
      scrollWheelZoom: true, zoomSnap: 1
    }).setView([latitude, longitude], valid ? 16 : 13);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom: 19, maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    tiles.on('tileerror', () => {
      if (session !== this.mapSession) return;
      this.mapLoadMessage = 'Some map tiles could not load. Check your connection or blocked map requests.';
      this.cdr.detectChanges();
    });
    this.map.on('click', (event: Leaflet.LeafletMouseEvent) => {
      this.selectManualLocation(event.latlng.lat, event.latlng.lng);
    });
    if (valid) {
      this.setSelectedLocation(latitude, longitude);
      this.locationMessage = 'Saved location loaded. Adjust the pin if required.';
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.mapResizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ pan: false }));
      this.mapResizeObserver.observe(container);
    }
    requestAnimationFrame(() => {
      if (session !== this.mapSession) return;
      this.map?.invalidateSize({ pan: false });
      const pane = this.map?.getPane('tilePane');
      if (pane && getComputedStyle(pane).position !== 'absolute') {
        this.mapLoadMessage = 'Leaflet CSS is missing. Load leaflet/dist/leaflet.css in your global styles.';
        this.cdr.detectChanges();
      }
    });
  }

  private selectManualLocation(latitude: number, longitude: number): void {
    this.stopLocationWatch();
    this.accuracyCircle?.remove();
    this.accuracyCircle = null;
    this.locationAccuracy = null;
    this.locationMessage = 'Manually selected location. Confirm the pin is at your delivery point.';
    this.setSelectedLocation(latitude, longitude);
  }

  private stopLocationWatch(): void {
    ++this.locationRequest;
    if (this.geoWatchId !== null && isPlatformBrowser(this.platformId)) {
      navigator.geolocation?.clearWatch(this.geoWatchId);
    }
    this.geoWatchId = null;
    if (this.geoTimer !== null) clearTimeout(this.geoTimer);
    this.geoTimer = null;
    this.isLocating = false;
  }

  private setSelectedLocation(
    latitude: number,
    longitude: number
  ): void {
    if (!this.leaflet || !this.map) {
      return;
    }

    const L = this.leaflet;

    this.selectedLatitude = latitude;
    this.selectedLongitude = longitude;

    if (this.locationMarker) {
      this.locationMarker.setLatLng([latitude, longitude]);
    } else {
      const pinIcon = L.divIcon({
        className: 'profile-pin-wrapper',
        html: `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="48"
          viewBox="0 0 40 48"
          aria-hidden="true"
          style="display:block;filter:drop-shadow(0 3px 3px rgba(0,0,0,.35))"
        >
          <path
            d="M20 46C16 40 2 27 2 20a18 18 0 1 1 36 0c0 7-14 20-18 26Z"
            fill="#0866d9"
            stroke="#ffffff"
            stroke-width="2"
          />
          <circle cx="20" cy="20" r="7" fill="#ffffff"/>
        </svg>
      `,
        iconSize: [40, 48],
        iconAnchor: [20, 47]
      });

      this.locationMarker = L.marker(
        [latitude, longitude],
        {
          draggable: true,
          icon: pinIcon,
          zIndexOffset: 1000
        }
      ).addTo(this.map);

      this.locationMarker.on('dragend', () => {
        const position = this.locationMarker!.getLatLng();

        // Reuse the same method to update coordinates and address.
        this.selectManualLocation(position.lat, position.lng);
      });
    }

    void this.fetchSelectedAddress(latitude, longitude);

    this.cdr.detectChanges();
  }

  useCurrentLocation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.map) return;
    if (!window.isSecureContext || !navigator.geolocation) {
      this.locationMessage = 'Location requires HTTPS (or localhost) and a supported browser.';
      this.cdr.detectChanges();
      return;
    }
    this.stopLocationWatch();
    const request = this.locationRequest;
    this.isLocating = true;
    this.locationMessage = 'Finding your location; waiting for a more accurate reading…';
    let best: GeolocationPosition | null = null;
    const finish = (error?: GeolocationPositionError) => {
      if (request !== this.locationRequest || !this.map) return;
      this.stopLocationWatch();
      if (best) {
        const { latitude, longitude, accuracy } = best.coords;
        this.locationAccuracy = accuracy;
        this.accuracyCircle?.remove();
        this.accuracyCircle = this.leaflet!.circle([latitude, longitude], {
          radius: accuracy, color: '#0866d9', weight: 1,
          fillColor: '#3b82f6', fillOpacity: 0.12, interactive: false
        }).addTo(this.map);
        this.locationMessage = accuracy <= 50
          ? 'Location detected. Check the pin before confirming.'
          : 'Location is approximate. Move the pin to your exact delivery point.';
        this.setSelectedLocation(latitude, longitude);
        this.map.fitBounds(this.accuracyCircle.getBounds(), { padding: [32, 32], maxZoom: 17 });
      } else {
        this.locationMessage = error?.code === 1
          ? 'Location permission denied. Allow location in browser/site settings, then retry.'
          : error?.code === 2
            ? 'Device location is unavailable. Enable location services or select a point manually.'
            : 'Location request timed out. Retry or select a point manually.';
      }
      this.cdr.detectChanges();
    };
    this.geoTimer = setTimeout(() => finish(), 20000);
    this.geoWatchId = navigator.geolocation.watchPosition(position => {
      if (request !== this.locationRequest || !this.map) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        !Number.isFinite(accuracy) || accuracy < 0) return;
      if (!best || accuracy < best.coords.accuracy) best = position;
      if (best.coords.accuracy <= 30) finish();
    }, error => finish(error), {
      enableHighAccuracy: true, maximumAge: 0, timeout: 20000
    });
    this.cdr.detectChanges();
  }

  confirmLocation(): void {

    if (
      this.selectedLatitude === null ||
      this.selectedLongitude === null
    ) {
      return;
    }

    this.model.fldGPSLocation =
      `${this.selectedLatitude.toFixed(6)},` +
      `${this.selectedLongitude.toFixed(6)}`;

    this.validationErrors = this.validationErrors.filter(x => x.field !== 'deliveryLocationButton');
    this.closeLocationMap();
    this.focusField('deliveryLocationButton');

  }


  closeLocationMap(): void {
    ++this.mapSession;
    this.stopLocationWatch();
    ++this.addressRequest;
    if (this.addressTimer !== null) clearTimeout(this.addressTimer);
    this.addressTimer = null;
    this.addressAbort?.abort();
    this.addressAbort = null;
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    this.map?.remove();
    this.map = null;
    this.locationMarker = null;
    this.accuracyCircle = null;
    this.locationAccuracy = null;
    this.showLocationMap = false;
  }

  registerProfile(form: NgForm): void {
    if (this.isSaving || !this.validateRegistration(form)) return;
    this.OnFormSubmit(form, 'SaveAndClose');
  }

  onHouseImageSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

      this.toastr.error(
        "Please select a JPG, PNG or WebP image."
      );

      input.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      this.toastr.error(
        "Image size must not exceed 5 MB."
      );

      input.value = "";

      return;
    }

    this.selectedHouseImage = file;

    const reader = new FileReader();

    reader.onload = () => {

      this.houseImagePreview =
        reader.result as string;

      this.cdr.detectChanges();

    };

    reader.readAsDataURL(file);

  }

  removeHouseImage(
    input: HTMLInputElement
  ): void {

    this.selectedHouseImage = null;

    this.houseImagePreview = null;

    this.model.fldHouseImagePath = "";

    input.value = "";

  }

  async fetchSelectedAddress(latitude: number, longitude: number): Promise<void> {
    const request = ++this.addressRequest;
    if (this.addressTimer !== null) clearTimeout(this.addressTimer);
    this.addressAbort?.abort();
    this.selectedMapAddress = 'Fetching selected address…';
    // Debounce rapid map selections and space requests within this component.
    const delay = Math.max(500, 1100 - (Date.now() - this.lastAddressRequestAt));
    this.addressTimer = setTimeout(() => {
      this.addressTimer = null;
      void this.loadSelectedAddress(latitude, longitude, request);
    }, delay);
  }

  private async loadSelectedAddress(latitude: number, longitude: number, request: number): Promise<void> {
    if (request !== this.addressRequest || !this.showLocationMap) return;
    const controller = new AbortController();
    this.addressAbort = controller;
    this.lastAddressRequestAt = Date.now();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const params = new URLSearchParams({
        format: 'jsonv2', lat: String(latitude), lon: String(longitude),
        zoom: '18', addressdetails: '1'
      });
      const response = await fetch('https://nominatim.openstreetmap.org/reverse?' + params, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Address lookup failed');
      const result = await response.json();
      if (request !== this.addressRequest || !this.showLocationMap) return;
      this.selectedMapAddress = result.display_name || 'Address unavailable for this location.';
    } catch {
      if (request !== this.addressRequest || !this.showLocationMap) return;
      this.selectedMapAddress = 'Address unavailable. Verify the pin; you can still confirm coordinates.';
    } finally {
      clearTimeout(timeout);
      if (request === this.addressRequest && this.showLocationMap) this.cdr.detectChanges();
    }
  }

  onUserTypeChange(): void {

    if (this.model.fldUserType !== 'Customer') {
      return;
    }

    this.model.fldvADMinBillValue = 0;
    this.model.fldvADChargesWaiverValue = 0;
    this.model.fldvRDMinBillValue = 0;
    this.model.fldvRDChargesWaiverValue = 0;
    this.model.fldvPDMinBillValue = 0;
    this.model.fldvPDChargesWaiverValue = 0;
    this.model.fldvVendorName = '';
    this.model.fldvAllowAdvanceOrder = false;
    this.model.fldvADEndTime = '';
    this.model.fldvADCharges = 0;

    this.model.fldvRegularDeliveryStartTime = '';
    this.model.fldvRDCharges = 0;

    this.model.fldvAcceptingPriortyOrder = false;
    this.model.fldvPDDuration = '';
    this.model.fldvPDCharges = 0;

    this.model.fldvCoveredRadius = 0;
    this.model.fldvAdditionalChargesPerKm = 0;
    this.model.fldvMaxCoveredRadius = 0;

    this.model.fldvUPIId = null;
    this.model.fldvUPIPayeeName = null;
  }

  onStreetChange(streetId: number): void {

    const selectedStreet =
      this.tblStreetMasterList.find(
        x => x.fldId === Number(streetId)
      );

    if (selectedStreet) {

      // Existing Street ID
      this.model.fldFKStreetId =
        selectedStreet.fldId;

      // Existing Street Name
      this.model.fldStreetName =
        selectedStreet.fldStreetName;

      console.log(
        'Selected Street ID:',
        this.model.fldFKStreetId
      );

      console.log(
        'Selected Street Name:',
        this.model.fldStreetName
      );

    } else {

      this.model.fldFKStreetId = 0;
      this.model.fldStreetName = '';
    }
  }

  onMPINChange(value: string): void {
    this.model.fldPasswordHash = value
      .replace(/\D/g, '')
      .slice(0, 6);
  }

}

