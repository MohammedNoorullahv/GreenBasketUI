import { TestBed } from '@angular/core/testing';

import { TblMenuMaster } from './tbl-menu-master';

describe('TblMenuMaster', () => {
  let service: TblMenuMaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblMenuMaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
