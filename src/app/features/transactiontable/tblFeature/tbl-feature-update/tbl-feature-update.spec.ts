import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblFeatureUpdate } from './tbl-feature-update';

describe('TblFeatureUpdate', () => {
  let component: TblFeatureUpdate;
  let fixture: ComponentFixture<TblFeatureUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblFeatureUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblFeatureUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
