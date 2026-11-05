import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblFeatureList } from './tbl-feature-list';

describe('TblFeatureList', () => {
  let component: TblFeatureList;
  let fixture: ComponentFixture<TblFeatureList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblFeatureList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblFeatureList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
