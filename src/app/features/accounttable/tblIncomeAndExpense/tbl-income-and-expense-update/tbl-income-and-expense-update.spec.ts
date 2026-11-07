import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblIncomeAndExpenseUpdate } from './tbl-income-and-expense-update';

describe('TblIncomeAndExpenseUpdate', () => {
  let component: TblIncomeAndExpenseUpdate;
  let fixture: ComponentFixture<TblIncomeAndExpenseUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblIncomeAndExpenseUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblIncomeAndExpenseUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
