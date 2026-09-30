import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import type * as Leaflet from 'leaflet';

import { TblProfileUpdate } from '../models/tblProfile-Update.model';
import { TblProfileService } from '../services/tbl-profile';
import { TblStreetMaster } from '../../tblStreetMaster/models/tblStreetMaster.model';
import { TblStreetMasterAdd } from '../../tblStreetMaster/models/tblStreetMaster-Add.model';
import { TblStreetMasterService } from '../../tblStreetMaster/services/tbl-street-master';
import { TblCityorTownMaster } from '../../tblCityorTownMaster/models/tblCityorTownMaster.model';
import { TblCityorTownMasterService } from '../../tblCityorTownMaster/services/tbl-cityor-town-master';

@Component({
  selector: 'app-tbl-profile-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-profile-update.html',

  // Edit uses the same HTML classes/layout as Add.
  // If your Add component folder has a different name, adjust only this path.
  styleUrl: '../tbl-profile-add/tbl-profile-add.css',
})
export class TblProfileUpdateComponent implements OnInit, OnDestroy {

  id: number | null = null;
  model: TblProfileUpdate = {} as TblProfileUpdate;
  modelsm: TblStreetMasterAdd;

  private paramSubscription?: Subscription;
  private editTblProfileSubscription?: Subscription;
  private addTblStreetMasterSubscription?: Subscription;

  @ViewChild('form') form!: NgForm;

  isSaving = false;
  showPassword = false;

  tblStreetMaster$?: Observable<TblStreetMaster[]>;
  tblCityorTownMaster$?: Observable<TblCityorTownMaster[]>;
  tblStreetMasterList: TblStreetMaster[] = [];

  selectedCityorTownId = 0;
  newStreetName = '';
  manualStreetEntry = false;

  private readonly platformId = inject(PLATFORM_ID);

  showLocationMap = false;
  selectedLatitude: number | null = null;
  selectedLongitude: number | null = null;
  private map: Leaflet.Map | null = null;
  private locationMarker: Leaflet.Marker | null = null;
  private leaflet: typeof Leaflet | null = null;

  selectedHouseImage: File | null = null;
  houseImagePreview: string | null = null;
  selectedMapAddress = '';

  constructor(
    private tblProfileService: TblProfileService,
    private tblStreetMasterService: TblStreetMasterService,
    private tblCityorTownMasterService: TblCityorTownMasterService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
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
      this.tblStreetMasterService
        .getActiveLeanTblStreetMasters()
        .pipe(
          tap((streets) => {
            this.tblStreetMasterList = streets;
          })
        );

    this.tblCityorTownMaster$ =
      this.tblCityorTownMasterService
        .getActiveLeanTblCityorTownMasters();

    this.paramSubscription =
      combineLatest([
        this.route.paramMap,
        this.route.queryParams
      ])
      .subscribe(([params]) => {

        const idParam = params.get('id');
        this.id = idParam ? parseInt(idParam, 10) : null;

        if (!this.id) {
          return;
        }

        this.tblProfileService
          .getTblProfileById(this.id)
          .subscribe({
            next: (response) => {
              this.model = response;
              this.manualStreetEntry = false;
              this.selectedCityorTownId = 0;
              this.newStreetName = '';

              if (this.model.fldHouseImagePath) {
                this.houseImagePreview = this.model.fldHouseImagePath;
              }

              this.cdr.detectChanges();
            },
            error: (err) => {
              const errorMsg =
                err?.error?.message ||
                err?.error ||
                'Unable to load Profile.';

              this.toastr.error(errorMsg, 'Error', {
                toastClass: 'ngx-toastr custom-toast error-toast'
              });
              console.error('Profile Load Error:', err);
            }
          });
      });
  }

  OnFormSubmit(form: NgForm): void {

    if (this.isSaving) {
      return;
    }

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

    if (this.manualStreetEntry) {

      if (!this.selectedCityorTownId || this.selectedCityorTownId <= 0) {
        this.toastr.warning('Please select City / Town.');
        return;
      }

      if (!this.newStreetName?.trim()) {
        this.toastr.warning('Please enter New Street Name.');
        return;
      }

    } else {

      if (!this.model.fldFKStreetId || this.model.fldFKStreetId <= 0) {
        this.toastr.warning('Please select Street Name.');
        return;
      }
    }

    if (!this.model.fldGPSLocation?.trim()) {
      this.toastr.warning('Please select your delivery location.');
      return;
    }

    if (!this.model.fldIsTermsAgreed) {
      this.toastr.warning('Please agree to the Terms & Conditions.');
      return;
    }

    this.isSaving = true;

    if (this.manualStreetEntry) {

      this.modelsm.fldId = 0;
      this.modelsm.fldFKCity = this.selectedCityorTownId;
      this.modelsm.fldStreetName = this.newStreetName.trim();
      this.modelsm.fldIsActive = true;

      this.addTblStreetMasterSubscription =
        this.tblStreetMasterService
          .addTblStreetMaster(this.modelsm)
          .subscribe({
            next: (response) => {

              // Store both the generated Street ID and Street Name.
              this.model.fldFKStreetId = response.fldId;
              this.model.fldStreetName = response.fldStreetName;

              // Update Profile only after Street creation succeeds.
              this.saveProfile();
            },
            error: (err) => {
              this.isSaving = false;

              const errorMsg =
                err?.error?.message ||
                err?.error ||
                'Unable to create Street.';

              this.toastr.error(errorMsg, 'Error', {
                toastClass: 'ngx-toastr custom-toast error-toast'
              });

              console.error('Street Save Error:', err);
            }
          });

      // Prevent Profile update from running before Street API response.
      return;
    }

    this.saveProfile();
  }

  private saveProfile(): void {

    if (!this.id) {
      this.isSaving = false;
      return;
    }

    const updateRequest: TblProfileUpdate = {
      fldId: this.model.fldId ?? this.id,
      fldUserType: this.model.fldUserType ?? '',
      fldContactNumber: this.model.fldContactNumber ?? '',
      fldAlternateContactNumber: this.model.fldAlternateContactNumber ?? '',
      fldFullName: this.model.fldFullName ?? '',
      fldComplexOrBuildingName: this.model.fldComplexOrBuildingName ?? '',
      fldDoorNo: this.model.fldDoorNo ?? '',
      fldFKStreetId: this.model.fldFKStreetId ?? 0,
      fldStreetName: this.model.fldStreetName ?? '',
      fldGPSLocation: this.model.fldGPSLocation ?? '',
      fldHouseImagePath: this.model.fldHouseImagePath ?? '',
      fldIsTermsAgreed: this.model.fldIsTermsAgreed ?? true,
      fldIsActive: this.model.fldIsActive ?? true,
      fldCreatedBy: this.model.fldCreatedBy ?? 0,
      fldCreatedDt: this.model.fldCreatedDt ?? new Date(),
      fldModifiedBy: this.model.fldModifiedBy ?? 0,
      fldModifiedDt: this.model.fldModifiedDt ?? new Date(),

      fldvADCharges: this.model.fldvADCharges ?? 0,
      fldvADEndTime: this.model.fldvADEndTime ?? '',
      fldvAcceptingPriortyOrder: this.model.fldvAcceptingPriortyOrder ?? false,
      fldvAllowAdvanceOrder: this.model.fldvAllowAdvanceOrder ?? false,
      fldvPDCharges: this.model.fldvPDCharges ?? 0,
      fldvPDDuration: this.model.fldvPDDuration ?? '',
      fldvRDCharges: this.model.fldvRDCharges ?? 0,
      fldvRegularDeliveryStartTime: this.model.fldvRegularDeliveryStartTime ?? '',
      fldvAdditionalChargesPerKm: this.model.fldvAdditionalChargesPerKm ?? 0,
      fldvCoveredRadius: this.model.fldvCoveredRadius ?? 0,
      fldvMaxCoveredRadius: this.model.fldvMaxCoveredRadius ?? 0,
      fldvUPIId: this.model.fldvUPIId ?? '',
      fldvUPIPayeeName: this.model.fldvUPIPayeeName ?? '',
      fldEmailId: this.model.fldEmailId ?? '',
      fldPasswordHash: this.model.fldPasswordHash ?? '',
      fldvVendorName: this.model.fldvVendorName ?? '',
    };

    this.editTblProfileSubscription =
      this.tblProfileService
        .updateTblProfile(updateRequest)
        .subscribe({
          next: () => {

            this.isSaving = false;

            // Stay on this page after successful update.
            this.toastr.success('Changes updated', 'Success', {
              toastClass: 'ngx-toastr custom-toast'
            });

            if (this.manualStreetEntry) {
              this.manualStreetEntry = false;
              this.selectedCityorTownId = 0;
              this.newStreetName = '';

              // Reload Street list so the newly-created Street is selectable.
              this.tblStreetMaster$ =
                this.tblStreetMasterService
                  .getActiveLeanTblStreetMasters()
                  .pipe(
                    tap((streets) => {
                      this.tblStreetMasterList = streets;
                    })
                  );
            }

            this.cdr.detectChanges();
          },
          error: (err) => {

            this.isSaving = false;

            const errorMsg =
              err?.error?.message ||
              err?.error ||
              'An unexpected error occurred';

            this.toastr.error(errorMsg, 'Error', {
              toastClass: 'ngx-toastr custom-toast error-toast'
            });

            console.error('Profile Update Error:', err);
          }
        });
  }

  backToHome(): void {
    this.router.navigateByUrl('mastertables/tblProfile');
  }

  isFormValid(form: NgForm): boolean {

    if (form.invalid) {
      return false;
    }

    if (!this.model.fldFullName?.trim()) {
      return false;
    }

    if (!this.model.fldDoorNo?.trim()) {
      return false;
    }

    if (this.manualStreetEntry) {

      if (!this.selectedCityorTownId || this.selectedCityorTownId <= 0) {
        return false;
      }

      if (!this.newStreetName?.trim()) {
        return false;
      }

    } else {

      if (!this.model.fldFKStreetId || this.model.fldFKStreetId <= 0) {
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

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.showLocationMap = true;

    this.cdr.detectChanges();

    await new Promise<void>(resolve =>
      setTimeout(resolve, 0)
    );

    await this.initializeLocationMap();

  }


  private async initializeLocationMap(): Promise<void> {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const L = await import("leaflet");

    this.leaflet = L;

    if (this.map) {

      this.map.remove();

      this.map = null;

      this.locationMarker = null;

    }

    const existingLocation =
      this.model.fldGPSLocation?.split(",")
        .map((value: string) => Number(value.trim()));

    const hasExistingLocation =
      existingLocation?.length === 2 &&
      existingLocation.every(Number.isFinite);

    const latitude = hasExistingLocation
      ? existingLocation![0]
      : 12.9380;

    const longitude = hasExistingLocation
      ? existingLocation![1]
      : 79.2810;

    this.selectedLatitude = hasExistingLocation
      ? latitude
      : null;

    this.selectedLongitude = hasExistingLocation
      ? longitude
      : null;

    this.map = L.map("profileLocationMap").setView(
      [latitude, longitude],
      17
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    this.map.on("click", (event: Leaflet.LeafletMouseEvent) => {

      this.setSelectedLocation(
        event.latlng.lat,
        event.latlng.lng
      );

    });

    if (hasExistingLocation) {

      this.setSelectedLocation(
        latitude,
        longitude
      );

    }

    this.map.invalidateSize();

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

    // 1. Move the existing marker, if available
    if (this.locationMarker) {

      this.locationMarker.setLatLng([
        latitude,
        longitude
      ]);

    } else {

      // 2. Create the marker for the first time
      const pinIcon = L.divIcon({

        className: "profile-pin-wrapper",

        html: `
        <div class="profile-location-pin">
          <i class="bi bi-geo-alt-fill"></i>
        </div>
      `,

        iconSize: [32, 32],
        iconAnchor: [16, 32]

      });

      this.locationMarker = L.marker(
        [latitude, longitude],
        {
          draggable: true,
          icon: pinIcon
        }
      ).addTo(this.map);

      // 3. Fetch address whenever customer drags the pin
      this.locationMarker.on("dragend", () => {

        const position =
          this.locationMarker!.getLatLng();

        this.selectedLatitude = position.lat;
        this.selectedLongitude = position.lng;

        void this.fetchSelectedAddress(
          position.lat,
          position.lng
        );

        this.cdr.detectChanges();

      });

    }

    // 4. Fetch address whenever customer clicks on the map
    //    or selects their current location
    void this.fetchSelectedAddress(
      latitude,
      longitude
    );

    this.cdr.detectChanges();

  }


  useCurrentLocation(): void {

    if (
      !isPlatformBrowser(this.platformId) ||
      !navigator.geolocation
    ) {

      alert("Geolocation is not supported.");

      return;

    }

    navigator.geolocation.getCurrentPosition(

      position => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        this.setSelectedLocation(
          latitude,
          longitude
        );

        this.map?.setView(
          [latitude, longitude],
          17
        );

      },

      error => {

        alert(
          "Unable to fetch current location. " +
          "Please select it manually on the map."
        );

        console.error(error);

      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }

    );

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

    this.closeLocationMap();

  }


  closeLocationMap(): void {

    if (this.map) {

      this.map.remove();

      this.map = null;

      this.locationMarker = null;

    }

    this.showLocationMap = false;

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

  async fetchSelectedAddress(
    latitude: number,
    longitude: number
  ): Promise<void> {

    this.selectedMapAddress =
      "Fetching selected address...";

    try {

      const url =
        "https://nominatim.openstreetmap.org/reverse" +
        "?format=jsonv2" +
        "&lat=" + encodeURIComponent(latitude) +
        "&lon=" + encodeURIComponent(longitude) +
        "&zoom=18" +
        "&addressdetails=1";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Address lookup failed");
      }

      const result = await response.json();

      this.selectedMapAddress =
        result.display_name ||
        "Address unavailable for this location.";

    } catch {

      this.selectedMapAddress =
        "Street address unavailable. " +
        "Please verify the location on the map.";

    }

    this.cdr.detectChanges();

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

  ngOnDestroy(): void {

    this.paramSubscription?.unsubscribe();
    this.editTblProfileSubscription?.unsubscribe();
    this.addTblStreetMasterSubscription?.unsubscribe();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

}
