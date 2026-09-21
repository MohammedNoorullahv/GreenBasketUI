import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblCityorTownMasterAdd } from './tbl-cityor-town-master-add';

describe('TblCityorTownMasterAdd', () => {
  let component: TblCityorTownMasterAdd;
  let fixture: ComponentFixture<TblCityorTownMasterAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblCityorTownMasterAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblCityorTownMasterAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
