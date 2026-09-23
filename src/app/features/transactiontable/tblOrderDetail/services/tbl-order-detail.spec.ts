import { TestBed } from '@angular/core/testing';

import { TblOrderDetail } from './tbl-order-detail';

describe('TblOrderDetail', () => {
  let service: TblOrderDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblOrderDetail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
