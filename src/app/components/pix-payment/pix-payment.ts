import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { Transaction, PixPaymentRequest } from '../../models/transaction.model';

@Component({
  selector: 'app-pix-payment',
  imports: [CommonModule],
  templateUrl: './pix-payment.html',
  styleUrl: './pix-payment.css'
})
export class PixPaymentComponent implements OnInit, OnDestroy {
  @Input() transaction!: Transaction;
  @Output() success = new EventEmitter<Transaction>();
  @Output() error = new EventEmitter<string>();

  isLoading = false;
  pixData: any = null;
  statusCheckInterval: any;
  timeRemaining = 300; // 5 minutos em segundos
  countdownInterval: any;

  constructor(public paymentService: PaymentService) {}

  ngOnInit(): void {
    this.initializePixPayment();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  initializePixPayment(): void {
    this.isLoading = true;

    const pixRequest: PixPaymentRequest = {
      transactionId: this.transaction.id
    };

    this.paymentService.processPixPayment(pixRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pixData = response.data;
          this.startStatusCheck();
        } else {
          this.error.emit(response.error?.message || 'Erro ao gerar PIX');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error.emit(error.message || 'Erro ao gerar PIX');
        this.isLoading = false;
      }
    });
  }

  startStatusCheck(): void {
    // Verifica o status a cada 5 segundos
    this.statusCheckInterval = setInterval(() => {
      this.checkPixStatus();
    }, 5000);
  }

  checkPixStatus(): void {
    this.paymentService.checkPixStatus(this.transaction.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (response.data.status === 'APPROVED') {
            this.success.emit(response.data);
            this.stopChecking();
          } else if (response.data.status === 'EXPIRED' || response.data.status === 'FAILED') {
            this.error.emit('PIX expirado ou falhou');
            this.stopChecking();
          }
        }
      },
      error: (error) => {
        console.error('Erro ao verificar status do PIX:', error);
      }
    });
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.error.emit('PIX expirado');
        this.stopChecking();
      }
    }, 1000);
  }

  stopChecking(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  copyPixCode(): void {
    if (this.pixData?.pixCode) {
      navigator.clipboard.writeText(this.pixData.pixCode).then(() => {
        // Aqui você poderia mostrar um toast de sucesso
        console.log('Código PIX copiado!');
      });
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getQrCodeImage(): string {
    return this.pixData?.qrCodeImage || this.paymentService.generatePixQrCode(this.pixData?.pixCode || '');
  }
}
