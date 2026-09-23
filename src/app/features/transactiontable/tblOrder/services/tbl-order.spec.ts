import { TestBed } from '@angular/core/testing';

import { TblOrder } from './tbl-order';

describe('TblOrder', () => {
  let service: TblOrder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblOrder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
