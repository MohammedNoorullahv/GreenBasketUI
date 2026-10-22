// Path: src/app/features/mastertables/tblPropertyMaster/services/tbl-property-master.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblPropertyMaster } from '../models/tblPropertyMaster.model';
import { TblPropertyMasterAdd } from '../models/tblPropertyMaster-Add.model';
import { TblPropertyMasterUpdate } from '../models/tblPropertyMaster-Update.model';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class TblPropertyMasterService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblPropertyMasters(): Observable<TblPropertyMaster[]> {
    return this.http.get<TblPropertyMaster[]>(`${environment.apiBaseUrl}/api/TblPropertyMaster/GetAllTblPropertyMasters`);
  };

  //GET ACTIVE
  getActiveTblPropertyMasters(): Observable<TblPropertyMaster[]> {
    return this.http.get<TblPropertyMaster[]>(`${environment.apiBaseUrl}/api/TblPropertyMaster/GetActiveTblPropertyMasters`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblPropertyMasters(): Observable<TblPropertyMaster[]> {
    return this.http.get<TblPropertyMaster[]>(`${environment.apiBaseUrl}/api/TblPropertyMaster/GetActiveLeanTblPropertyMasters`);
  };

  //GET - BY ID
  getTblPropertyMasterById(id: number): Observable<TblPropertyMaster> {
    return this.http.get<TblPropertyMaster>(`${environment.apiBaseUrl}/api/TblPropertyMaster/GetTblPropertyMasterById/${id}`);
  };

  //POST
  addTblPropertyMaster(model: TblPropertyMasterAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblPropertyMaster/CreateTblPropertyMaster`, model);
  };

  //POST - RANGE
  addRangeTblPropertyMaster(models: TblPropertyMasterAdd[]): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblPropertyMaster/CreateRangeTblPropertyMaster`, models);
  };

  //UPDATE (HTTP PATCH)
  updateTblPropertyMaster(model: TblPropertyMasterUpdate): Observable<TblPropertyMaster> {
    return this.http.patch<TblPropertyMaster>(`${environment.apiBaseUrl}/api/TblPropertyMaster/UpdateTblPropertyMaster`, model);
  };

  //UPDATE - RANGE
  updateRangeTblPropertyMaster(models: TblPropertyMasterUpdate[]): Observable<TblPropertyMaster[]> {
    return this.http.patch<TblPropertyMaster[]>(`${environment.apiBaseUrl}/api/TblPropertyMaster/UpdateRangeTblPropertyMaster`, models);
  };

  //DELETE
  deleteTblPropertyMaster(model: TblPropertyMasterUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblPropertyMaster/DeleteTblPropertyMaster`,
      {
        body: model,
        observe: 'response'
      });
  };

  //DELETE - RANGE
  deleteRangeTblPropertyMaster(models: TblPropertyMasterUpdate[]): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblPropertyMaster/DeleteRangeTblPropertyMaster`,
      {
        body: models,
        observe: 'response'
      });
  };
}
