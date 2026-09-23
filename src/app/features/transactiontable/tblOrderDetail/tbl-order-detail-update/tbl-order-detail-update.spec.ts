import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblOrderDetailUpdate } from './tbl-order-detail-update';

describe('TblOrderDetailUpdate', () => {
  let component: TblOrderDetailUpdate;
  let fixture: ComponentFixture<TblOrderDetailUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblOrderDetailUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblOrderDetailUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
