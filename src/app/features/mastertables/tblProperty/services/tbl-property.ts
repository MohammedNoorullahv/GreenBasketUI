// Path: src/app/features/mastertables/tblProperty/services/tbl-property.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblProperty } from '../models/tblProperty.model';
import { TblPropertyAdd } from '../models/tblProperty-Add.model';
import { TblPropertyUpdate } from '../models/tblProperty-Update.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TblPropertyService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblPropertys(): Observable<TblProperty[]> {
    return this.http.get<TblProperty[]>(`${environment.apiBaseUrl}/api/TblProperty/GetAllTblPropertys`);
  };

  //GET ACTIVE
  getActiveTblPropertys(): Observable<TblProperty[]> {
    return this.http.get<TblProperty[]>(`${environment.apiBaseUrl}/api/TblProperty/GetActiveTblPropertys`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblPropertys(): Observable<TblProperty[]> {
    return this.http.get<TblProperty[]>(`${environment.apiBaseUrl}/api/TblProperty/GetActiveLeanTblPropertys`);
  };

  //GET - BY ID
  getTblPropertyById(id: number): Observable<TblProperty> {
    return this.http.get<TblProperty>(`${environment.apiBaseUrl}/api/TblProperty/GetTblPropertyById/${id}`);
  };

  //POST
  addTblProperty(model: TblPropertyAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblProperty/CreateTblProperty`, model);
  };

  //POST - RANGE
  addRangeTblProperty(models: TblPropertyAdd[]): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblProperty/CreateRangeTblProperty`, models);
  };

  //UPDATE (HTTP PATCH)
  updateTblProperty(model: TblPropertyUpdate): Observable<TblProperty> {
    return this.http.patch<TblProperty>(`${environment.apiBaseUrl}/api/TblProperty/UpdateTblProperty`, model);
  };

  //UPDATE - RANGE
  updateRangeTblProperty(models: TblPropertyUpdate[]): Observable<TblProperty[]> {
    return this.http.patch<TblProperty[]>(`${environment.apiBaseUrl}/api/TblProperty/UpdateRangeTblProperty`, models);
  };

  //DELETE
  deleteTblProperty(model: TblPropertyUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblProperty/DeleteTblProperty`,
      {
        body: model,
        observe: 'response'
      });
  };

  //DELETE - RANGE
  deleteRangeTblProperty(models: TblPropertyUpdate[]): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblProperty/DeleteRangeTblProperty`,
      {
        body: models,
        observe: 'response'
      });
  };
}
