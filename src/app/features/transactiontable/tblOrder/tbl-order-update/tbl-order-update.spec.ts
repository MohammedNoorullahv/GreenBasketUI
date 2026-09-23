import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblOrderUpdate } from './tbl-order-update';

describe('TblOrderUpdate', () => {
  let component: TblOrderUpdate;
  let fixture: ComponentFixture<TblOrderUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblOrderUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblOrderUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
