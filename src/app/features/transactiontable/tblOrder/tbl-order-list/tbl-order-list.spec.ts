import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblOrderList } from './tbl-order-list';

describe('TblOrderList', () => {
  let component: TblOrderList;
  let fixture: ComponentFixture<TblOrderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblOrderList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblOrderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
