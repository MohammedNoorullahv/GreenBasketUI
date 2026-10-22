import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblPropertyMasterAdd } from './tbl-property-master-add';

describe('TblPropertyMasterAdd', () => {
  let component: TblPropertyMasterAdd;
  let fixture: ComponentFixture<TblPropertyMasterAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblPropertyMasterAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblPropertyMasterAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
