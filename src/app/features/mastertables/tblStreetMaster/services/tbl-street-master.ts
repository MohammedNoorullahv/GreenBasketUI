import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblStreetMaster } from '../models/tblStreetMaster.model';
import { TblStreetMasterAdd } from '../models/tblStreetMaster-Add.model';
import { TblStreetMasterUpdate } from '../models/tblStreetMaster-Update.model';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})

export class TblStreetMasterService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblStreetMasters(): Observable<TblStreetMaster[]> {
    return this.http.get<TblStreetMaster[]>(`${environment.apiBaseUrl}/api/TblStreetMaster/GetAllTblStreetMasters`);
  };

  //GET ACTIVE
  getActiveTblStreetMasters(): Observable<TblStreetMaster[]> {
    return this.http.get<TblStreetMaster[]>(`${environment.apiBaseUrl}/api/TblStreetMaster/GetActiveTblStreetMasters`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblStreetMasters(): Observable<TblStreetMaster[]> {
    return this.http.get<TblStreetMaster[]>(`${environment.apiBaseUrl}/api/TblStreetMaster/GetActiveLeanTblStreetMasters`);
  };

  //POST
  addTblStreetMaster(model: TblStreetMasterAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblStreetMaster/CreateTblStreetMaster`, model);
  };

  //GET
  getTblStreetMasterById(id: number): Observable<TblStreetMaster> {
    return this.http.get<TblStreetMaster>(`${environment.apiBaseUrl}/api/TblStreetMaster/GetTblStreetMasterById/${id}`);
  };

  //UPDATE
  updateTblStreetMaster(tblStreetMasterupdate: TblStreetMasterUpdate): Observable<TblStreetMaster> {
    return this.http.patch<TblStreetMaster>(`${environment.apiBaseUrl}/api/TblStreetMaster/updateTblStreetMaster`, tblStreetMasterupdate);
  };

  //DELETE
  deleteTblStreetMaster(tblStreetMasterdelete: TblStreetMasterUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblStreetMaster/DeleteTblStreetMaster`,
      {
        body: tblStreetMasterdelete,
        observe: 'response'
      });
  };
}