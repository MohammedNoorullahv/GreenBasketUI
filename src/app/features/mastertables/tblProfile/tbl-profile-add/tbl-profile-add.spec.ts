import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblProfileAdd } from './tbl-profile-add';

describe('TblProfileAdd', () => {
  let component: TblProfileAdd;
  let fixture: ComponentFixture<TblProfileAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblProfileAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblProfileAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
