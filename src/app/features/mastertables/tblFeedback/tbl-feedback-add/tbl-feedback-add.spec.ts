import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblFeedbackAdd } from './tbl-feedback-add';

describe('TblFeedbackAdd', () => {
  let component: TblFeedbackAdd;
  let fixture: ComponentFixture<TblFeedbackAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblFeedbackAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblFeedbackAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
