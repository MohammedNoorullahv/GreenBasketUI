// Path: src/app/features/transactiontables/tblFeature/services/tbl-feature.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblFeature } from '../models/tblFeature.model';
import { TblFeatureAdd } from '../models/tblFeature-Add.model';
import { TblFeatureUpdate } from '../models/tblFeature-Update.model';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
	providedIn: 'root'
})
export class TblFeatureService {
	constructor(private http: HttpClient) { }

	// GET ALL
	getAllTblFeatures(): Observable<TblFeature[]> {
		return this.http.get<TblFeature[]>(`${environment.apiBaseUrl}/api/TblFeature/GetAllTblFeatures`);
	};

	//GET ACTIVE
	getActiveTblFeatures(): Observable<TblFeature[]> {
		return this.http.get<TblFeature[]>(`${environment.apiBaseUrl}/api/TblFeature/GetActiveTblFeatures`);
	};

	//GET ACTIVELEAN
	getActiveLeanTblFeatures(): Observable<TblFeature[]> {
		return this.http.get<TblFeature[]>(`${environment.apiBaseUrl}/api/TblFeature/GetActiveLeanTblFeatures`);
	};

	//GET - BY ID
	getTblFeatureById(id: number): Observable<TblFeature> {
		return this.http.get<TblFeature>(`${environment.apiBaseUrl}/api/TblFeature/GetTblFeatureById/${id}`);
	};

	//POST
	addTblFeature(model: TblFeatureAdd): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/api/TblFeature/CreateTblFeature`, model);
	};

	//POST - RANGE
	addRangeTblFeature(models: TblFeatureAdd[]): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/api/TblFeature/CreateRangeTblFeature`, models);
	};

	//UPDATE
	updateTblFeature(tblFeatureupdate: TblFeatureUpdate): Observable<TblFeature> {
		return this.http.patch<TblFeature>(`${environment.apiBaseUrl}/api/TblFeature/UpdateTblFeature`, tblFeatureupdate);
	};

	//UPDATE - RANGE
	updateRangeTblFeature(tblFeatureupdates: TblFeatureUpdate[]): Observable<TblFeature[]> {
		return this.http.patch<TblFeature[]>(`${environment.apiBaseUrl}/api/TblFeature/UpdateRangeTblFeature`, tblFeatureupdates);
	};

	//DELETE
	deleteTblFeature(tblFeaturedelete: TblFeatureUpdate): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblFeature/DeleteTblFeature`,
			{
				body: tblFeaturedelete,
				observe: 'response'
			});
	};

	//DELETE - RANGE
	deleteRangeTblFeature(tblFeaturedeletes: TblFeatureUpdate[]): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblFeature/DeleteRangeTblFeature`,
			{
				body: tblFeaturedeletes,
				observe: 'response'
			});
	};
}
