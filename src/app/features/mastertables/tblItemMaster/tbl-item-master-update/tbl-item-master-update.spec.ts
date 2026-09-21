import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblItemMasterUpdate } from './tbl-item-master-update';

describe('TblItemMasterUpdate', () => {
  let component: TblItemMasterUpdate;
  let fixture: ComponentFixture<TblItemMasterUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblItemMasterUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblItemMasterUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
