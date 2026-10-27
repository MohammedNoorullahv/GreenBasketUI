import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblFeedbackList } from './tbl-feedback-list';

describe('TblFeedbackList', () => {
  let component: TblFeedbackList;
  let fixture: ComponentFixture<TblFeedbackList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblFeedbackList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblFeedbackList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
