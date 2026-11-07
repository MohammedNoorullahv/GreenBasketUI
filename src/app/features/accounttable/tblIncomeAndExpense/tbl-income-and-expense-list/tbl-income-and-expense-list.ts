// Path: src/app/features/accounttable/tblincomeandexpense/tbl-income-and-expense-list/tbl-income-and-expense-list.ts
import { Component, ChangeDetectorRef } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { TblIncomeAndExpense } from '../models/tblIncomeAndExpense.model';
import { TblIncomeAndExpenseService } from '../services/tbl-income-and-expense';
@Component({
  selector: 'app-tbl-income-and-expense-list', standalone: true, imports: [RouterLink, AsyncPipe, DatePipe, DecimalPipe],
  templateUrl: './tbl-income-and-expense-list.html', styleUrl: './tbl-income-and-expense-list.css'
})
export class TblIncomeAndExpenseListComponent {
  tbl$!: Observable<TblIncomeAndExpense[]>;
  actionType: 'Load All' | 'Active Only' = 'Active Only';
  errorMessage = '';
  constructor(private service: TblIncomeAndExpenseService, private cdr: ChangeDetectorRef) { this.OnFormSubmit('Active Only'); }
  OnFormSubmit(action: 'Load All' | 'Active Only'): void {
    this.actionType = action; this.errorMessage = '';
    this.tbl$ = (action === 'Load All' ? this.service.getAllTblIncomeAndExpenses() : this.service.getActiveTblIncomeAndExpenses()).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorMessage = error.status === 0 ? 'Unable to reach the API.' : 'Unable to load records. Please retry.';
        this.cdr.markForCheck(); return of([]);
      })
    );
  }
}
