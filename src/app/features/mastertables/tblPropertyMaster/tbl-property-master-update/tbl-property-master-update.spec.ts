import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblPropertyMasterUpdate } from './tbl-property-master-update';

describe('TblPropertyMasterUpdate', () => {
  let component: TblPropertyMasterUpdate;
  let fixture: ComponentFixture<TblPropertyMasterUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblPropertyMasterUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblPropertyMasterUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
