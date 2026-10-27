import { TestBed } from '@angular/core/testing';

import { TblFeedback } from './tbl-feedback';

describe('TblFeedback', () => {
  let service: TblFeedback;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblFeedback);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
