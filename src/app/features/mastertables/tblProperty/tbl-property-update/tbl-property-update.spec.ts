import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblPropertyUpdate } from './tbl-property-update';

describe('TblPropertyUpdate', () => {
  let component: TblPropertyUpdate;
  let fixture: ComponentFixture<TblPropertyUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblPropertyUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblPropertyUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
