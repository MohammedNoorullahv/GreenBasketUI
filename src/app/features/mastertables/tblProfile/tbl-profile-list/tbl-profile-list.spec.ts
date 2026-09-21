import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TblProfileList } from './tbl-profile-list';

describe('TblProfileList', () => {
  let component: TblProfileList;
  let fixture: ComponentFixture<TblProfileList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TblProfileList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TblProfileList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
