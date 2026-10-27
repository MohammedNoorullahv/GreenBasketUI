// Path: src/app/features/mastertables/tblFeedback/services/tbl-feedback.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblFeedback } from '../models/tblFeedback.model';
import { TblFeedbackAdd } from '../models/tblFeedback-Add.model';
import { TblFeedbackUpdate } from '../models/tblFeedback-Update.model';
import { environment } from '../../../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class TblFeedbackService {
	constructor(private http: HttpClient) { }

	//GET ALL
	getAllTblFeedbacks(): Observable<TblFeedback[]> {
		return this.http.get<TblFeedback[]>(`${environment.apiBaseUrl}/TblFeedback/GetAllTblFeedbacks`);
	};

	//GET ACTIVE
	getActiveTblFeedbacks(): Observable<TblFeedback[]> {
		return this.http.get<TblFeedback[]>(`${environment.apiBaseUrl}/TblFeedback/GetActiveTblFeedbacks`);
	};

	//GET ACTIVELEAN
	getActiveLeanTblFeedbacks(): Observable<TblFeedback[]> {
		return this.http.get<TblFeedback[]>(`${environment.apiBaseUrl}/TblFeedback/GetActiveLeanTblFeedbacks`);
	};

	//GET - BY ID
	getTblFeedbackById(id: number): Observable<TblFeedback> {
		return this.http.get<TblFeedback>(`${environment.apiBaseUrl}/TblFeedback/GetTblFeedbackById/${id}`);
	};

	//POST
	addTblFeedback(model: TblFeedbackAdd): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/TblFeedback/CreateTblFeedback`, model);
	};

	//POST - RANGE
	addRangeTblFeedback(models: TblFeedbackAdd[]): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/TblFeedback/CreateRangeTblFeedback`, models);
	};

	//UPDATE
	updateTblFeedback(tblFeedbackupdate: TblFeedbackUpdate): Observable<TblFeedback> {
		return this.http.patch<TblFeedback>(`${environment.apiBaseUrl}/TblFeedback/UpdateTblFeedback`, tblFeedbackupdate);
	};

	//UPDATE - RANGE
	updateRangeTblFeedback(tblFeedbackupdates: TblFeedbackUpdate[]): Observable<TblFeedback[]> {
		return this.http.patch<TblFeedback[]>(`${environment.apiBaseUrl}/TblFeedback/UpdateRangeTblFeedback`, tblFeedbackupdates);
	};

	//DELETE
	deleteTblFeedback(tblFeedbackdelete: TblFeedbackUpdate): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/TblFeedback/DeleteTblFeedback`,
			{
				body: tblFeedbackdelete,
				observe: 'response'
			});
	};

	//DELETE - RANGE
	deleteRangeTblFeedback(tblFeedbackdeletes: TblFeedbackUpdate[]): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/TblFeedback/DeleteRangeTblFeedback`,
			{
				body: tblFeedbackdeletes,
				observe: 'response'
			});
	};
}
