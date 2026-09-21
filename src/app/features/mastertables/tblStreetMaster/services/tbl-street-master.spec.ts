import { TestBed } from '@angular/core/testing';

import { TblStreetMaster } from './tbl-street-master';

describe('TblStreetMaster', () => {
  let service: TblStreetMaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblStreetMaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
