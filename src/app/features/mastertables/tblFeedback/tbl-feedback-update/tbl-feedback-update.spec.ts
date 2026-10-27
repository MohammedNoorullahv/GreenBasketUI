import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblFeedbackUpdate } from './tbl-feedback-update';

describe('TblFeedbackUpdate', () => {
  let component: TblFeedbackUpdate;
  let fixture: ComponentFixture<TblFeedbackUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblFeedbackUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblFeedbackUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
