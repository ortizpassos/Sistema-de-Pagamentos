import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditCardForm } from './credit-card-form';

describe('CreditCardForm', () => {
  let component: CreditCardForm;
  let fixture: ComponentFixture<CreditCardForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditCardForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditCardForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
