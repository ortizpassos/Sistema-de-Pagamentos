import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { Transaction, CreditCardPaymentRequest } from '../../models/transaction.model';

interface FormData {
  cardNumber: string;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

interface FormErrors {
  [key: string]: string | null;
}

@Component({
  selector: 'app-credit-card-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-card-form.html',
  styleUrl: './credit-card-form.css'
})
export class CreditCardFormComponent {
  @Input() transaction!: Transaction;
  @Output() success = new EventEmitter<Transaction>();
  @Output() error = new EventEmitter<string>();

  formData: FormData = {
    cardNumber: '',
    cardHolderName: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: ''
  };

  errors: FormErrors = {};
  isLoading = false;
  currentYear = new Date().getFullYear();

  constructor(public paymentService: PaymentService) {}

  onInputChange(field: keyof FormData, value: string): void {
    this.formData[field] = value;
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (this.errors[field]) {
      this.errors = { ...this.errors, [field]: null };
    }

    // Formatação automática do número do cartão
    if (field === 'cardNumber') {
      const formatted = this.paymentService.formatCardNumber(value);
      if (formatted !== value) {
        this.formData.cardNumber = formatted;
      }
    }

    // Conversão para maiúsculas no nome do titular
    if (field === 'cardHolderName') {
      this.formData.cardHolderName = value.toUpperCase();
    }

    // Remover caracteres não numéricos do CVV
    if (field === 'cvv') {
      this.formData.cvv = value.replace(/\D/g, '');
    }
  }

  validateForm(): boolean {
    const newErrors: FormErrors = {};

    // Validar número do cartão
    const cardNumber = this.formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors['cardNumber'] = 'Número do cartão é obrigatório';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors['cardNumber'] = 'Número do cartão deve ter entre 13 e 19 dígitos';
    } else if (!this.paymentService.validateCreditCard(cardNumber)) {
      newErrors['cardNumber'] = 'Número do cartão inválido';
    }

    // Validar nome do titular
    if (!this.formData.cardHolderName.trim()) {
      newErrors['cardHolderName'] = 'Nome do titular é obrigatório';
    }

    // Validar mês de expiração
    const month = parseInt(this.formData.expirationMonth);
    if (!this.formData.expirationMonth || month < 1 || month > 12) {
      newErrors['expirationMonth'] = 'Mês inválido';
    }

    // Validar ano de expiração
    const year = parseInt(this.formData.expirationYear);
    if (!this.formData.expirationYear || year < this.currentYear || year > this.currentYear + 20) {
      newErrors['expirationYear'] = 'Ano inválido';
    }

    // Validar data de expiração
    if (this.formData.expirationMonth && this.formData.expirationYear) {
      if (!this.paymentService.validateExpirationDate(this.formData.expirationMonth, this.formData.expirationYear)) {
        newErrors['expirationDate'] = 'Cartão expirado';
      }
    }

    // Validar CVV
    if (!this.formData.cvv) {
      newErrors['cvv'] = 'CVV é obrigatório';
    } else if (!/^\d{3,4}$/.test(this.formData.cvv)) {
      newErrors['cvv'] = 'CVV deve ter 3 ou 4 dígitos';
    }

    this.errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    const creditCardData: CreditCardPaymentRequest = {
      transactionId: this.transaction.id,
      cardNumber: this.formData.cardNumber.replace(/\s/g, ''),
      cardHolderName: this.formData.cardHolderName,
      expirationMonth: this.formData.expirationMonth.padStart(2, '0'),
      expirationYear: this.formData.expirationYear,
      cvv: this.formData.cvv
    };

    this.paymentService.processCreditCardPayment(creditCardData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.success.emit(response.data);
        } else {
          this.error.emit(response.error?.message || 'Erro ao processar pagamento');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error.emit(error.message || 'Erro ao processar pagamento');
        this.isLoading = false;
      }
    });
  }

  getCardBrand(): string {
    return this.paymentService.getCardBrand(this.formData.cardNumber);
  }
}
