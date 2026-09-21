import { TestBed } from '@angular/core/testing';

import { TblDailyInventory } from './tbl-daily-inventory';

describe('TblDailyInventory', () => {
  let service: TblDailyInventory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblDailyInventory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
