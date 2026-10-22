import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblMenuMasterUpdate } from './tbl-menu-master-update';

describe('TblMenuMasterUpdate', () => {
  let component: TblMenuMasterUpdate;
  let fixture: ComponentFixture<TblMenuMasterUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblMenuMasterUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblMenuMasterUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
