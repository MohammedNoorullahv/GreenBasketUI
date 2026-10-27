// Path: src/app/features/mastertables/tblMenuMaster/services/tbl-menu-master.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblMenuMaster } from '../models/tblMenuMaster.model';
import { TblMenuMasterAdd } from '../models/tblMenuMaster-Add.model';
import { TblMenuMasterUpdate } from '../models/tblMenuMaster-Update.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TblMenuMasterService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblMenuMasters(): Observable<TblMenuMaster[]> {
    return this.http.get<TblMenuMaster[]>(`${environment.apiBaseUrl}/api/TblMenuMaster/GetAllTblMenuMasters`);
  };

  //GET ACTIVE
  getActiveTblMenuMasters(): Observable<TblMenuMaster[]> {
    return this.http.get<TblMenuMaster[]>(`${environment.apiBaseUrl}/api/TblMenuMaster/GetActiveTblMenuMasters`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblMenuMasters(): Observable<TblMenuMaster[]> {
    return this.http.get<TblMenuMaster[]>(`${environment.apiBaseUrl}/api/TblMenuMaster/GetActiveLeanTblMenuMasters`);
  };

  //GET - BY ID
  getTblMenuMasterById(id: number): Observable<TblMenuMaster> {
    return this.http.get<TblMenuMaster>(`${environment.apiBaseUrl}/api/TblMenuMaster/GetTblMenuMasterById/${id}`);
  };

  //POST
  addTblMenuMaster(model: TblMenuMasterAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblMenuMaster/CreateTblMenuMaster`, model);
  };

  //POST - RANGE
  addRangeTblMenuMaster(models: TblMenuMasterAdd[]): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblMenuMaster/CreateRangeTblMenuMaster`, models);
  };

  //UPDATE (HTTP PATCH)
  updateTblMenuMaster(model: TblMenuMasterUpdate): Observable<TblMenuMaster> {
    return this.http.patch<TblMenuMaster>(`${environment.apiBaseUrl}/api/TblMenuMaster/UpdateTblMenuMaster`, model);
  };

  //UPDATE - RANGE
  updateRangeTblMenuMaster(models: TblMenuMasterUpdate[]): Observable<TblMenuMaster[]> {
    return this.http.patch<TblMenuMaster[]>(`${environment.apiBaseUrl}/api/TblMenuMaster/UpdateRangeTblMenuMaster`, models);
  };

  //DELETE
  deleteTblMenuMaster(model: TblMenuMasterUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblMenuMaster/DeleteTblMenuMaster`,
      {
        body: model,
        observe: 'response'
      });
  };

  //DELETE - RANGE
  deleteRangeTblMenuMaster(models: TblMenuMasterUpdate[]): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblMenuMaster/DeleteRangeTblMenuMaster`,
      {
        body: models,
        observe: 'response'
      });
  };
}
