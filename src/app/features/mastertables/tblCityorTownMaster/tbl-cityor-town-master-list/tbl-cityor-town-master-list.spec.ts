import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblCityorTownMasterList } from './tbl-cityor-town-master-list';

describe('TblCityorTownMasterList', () => {
  let component: TblCityorTownMasterList;
  let fixture: ComponentFixture<TblCityorTownMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblCityorTownMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblCityorTownMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
