import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {TblCityorTownMaster } from '../models/tblCityorTownMaster.model';
import {TblCityorTownMasterAdd } from '../models/tblCityorTownMaster-Add.model';
import {TblCityorTownMasterUpdate } from '../models/tblCityorTownMaster-Update.model';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})

export class TblCityorTownMasterService {
constructor(private http: HttpClient) { }

//GET ALL
getAllTblCityorTownMasters(): Observable<TblCityorTownMaster[]>{
	return this.http.get<TblCityorTownMaster[]>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/GetAllTblCityorTownMasters`);
};

//GET ACTIVE
getActiveTblCityorTownMasters(): Observable<TblCityorTownMaster[]>{
	return this.http.get<TblCityorTownMaster[]>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/GetActiveTblCityorTownMasters`);
};

//GET ACTIVELEAN
getActiveLeanTblCityorTownMasters(): Observable<TblCityorTownMaster[]>{
	return this.http.get<TblCityorTownMaster[]>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/GetActiveLeanTblCityorTownMasters`);
};

//POST
addTblCityorTownMaster(model: TblCityorTownMasterAdd): Observable<void>{
	return this.http.post<void>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/CreateTblCityorTownMaster`, model);
};

//GET
getTblCityorTownMasterById(id: number): Observable<TblCityorTownMaster>{
	return this.http.get<TblCityorTownMaster>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/GetTblCityorTownMasterById/${id}`);
};

//UPDATE
updateTblCityorTownMaster(tblCityorTownMasterupdate: TblCityorTownMasterUpdate): Observable<TblCityorTownMaster>{
	return this.http.patch<TblCityorTownMaster>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/updateTblCityorTownMaster` ,tblCityorTownMasterupdate);
};

//DELETE
deleteTblCityorTownMaster(tblCityorTownMasterdelete: TblCityorTownMasterUpdate): Observable<HttpResponse<any>>{
	return this.http.delete<any>(`${ environment.apiBaseUrl}/api/TblCityorTownMaster/DeleteTblCityorTownMaster` ,
		{
			body: tblCityorTownMasterdelete,
			observe: 'response'
		});
};
}
