import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { Transaction } from '../../models/transaction.model';
import { CreditCardFormComponent } from '../../components/credit-card-form/credit-card-form';
import { PixPaymentComponent } from '../../components/pix-payment/pix-payment';
import { PaymentResultComponent } from '../../components/payment-result/payment-result';

@Component({
  selector: 'app-payment',
  imports: [
    CommonModule, 
    CreditCardFormComponent, 
    PixPaymentComponent, 
    PaymentResultComponent
  ],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent implements OnInit {
  transaction: Transaction | null = null;
  isLoading = true;
  error: string = '';
  showResult = false;
  paymentResult: Transaction | null = null;
  resultError: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    const transactionId = this.route.snapshot.paramMap.get('transactionId');
    if (transactionId) {
      this.loadTransaction(transactionId);
    } else {
      this.error = 'ID da transação não encontrado';
      this.isLoading = false;
    }
  }

  loadTransaction(transactionId: string): void {
    this.paymentService.getTransaction(transactionId).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.isLoading = false;
        
        // Se a transação já foi processada, mostrar resultado
        if (transaction.status !== 'PENDING') {
          this.showResult = true;
          this.paymentResult = transaction;
        }
      },
      error: (error) => {
        this.error = error.message || 'Erro ao carregar transação';
        this.isLoading = false;
      }
    });
  }

  onPaymentSuccess(result: Transaction): void {
    this.paymentResult = result;
    this.showResult = true;
  }

  onPaymentError(error: string): void {
    this.resultError = error;
    this.showResult = true;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  selectPaymentMethod(method: 'credit_card' | 'pix'): void {
    if (this.transaction && this.transaction.paymentMethod !== method) {
      // Aqui você poderia implementar a mudança do método de pagamento
      // Por enquanto, apenas recarregamos a página
      window.location.reload();
    }
  }
}
