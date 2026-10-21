import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblMenuMasterList } from './tbl-menu-master-list';

describe('TblMenuMasterList', () => {
  let component: TblMenuMasterList;
  let fixture: ComponentFixture<TblMenuMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblMenuMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblMenuMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
