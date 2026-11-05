import { TestBed } from '@angular/core/testing';

import { TblFeature } from './tbl-feature';

describe('TblFeature', () => {
  let service: TblFeature;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblFeature);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
