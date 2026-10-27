// Path: src/app/features/mastertables/tblItemMaster/services/tbl-item-master.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TblItemMaster } from '../models/tblItemMaster.model';
import { TblItemMasterAdd } from '../models/tblItemMaster-Add.model';
import { TblItemMasterUpdate } from '../models/tblItemMaster-Update.model';
import { environment } from '../../../../../environments/environment';


@Injectable({
	providedIn: 'root'
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

	//GET - BY ID
	getTblItemMasterById(id: number): Observable<TblItemMaster> {
		return this.http.get<TblItemMaster>(`${environment.apiBaseUrl}/api/TblItemMaster/GetTblItemMasterById/${id}`);
	};

	//POST
	addTblItemMaster(model: TblItemMasterAdd): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/api/TblItemMaster/CreateTblItemMaster`, model);
	};

	//POST - RANGE
	addRangeTblItemMaster(models: TblItemMasterAdd[]): Observable<void> {
		return this.http.post<void>(`${environment.apiBaseUrl}/api/TblItemMaster/CreateRangeTblItemMaster`, models);
	};

	//UPDATE
	updateTblItemMaster(tblItemMasterupdate: TblItemMasterUpdate): Observable<TblItemMaster> {
		return this.http.patch<TblItemMaster>(`${environment.apiBaseUrl}/api/TblItemMaster/UpdateTblItemMaster`, tblItemMasterupdate);
	};

	//UPDATE - RANGE
	updateRangeTblItemMaster(tblItemMasterupdates: TblItemMasterUpdate[]): Observable<TblItemMaster[]> {
		return this.http.patch<TblItemMaster[]>(`${environment.apiBaseUrl}/api/TblItemMaster/UpdateRangeTblItemMaster`, tblItemMasterupdates);
	};

	//DELETE
	deleteTblItemMaster(tblItemMasterdelete: TblItemMasterUpdate): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblItemMaster/DeleteTblItemMaster`,
			{
				body: tblItemMasterdelete,
				observe: 'response'
			});
	};

	//DELETE - RANGE
	deleteRangeTblItemMaster(tblItemMasterdeletes: TblItemMasterUpdate[]): Observable<HttpResponse<any>> {
		return this.http.delete<any>(`${environment.apiBaseUrl}/api/TblItemMaster/DeleteRangeTblItemMaster`,
			{
				body: tblItemMasterdeletes,
				observe: 'response'
			});
	};

	//UPLOAD IMAGE (screen needs it; stores the file on the server and returns its relative path)
	uploadTblItemMasterImage(file: File): Observable<{ path: string }> {
		const formData = new FormData();
		formData.append('file', file);
		return this.http.post<{ path: string }>(`${environment.apiBaseUrl}/api/TblItemMaster/UploadTblItemMasterImage`, formData);
	};

	// Builds the public URL of a stored image path (apiBaseUrl ends with /api, the files are served from the site root)
	getItemImageUrl(path?: string | null): string {
		if (!path) {
			return '';
		}
		if (/^https?:\/\//i.test(path)) {
			return path;
		}
		const siteRoot = String(environment.apiBaseUrl).replace(/\/api\/?$/i, '');
		return `${siteRoot}/${path.replace(/^\/+/, '')}`;
	};
}
