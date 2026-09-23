import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblOrderAdd } from './tbl-order-add';

describe('TblOrderAdd', () => {
  let component: TblOrderAdd;
  let fixture: ComponentFixture<TblOrderAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblOrderAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblOrderAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
