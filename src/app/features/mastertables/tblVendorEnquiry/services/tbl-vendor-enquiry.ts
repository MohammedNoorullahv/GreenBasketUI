// Path: src/app/features/mastertables/tblVendorEnquiry/services/tbl-vendor-enquiry.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TblVendorEnquiryAdd } from '../models/tblVendorEnquiry-Add.model';

// Backend contract (to be implemented in the API, [AllowAnonymous]):
//   POST {apiBaseUrl}/api/TblVendorEnquiry/CreateTblVendorEnquiry
//   Body: TblVendorEnquiryAdd (camelCase JSON, default ASP.NET Core binding)
//   Success: 2xx. Validation failures: 400 ProblemDetails.
@Injectable({
  providedIn: 'root'
})
export class TblVendorEnquiryService {
  constructor(private http: HttpClient) { }

  createTblVendorEnquiry(model: TblVendorEnquiryAdd): Observable<void> {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/TblVendorEnquiry/CreateTblVendorEnquiry`, model);
  }
}
