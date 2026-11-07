import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblIncomeAndExpenseAdd } from './tbl-income-and-expense-add';

describe('TblIncomeAndExpenseAdd', () => {
  let component: TblIncomeAndExpenseAdd;
  let fixture: ComponentFixture<TblIncomeAndExpenseAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblIncomeAndExpenseAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblIncomeAndExpenseAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
