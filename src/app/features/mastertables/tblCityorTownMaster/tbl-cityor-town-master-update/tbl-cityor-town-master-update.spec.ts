import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblCityorTownMasterUpdate } from './tbl-cityor-town-master-update';

describe('TblCityorTownMasterUpdate', () => {
  let component: TblCityorTownMasterUpdate;
  let fixture: ComponentFixture<TblCityorTownMasterUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblCityorTownMasterUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblCityorTownMasterUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
