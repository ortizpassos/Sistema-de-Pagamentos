import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <h1>Relatórios</h1>
      <p>Esta é uma página placeholder para futuros relatórios (transações, cartões, performance).</p>
      <ul>
        <li>Total de transações aprovadas (futuro)</li>
        <li>Distribuição por método de pagamento</li>
        <li>Volume por período</li>
      </ul>
    </div>
  `,
  styleUrl: './reports.css'
})
export class ReportsPage {}
