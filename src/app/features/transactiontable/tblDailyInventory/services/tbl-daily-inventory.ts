import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblDailyInventory } from '../models/tblDailyInventory.model';
import { TblDailyInventoryAdd } from '../models/tblDailyInventory-Add.model';
import { TblDailyInventoryUpdate } from '../models/tblDailyInventory-Update.model';
import { environment } from '../../../../../environments/environment.development';


@Injectable({
  providedIn: 'root',
})

export class TblDailyInventoryService {
  constructor(private http: HttpClient) { }

  //GET ALL
  getAllTblDailyInventorys(): Observable<TblDailyInventory[]> {
    return this.http.get<TblDailyInventory[]>(`${environment.apiBaseUrl}/api/TblDailyInventory/GetAllTblDailyInventorys`);
  };

  //GET ACTIVE
  getActiveTblDailyInventorys(): Observable<TblDailyInventory[]> {
    return this.http.get<TblDailyInventory[]>(`${environment.apiBaseUrl}/api/TblDailyInventory/GetActiveTblDailyInventorys`);
  };

  //GET ACTIVELEAN
  getActiveLeanTblDailyInventorys(): Observable<TblDailyInventory[]> {
    return this.http.get<TblDailyInventory[]>(`${environment.apiBaseUrl}/api/TblDailyInventory/GetActiveLeanTblDailyInventorys`);
  };

  //POST
  addTblDailyInventory(model: TblDailyInventoryAdd): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/TblDailyInventory/CreateTblDailyInventory`, model);
  };

  //GET
  getTblDailyInventoryById(id: number): Observable<TblDailyInventory> {
    return this.http.get<TblDailyInventory>(`${environment.apiBaseUrl}/api/TblDailyInventory/GetTblDailyInventoryById/${id}`);
  };

  //UPDATE
  updateTblDailyInventory(tblDailyInventoryupdate: TblDailyInventoryUpdate): Observable<TblDailyInventory> {
    return this.http.patch<TblDailyInventory>(`${environment.apiBaseUrl}/api/TblDailyInventory/updateTblDailyInventory`, tblDailyInventoryupdate);
  };

  //DELETE
  deleteTblDailyInventory(tblDailyInventorydelete: TblDailyInventoryUpdate): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblDailyInventory/DeleteTblDailyInventory`,
      {
        body: tblDailyInventorydelete,
        observe: 'response'
      });
  };
}
