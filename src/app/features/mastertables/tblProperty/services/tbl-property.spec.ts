import { TestBed } from '@angular/core/testing';

import { TblProperty } from './tbl-property';

describe('TblProperty', () => {
  let service: TblProperty;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TblProperty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
