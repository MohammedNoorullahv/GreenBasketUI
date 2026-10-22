import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblPropertyAdd } from './tbl-property-add';

describe('TblPropertyAdd', () => {
  let component: TblPropertyAdd;
  let fixture: ComponentFixture<TblPropertyAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblPropertyAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblPropertyAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
