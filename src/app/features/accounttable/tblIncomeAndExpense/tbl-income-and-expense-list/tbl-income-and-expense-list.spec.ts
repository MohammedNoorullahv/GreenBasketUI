import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblIncomeAndExpenseList } from './tbl-income-and-expense-list';

describe('TblIncomeAndExpenseList', () => {
  let component: TblIncomeAndExpenseList;
  let fixture: ComponentFixture<TblIncomeAndExpenseList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblIncomeAndExpenseList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblIncomeAndExpenseList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
