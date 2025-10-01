import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Transaction } from '../../models/transaction.model';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-result',
  imports: [CommonModule],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css'
})
export class PaymentResultComponent {
  @Input() transaction!: Transaction;
  @Input() isSuccess: boolean = false;
  @Input() errorMessage: string = '';

  constructor(
    public router: Router,
    public paymentService: PaymentService
  ) {}

  get isApproved(): boolean {
    return this.transaction?.status === 'APPROVED';
  }

  get isDeclined(): boolean {
    return this.transaction?.status === 'DECLINED';
  }

  get isFailed(): boolean {
    return this.transaction?.status === 'FAILED';
  }

  get isPending(): boolean {
    return this.transaction?.status === 'PENDING';
  }

  get statusMessage(): string {
    if (this.isApproved) {
      return 'Pagamento aprovado com sucesso!';
    } else if (this.isDeclined) {
      return 'Pagamento recusado';
    } else if (this.isFailed) {
      return 'Falha no processamento do pagamento';
    } else if (this.isPending) {
      return 'Aguardando confirmação do pagamento';
    }
    return this.errorMessage || 'Status desconhecido';
  }

  get statusIconClass(): string {
    if (this.isApproved) {
      return 'status-icon success';
    } else if (this.isDeclined || this.isFailed) {
      return 'status-icon error';
    } else if (this.isPending) {
      return 'status-icon pending';
    }
    return 'status-icon error';
  }

  returnToStore(): void {
    if (this.transaction?.returnUrl) {
      window.location.href = this.transaction.returnUrl;
    } else {
      this.router.navigate(['/']);
    }
  }

  getPaymentMethodLabel(): string {
    switch (this.transaction?.paymentMethod) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'pix':
        return 'PIX';
      default:
        return 'Método desconhecido';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  tryAgain(): void {
    if (this.transaction?.id) {
      this.router.navigate(['/payment', this.transaction.id]);
    }
  }
}
