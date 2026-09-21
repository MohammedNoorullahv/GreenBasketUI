import { Component, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-tbl-profile-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './tbl-profile-add.html',
  styleUrl: './tbl-profile-add.css',
})

export class TblProfileAddComponent implements OnDestroy {
  model: TblProfileAdd;
  submitAction: 'SaveAndAddNew' | 'SaveAndClose' | 'exit' = 'exit'; // default to exit
  private addTblProfileSubscription?: Subscription;
  @ViewChild('form') form!: NgForm;
  isSaving: boolean = false;

  tblStreetMaster$?: Observable<TblStreetMaster[]>


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

  selectedMapAddress = "";

  constructor(private tblProfileService: TblProfileService,
    private tblStreetMasterService: TblStreetMasterService,
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
      fldIsTermsAgreed: true,
      fldIsActive: true,
      fldCreatedBy: 0,
      fldCreatedDt: new Date(),
    };
  }

  ngOnInit(): void {


    this.tblStreetMaster$ = this.tblStreetMasterService.getActiveLeanTblStreetMasters();



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

    if (!this.model.fldFKStreetId || this.model.fldFKStreetId <= 0) {
      return;
    }

    if (!this.model.fldGPSLocation?.trim()) {
      return;
    }

    this.isSaving = true;

    this.addTblProfileSubscription = this.tblProfileService.addTblProfile(this.model)
      .subscribe({
        next: (response) => {
          this.isSaving = false;

          this.toastr.success('Record saved successfully!', 'Success', {
            toastClass: 'ngx-toastr custom-toast'
          });

          if (this.submitAction === 'SaveAndAddNew') {
            this.resetForm();
            this.cdr.detectChanges();
          } else {
            this.router.navigateByUrl('mastertables/tblProfile');
          }
        },
        error: (err) => {
          this.isSaving = false;

          const errorMsg = err?.error?.message || err?.error || 'An unexpected error occurred';

          this.toastr.error(errorMsg, 'Error', {
            toastClass: 'ngx-toastr custom-toast error-toast'
          });

          console.error('API Error:', err);
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
    this.router.navigateByUrl('mastertables/tblProfile');
  }

  ngOnDestroy(): void {
    this.addTblProfileSubscription?.unsubscribe();
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

    if (!this.model.fldFKStreetId || this.model.fldFKStreetId <= 0) {
      return false;
    }

    if (!this.model.fldGPSLocation?.trim()) {
      return false;
    }

    return true;
  }


  toggleManualStreet(): void {

    this.manualStreetEntry = !this.manualStreetEntry;

    if (this.manualStreetEntry) {

      this.model.fldFKStreetId = 0;

    } else {

      this.model.fldStreetName = "";

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


  registerProfile(form: NgForm): void {

    if (
      !this.model.fldGPSLocation ||
      !this.model.fldGPSLocation.trim()
    ) {

      alert("Please select your delivery location.");

      return;

    }

    if (!this.model.fldIsTermsAgreed) {

      alert(
        "Please agree to the Terms & Conditions."
      );

      return;

    }

    if (
      this.manualStreetEntry &&
      !this.model.fldStreetName?.trim()
    ) {

      alert("Please enter your street name.");

      return;

    }

    if (form.invalid) {

      form.control.markAllAsTouched();

      return;

    }

    this.OnFormSubmit(
      form,
      "SaveAndClose"
    );

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

}

