import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblItemMaster } from '../models/tblItemMaster.model';
import { TblItemMasterAdd } from '../models/tblItemMaster-Add.model';
import { TblItemMasterUpdate } from '../models/tblItemMaster-Update.model';
import { environment } from '../../../../../environments/environment.development';


@Injectable({
  providedIn: 'root',
})

export class TblItemMasterService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblItemMasters(): Observable<TblItemMaster[]> {
    return this.http.get<TblItemMaster[]>(`${environment.apiBaseUrl}/api/TblItemMaster/GetAllTblItemMasters`);
  };

  //GET ACTIVE
  getActiveTblItemMasters(): Observable<TblItemMaster[]> {
    return this.http.get<TblItemMaster[]>(`${environment.apiBaseUrl}/api/TblItemMaster/GetActiveTblItemMasters`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblItemMasters(): Observable<TblItemMaster[]> {
    return this.http.get<TblItemMaster[]>(`${environment.apiBaseUrl}/api/TblItemMaster/GetActiveLeanTblItemMasters`);
  };

  //POST
  // addTblItemMaster(model: TblItemMasterAdd): Observable<void> {
  //   return this.http.post<void>(`${environment.apiBaseUrl}/api/TblItemMaster/CreateTblItemMaster`, model);
  // };
   addTblItemMaster(formData: FormData): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblItemMaster/CreateTblItemMaster`, formData);
  };

  //GET
  getTblItemMasterById(id: number): Observable<TblItemMaster> {
    return this.http.get<TblItemMaster>(`${environment.apiBaseUrl}/api/TblItemMaster/GetTblItemMasterById/${id}`);
  };

  //UPDATE
  updateTblItemMaster(tblItemMasterupdate: TblItemMasterUpdate): Observable<TblItemMaster> {
    return this.http.patch<TblItemMaster>(`${environment.apiBaseUrl}/api/TblItemMaster/updateTblItemMaster`, tblItemMasterupdate);
  };

  //DELETE
  deleteTblItemMaster(tblItemMasterdelete: TblItemMasterUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblItemMaster/DeleteTblItemMaster`,
      {
        body: tblItemMasterdelete,
        observe: 'response'
      });
  };
}
