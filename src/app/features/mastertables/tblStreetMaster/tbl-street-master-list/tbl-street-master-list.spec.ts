import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblStreetMasterList } from './tbl-street-master-list';

describe('TblStreetMasterList', () => {
  let component: TblStreetMasterList;
  let fixture: ComponentFixture<TblStreetMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblStreetMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblStreetMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
