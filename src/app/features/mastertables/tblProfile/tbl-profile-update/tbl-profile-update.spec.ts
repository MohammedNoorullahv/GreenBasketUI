import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblProfileUpdate } from './tbl-profile-update';

describe('TblProfileUpdate', () => {
  let component: TblProfileUpdate;
  let fixture: ComponentFixture<TblProfileUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblProfileUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblProfileUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
