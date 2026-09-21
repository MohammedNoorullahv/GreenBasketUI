import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblProfile } from '../models/tblProfile.model';
import { TblProfileAdd } from '../models/tblProfile-Add.model';
import { TblProfileUpdate } from '../models/tblProfile-Update.model';
import { environment } from '../../../../../environments/environment.development';


@Injectable({
  providedIn: 'root',
})

export class TblProfileService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblProfiles(): Observable<TblProfile[]> {
    return this.http.get<TblProfile[]>(`${environment.apiBaseUrl}/api/TblProfile/GetAllTblProfiles`);
  };

  //GET ACTIVE
  getActiveTblProfiles(): Observable<TblProfile[]> {
    return this.http.get<TblProfile[]>(`${environment.apiBaseUrl}/api/TblProfile/GetActiveTblProfiles`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblProfiles(): Observable<TblProfile[]> {
    return this.http.get<TblProfile[]>(`${environment.apiBaseUrl}/api/TblProfile/GetActiveLeanTblProfiles`);
  };

  //POST
  addTblProfile(model: TblProfileAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblProfile/CreateTblProfile`, model);
  };

  //GET
  getTblProfileById(id: number): Observable<TblProfile> {
    return this.http.get<TblProfile>(`${environment.apiBaseUrl}/api/TblProfile/GetTblProfileById/${id}`);
  };

  //UPDATE
  updateTblProfile(tblProfileupdate: TblProfileUpdate): Observable<TblProfile> {
    return this.http.patch<TblProfile>(`${environment.apiBaseUrl}/api/TblProfile/updateTblProfile`, tblProfileupdate);
  };

  //DELETE
  deleteTblProfile(tblProfiledelete: TblProfileUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblProfile/DeleteTblProfile`,
      {
        body: tblProfiledelete,
        observe: 'response'
      });
  };

}
