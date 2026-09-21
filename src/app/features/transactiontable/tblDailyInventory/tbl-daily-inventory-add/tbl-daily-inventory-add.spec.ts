import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblDailyInventoryAdd } from './tbl-daily-inventory-add';

describe('TblDailyInventoryAdd', () => {
  let component: TblDailyInventoryAdd;
  let fixture: ComponentFixture<TblDailyInventoryAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblDailyInventoryAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblDailyInventoryAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
