import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblDailyInventoryList } from './tbl-daily-inventory-list';

describe('TblDailyInventoryList', () => {
  let component: TblDailyInventoryList;
  let fixture: ComponentFixture<TblDailyInventoryList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblDailyInventoryList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblDailyInventoryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
