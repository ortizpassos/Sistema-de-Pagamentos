import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixPayment } from './pix-payment';

describe('PixPayment', () => {
  let component: PixPayment;
  let fixture: ComponentFixture<PixPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PixPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PixPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
