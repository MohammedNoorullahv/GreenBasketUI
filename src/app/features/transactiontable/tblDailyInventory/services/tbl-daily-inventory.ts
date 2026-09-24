import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblDailyInventory } from '../models/tblDailyInventory.model';
import { TblDailyInventoryAdd } from '../models/tblDailyInventory-Add.model';
import { TblDailyInventoryUpdate } from '../models/tblDailyInventory-Update.model';
import { environment } from '../../../../../environments/environment.development';
import { DailyStockEntrySaveRequest, TblDailyInventoryforStockEntry } from '../models/tblDailyInventoryforStockEntry.model';
import { OrderStockItem } from '../../tblOrder/models/tbl-order-shopping.model';


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


  // Add INSIDE existing TblDailyInventoryService; reuse its HttpClient and environment import.
  getAllTblDailyInventoryforStockEntry(inventoryDate: string) {
    const params = new HttpParams().set('inventoryDate', inventoryDate);
    return this.http.get<TblDailyInventoryforStockEntry[]>(
      `${environment.apiBaseUrl}/api/TblDailyInventory/GetAllTblDailyInventoryforStockEntry`,
      { params }
    );
  }

  // saveDailyStockEntry(payload: TblDailyInventoryforStockEntry) {
  //   return this.http.post<void>(
  //     `${environment.apiBaseUrl}/api/TblDailyInventory/SaveDailyStockEntry`,
  //     payload
  //   );
  // }

  //https://localhost:7082/api/TblDailyInventory/CreateTblDailyInventoryStockEntry
  saveDailyStockEntry(
    payload: DailyStockEntrySaveRequest
  ) {
    return this.http.post<void>(
      `${environment.apiBaseUrl}/api/TblDailyInventory/CreateTblDailyInventoryStockEntry`,
      payload
    );
  }

  //https://localhost:7082/api/TblDailyInventory/GetAvailableStockForOrder?FldFKVendorId=1
  getAvailableStockForOrder(
    vendorId: number
  ): Observable<OrderStockItem[]> {

    const params = new HttpParams()
      .set('FldFKVendorId', vendorId.toString());

    return this.http.get<OrderStockItem[]>(
      `${environment.apiBaseUrl}/api/TblDailyInventory/GetAvailableStockForOrder`,
      { params }
    );

  }


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
