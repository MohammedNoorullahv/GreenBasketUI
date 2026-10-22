import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblPropertyList } from './tbl-property-list';

describe('TblPropertyList', () => {
  let component: TblPropertyList;
  let fixture: ComponentFixture<TblPropertyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblPropertyList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblPropertyList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
