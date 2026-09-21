import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblItemMasterList } from './tbl-item-master-list';

describe('TblItemMasterList', () => {
  let component: TblItemMasterList;
  let fixture: ComponentFixture<TblItemMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblItemMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblItemMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
