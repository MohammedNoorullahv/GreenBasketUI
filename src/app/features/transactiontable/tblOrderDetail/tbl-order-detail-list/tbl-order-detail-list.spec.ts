import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblOrderDetailList } from './tbl-order-detail-list';

describe('TblOrderDetailList', () => {
  let component: TblOrderDetailList;
  let fixture: ComponentFixture<TblOrderDetailList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblOrderDetailList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblOrderDetailList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
