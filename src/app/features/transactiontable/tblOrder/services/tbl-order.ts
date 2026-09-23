import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {TblOrder } from '../models/tblOrder.model';
import {TblOrderAdd } from '../models/tblOrder-Add.model';
import {TblOrderUpdate } from '../models/tblOrder-Update.model';
import { environment } from '../../../../../environments/environment.development';


@Injectable({
  providedIn: 'root',
})

export class TblOrderService {
constructor(private http: HttpClient) { }

//GET ALL
getAllTblOrders(): Observable<TblOrder[]>{
	return this.http.get<TblOrder[]>(`${ environment.apiBaseUrl}/api/TblOrder/GetAllTblOrders`);
};

//GET ACTIVE
getActiveTblOrders(): Observable<TblOrder[]>{
	return this.http.get<TblOrder[]>(`${ environment.apiBaseUrl}/api/TblOrder/GetActiveTblOrders`);
};

//GET ACTIVELEAN
getActiveLeanTblOrders(): Observable<TblOrder[]>{
	return this.http.get<TblOrder[]>(`${ environment.apiBaseUrl}/api/TblOrder/GetActiveLeanTblOrders`);
};

//POST
addTblOrder(model: TblOrderAdd): Observable<void>{
	return this.http.post<void>(`${ environment.apiBaseUrl}/api/TblOrder/CreateTblOrder`, model);
};

//GET
getTblOrderById(id: number): Observable<TblOrder>{
	return this.http.get<TblOrder>(`${ environment.apiBaseUrl}/api/TblOrder/GetTblOrderById/${id}`);
};

//UPDATE
updateTblOrder(tblOrderupdate: TblOrderUpdate): Observable<TblOrder>{
	return this.http.patch<TblOrder>(`${ environment.apiBaseUrl}/api/TblOrder/updateTblOrder` ,tblOrderupdate);
};

//DELETE
deleteTblOrder(tblOrderdelete: TblOrderUpdate): Observable<HttpResponse<any>>{
	return this.http.delete<any>(`${ environment.apiBaseUrl}/api/TblOrder/DeleteTblOrder` ,
		{
			body: tblOrderdelete,
			observe: 'response'
		});
};
}
