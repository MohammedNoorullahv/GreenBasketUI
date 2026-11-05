import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblFeatureAdd } from './tbl-feature-add';

describe('TblFeatureAdd', () => {
  let component: TblFeatureAdd;
  let fixture: ComponentFixture<TblFeatureAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblFeatureAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblFeatureAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
