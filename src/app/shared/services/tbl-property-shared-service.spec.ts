import { TestBed } from '@angular/core/testing';

import { TblPropertySharedService } from './tbl-property-shared-service';

describe('TblPropertySharedService', () => {
  let service: TblPropertySharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblPropertySharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
