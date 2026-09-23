import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {TblOrderDetail } from '../models/tblOrderDetail.model';
import {TblOrderDetailAdd } from '../models/tblOrderDetail-Add.model';
import {TblOrderDetailUpdate } from '../models/tblOrderDetail-Update.model';
import { environment } from '../../../../../environments/environment.development';


@Injectable({
  providedIn: 'root',
})

export class TblOrderDetailService {
constructor(private http: HttpClient) { }

//GET ALL
getAllTblOrderDetails(): Observable<TblOrderDetail[]>{
	return this.http.get<TblOrderDetail[]>(`${ environment.apiBaseUrl}/api/TblOrderDetail/GetAllTblOrderDetails`);
};

//GET ACTIVE
getActiveTblOrderDetails(): Observable<TblOrderDetail[]>{
	return this.http.get<TblOrderDetail[]>(`${ environment.apiBaseUrl}/api/TblOrderDetail/GetActiveTblOrderDetails`);
};

//GET ACTIVELEAN
getActiveLeanTblOrderDetails(): Observable<TblOrderDetail[]>{
	return this.http.get<TblOrderDetail[]>(`${ environment.apiBaseUrl}/api/TblOrderDetail/GetActiveLeanTblOrderDetails`);
};

//POST
addTblOrderDetail(model: TblOrderDetailAdd): Observable<void>{
	return this.http.post<void>(`${ environment.apiBaseUrl}/api/TblOrderDetail/CreateTblOrderDetail`, model);
};

//GET
getTblOrderDetailById(id: number): Observable<TblOrderDetail>{
	return this.http.get<TblOrderDetail>(`${ environment.apiBaseUrl}/api/TblOrderDetail/GetTblOrderDetailById/${id}`);
};

//UPDATE
updateTblOrderDetail(tblOrderDetailupdate: TblOrderDetailUpdate): Observable<TblOrderDetail>{
	return this.http.patch<TblOrderDetail>(`${ environment.apiBaseUrl}/api/TblOrderDetail/updateTblOrderDetail` ,tblOrderDetailupdate);
};

//DELETE
deleteTblOrderDetail(tblOrderDetaildelete: TblOrderDetailUpdate): Observable<HttpResponse<any>>{
	return this.http.delete<any>(`${ environment.apiBaseUrl}/api/TblOrderDetail/DeleteTblOrderDetail` ,
		{
			body: tblOrderDetaildelete,
			observe: 'response'
		});
};
