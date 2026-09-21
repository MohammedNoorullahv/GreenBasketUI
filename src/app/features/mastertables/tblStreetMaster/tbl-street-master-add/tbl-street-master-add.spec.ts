import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblStreetMasterAdd } from './tbl-street-master-add';

describe('TblStreetMasterAdd', () => {
  let component: TblStreetMasterAdd;
  let fixture: ComponentFixture<TblStreetMasterAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblStreetMasterAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblStreetMasterAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
