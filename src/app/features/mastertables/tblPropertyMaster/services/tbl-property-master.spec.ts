import { TestBed } from '@angular/core/testing';

import { TblPropertyMaster } from './tbl-property-master';

describe('TblPropertyMaster', () => {
  let service: TblPropertyMaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblPropertyMaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
