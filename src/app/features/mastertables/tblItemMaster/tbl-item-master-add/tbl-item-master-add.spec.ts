import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblItemMasterAdd } from './tbl-item-master-add';

describe('TblItemMasterAdd', () => {
  let component: TblItemMasterAdd;
  let fixture: ComponentFixture<TblItemMasterAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblItemMasterAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblItemMasterAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
