import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblOrder } from '../models/tblOrder.model';
import { TblOrderAdd } from '../models/tblOrder-Add.model';
import { TblOrderUpdate } from '../models/tblOrder-Update.model';
import { environment } from '../../../../../environments/environment.development';

import { OrderShoppingRequest } from '../models/tbl-order-shopping.model';
import { TblPendingOrderDto } from '../models/tbl-pending-order.model';


@Injectable({
	providedIn: 'root',
})

export class TblOrderService {
	constructor(private http: HttpClient) { }

	//GET ALL
	getAllTblOrders(): Observable<TblOrder[]> {
		return this.http.get<TblOrder[]>(`${environment.apiBaseUrl}/api/TblOrder/GetAllTblOrders`);
	};

	//GET ACTIVE
	getActiveTblOrders(): Observable<TblOrder[]> {
		return this.http.get<TblOrder[]>(`${environment.apiBaseUrl}/api/TblOrder/GetActiveTblOrders`);
	};

	//GET ACTIVELEAN
	getActiveLeanTblOrders(): Observable<TblOrder[]> {
		return this.http.get<TblOrder[]>(`${environment.apiBaseUrl}/api/TblOrder/GetActiveLeanTblOrders`);
	};



	//POST
	addTblOrder(model: TblOrderAdd): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/api/TblOrder/CreateTblOrder`, model);
	};

	//https://localhost:7082/api/TblOrder/GetPendingOrders?FldProfileType=Customer&FldFKProfileId=2

	//https://localhost:7082/api/TblOrder/CreateTblOrderHeaderAndDetail
	addTblOrderwithDetail(
		payload: OrderShoppingRequest
	) {
		return this.http.post<void>(
			`${environment.apiBaseUrl}/api/TblOrder/CreateTblOrderHeaderAndDetail`,
			payload
		);
	}

	//GET
	getTblOrderById(id: number): Observable<TblOrder> {
		return this.http.get<TblOrder>(`${environment.apiBaseUrl}/api/TblOrder/GetTblOrderById/${id}`);
	};

	//https://localhost:7082/api/TblOrder/GetPendingOrders?=Customer&FldFKProfileId=2
	//GETPENDINGORDERS
	getTblPendingOrderBys(fldProfileType: string, fldFKProfileId: number): Observable<TblPendingOrderDto[]> {
		const params = new HttpParams()
			.set('FldProfileType', fldProfileType)
			.set('FldFKProfileId', fldFKProfileId.toString());

		return this.http.get<TblPendingOrderDto[]>(`${environment.apiBaseUrl}/api/TblOrder/GetPendingOrders`, { params });
	}

	//UPDATE
	updateTblOrder(tblOrderupdate: TblOrderUpdate): Observable<TblOrder> {
		return this.http.patch<TblOrder>(`${environment.apiBaseUrl}/api/TblOrder/updateTblOrder`, tblOrderupdate);
	};

	//DELETE
	deleteTblOrder(tblOrderdelete: TblOrderUpdate): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblOrder/DeleteTblOrder`,
			{
				body: tblOrderdelete,
				observe: 'response'
			});
	};
}
