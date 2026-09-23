import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblOrderDetailAdd } from './tbl-order-detail-add';

describe('TblOrderDetailAdd', () => {
  let component: TblOrderDetailAdd;
  let fixture: ComponentFixture<TblOrderDetailAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblOrderDetailAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblOrderDetailAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
