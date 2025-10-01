import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
  
  constructor(private router: Router) {}

  openDemoStore(): void {
    window.open('http://localhost:3001', '_blank');
  }

  openAuth(): void {
    this.router.navigate(['/auth']);
  }

  navigateToPayment(transactionId: string): void {
    this.router.navigate(['/payment', transactionId]);
  }
}
