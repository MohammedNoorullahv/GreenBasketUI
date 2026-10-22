import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblMenuMasterAdd } from './tbl-menu-master-add';

describe('TblMenuMasterAdd', () => {
  let component: TblMenuMasterAdd;
  let fixture: ComponentFixture<TblMenuMasterAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblMenuMasterAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblMenuMasterAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
