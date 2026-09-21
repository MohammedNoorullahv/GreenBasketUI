import { TestBed } from '@angular/core/testing';

import { TblCityorTownMaster } from './tbl-cityor-town-master';

describe('TblCityorTownMaster', () => {
  let service: TblCityorTownMaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblCityorTownMaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
