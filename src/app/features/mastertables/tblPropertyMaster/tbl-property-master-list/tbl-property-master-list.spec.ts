import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblPropertyMasterList } from './tbl-property-master-list';

describe('TblPropertyMasterList', () => {
  let component: TblPropertyMasterList;
  let fixture: ComponentFixture<TblPropertyMasterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblPropertyMasterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblPropertyMasterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
