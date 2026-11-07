// Path: src/app/features/accounttable/tblincomeandexpense/services/tbl-income-and-expense.ts
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TblIncomeAndExpense } from '../models/tblIncomeAndExpense.model';
import { TblIncomeAndExpenseAdd } from '../models/tblIncomeAndExpense-Add.model';
import { TblIncomeAndExpenseUpdate } from '../models/tblIncomeAndExpense-Update.model';
import { environment } from '../../../../../environments/environment';

type IncomeExpenseWire = Omit<TblIncomeAndExpense, 'fldCreatedDt' | 'fldModifiedDt' | 'fldDeletedDt'> & {
  fldCreatedDt: string | null; fldModifiedDt: string | null; fldDeletedDt: string | null;
};

@Injectable({ providedIn: 'root' })
export class TblIncomeAndExpenseService {
  private readonly base = `${environment.apiBaseUrl.replace(/\/+$/, '').replace(/\/api$/i, '')}/api/TblIncomeAndExpense`;
  constructor(private http: HttpClient) {}
  private fromWire(row: IncomeExpenseWire): TblIncomeAndExpense {
    return { ...row,
      fldCreatedDt: row.fldCreatedDt ? new Date(row.fldCreatedDt) : null,
      fldModifiedDt: row.fldModifiedDt ? new Date(row.fldModifiedDt) : null,
      fldDeletedDt: row.fldDeletedDt ? new Date(row.fldDeletedDt) : null
    };
  }
  getAllTblIncomeAndExpenses(): Observable<TblIncomeAndExpense[]> { return this.http.get<IncomeExpenseWire[]>(`${this.base}/GetAllTblIncomeAndExpenses`).pipe(map(rows => rows.map(row => this.fromWire(row)))); }
  getActiveTblIncomeAndExpenses(): Observable<TblIncomeAndExpense[]> { return this.http.get<IncomeExpenseWire[]>(`${this.base}/GetActiveTblIncomeAndExpenses`).pipe(map(rows => rows.map(row => this.fromWire(row)))); }
  getActiveLeanTblIncomeAndExpenses(): Observable<TblIncomeAndExpense[]> { return this.http.get<IncomeExpenseWire[]>(`${this.base}/GetActiveLeanTblIncomeAndExpenses`).pipe(map(rows => rows.map(row => this.fromWire(row)))); }
  getTblIncomeAndExpenseById(id: number): Observable<TblIncomeAndExpense> { return this.http.get<IncomeExpenseWire>(`${this.base}/GetTblIncomeAndExpenseById/${id}`).pipe(map(row => this.fromWire(row))); }
  createTblIncomeAndExpense(model: TblIncomeAndExpenseAdd): Observable<TblIncomeAndExpense> {
    return this.http.post<IncomeExpenseWire>(`${this.base}/CreateTblIncomeAndExpense`, model).pipe(map(row => this.fromWire(row)));
  }
  createRangeTblIncomeAndExpense(model: TblIncomeAndExpenseAdd[]): Observable<TblIncomeAndExpense[]> {
    return this.http.post<IncomeExpenseWire[]>(`${this.base}/CreateRangeTblIncomeAndExpense`, model).pipe(map(rows => rows.map(row => this.fromWire(row))));
  }
  updateTblIncomeAndExpense(model: TblIncomeAndExpenseUpdate): Observable<TblIncomeAndExpense> {
    return this.http.patch<IncomeExpenseWire>(`${this.base}/UpdateTblIncomeAndExpense`, model).pipe(map(row => this.fromWire(row)));
  }
  updateRangeTblIncomeAndExpense(model: TblIncomeAndExpenseUpdate[]): Observable<TblIncomeAndExpense[]> {
    return this.http.patch<IncomeExpenseWire[]>(`${this.base}/UpdateRangeTblIncomeAndExpense`, model).pipe(map(rows => rows.map(row => this.fromWire(row))));
  }
  deleteTblIncomeAndExpense(model: TblIncomeAndExpenseUpdate): Observable<HttpResponse<{ message: string }>> {
    return this.http.delete<{ message: string }>(`${this.base}/DeleteTblIncomeAndExpense`, { body: model, observe: 'response' });
  }
  deleteRangeTblIncomeAndExpense(model: TblIncomeAndExpenseUpdate[]): Observable<HttpResponse<{ message: string }>> {
    return this.http.delete<{ message: string }>(`${this.base}/DeleteRangeTblIncomeAndExpense`, { body: model, observe: 'response' });
  }
}
