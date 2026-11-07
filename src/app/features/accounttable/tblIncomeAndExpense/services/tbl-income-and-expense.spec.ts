import { TestBed } from '@angular/core/testing';

import { TblIncomeAndExpense } from './tbl-income-and-expense';

describe('TblIncomeAndExpense', () => {
  let service: TblIncomeAndExpense;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblIncomeAndExpense);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
