import { TestBed } from '@angular/core/testing';

import { TblProfile } from './tbl-profile';

describe('TblProfile', () => {
  let service: TblProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
