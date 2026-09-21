import { TestBed } from '@angular/core/testing';

import { TblItemMaster } from './tbl-item-master';

describe('TblItemMaster', () => {
  let service: TblItemMaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblItemMaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
