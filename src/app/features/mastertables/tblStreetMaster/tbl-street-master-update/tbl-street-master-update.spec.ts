import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblStreetMasterUpdate } from './tbl-street-master-update';

describe('TblStreetMasterUpdate', () => {
  let component: TblStreetMasterUpdate;
  let fixture: ComponentFixture<TblStreetMasterUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblStreetMasterUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblStreetMasterUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
