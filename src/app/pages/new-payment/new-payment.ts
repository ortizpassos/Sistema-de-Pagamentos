import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PaymentInitiateRequest, PaymentMethod, Transaction } from '../../models/transaction.model';
import { AuthService } from '../../services/auth.service';
import { UserService, UserOption } from '../../services/user.service';

@Component({
  selector: 'app-new-payment',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="new-payment-container">
      <h1>Novo Pagamento</h1>
      <form (ngSubmit)="iniciarPagamento()" class="payment-form">
        <div class="field-group">
          <label>Valor (BRL)</label>
          <input type="number" step="0.01" min="0.01" [(ngModel)]="valor" name="valor" required />
        </div>
        <div class="field-group">
          <label>Método de Pagamento</label>
          <select [(ngModel)]="metodo" name="metodo" required>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="pix">PIX</option>
          </select>
        </div>
        <div class="field-group">
          <label>Destinatário</label>
          <div class="recipient-options">
            <label><input type="radio" name="destinatarioTipo" value="none" [(ngModel)]="tipoDestinatario" /> Sem destinatário específico</label>
            <label><input type="radio" name="destinatarioTipo" value="user" [(ngModel)]="tipoDestinatario" /> Usuário</label>
            <label><input type="radio" name="destinatarioTipo" value="pix" [(ngModel)]="tipoDestinatario" /> Chave PIX</label>
          </div>
          @if (tipoDestinatario==='user') {
            <div class="sub-field recipient-user">
              <input type="text" [(ngModel)]="userSearch" name="userSearch" placeholder="Buscar nome ou email" (input)="onUserSearchChange()" autocomplete="off" />
              @if (userSearch && !userLookupLoading()) {
                <button type="button" class="inline-btn" (click)="clearUserSearch()">×</button>
              }
              @if (userLookupLoading()) {<div class="mini-loading">Carregando...</div>}
              @if (userSearch && !userLookupLoading() && userOptions().length===0) {<div class="no-results">Nenhum usuário encontrado</div>}
              @if (userOptions().length>0) {
                <ul class="options">
                  @for (u of userOptions(); track u.id) {
                    <li (click)="selectUser(u)" [class.selected]="recipientUserId===u.id">
                      <div class="name">{{ u.name }}</div>
                      <div class="email">{{ u.email }}</div>
                    </li>
                  }
                </ul>
              }
              <div class="lookup-email">
                <label>Email direto:</label>
                <div class="email-row">
                  <input type="email" [(ngModel)]="emailLookup" name="emailLookup" placeholder="email@dominio.com" />
                  <button type="button" (click)="buscarPorEmail()" [disabled]="emailLookupLoading() || !emailLookup">Buscar</button>
                </div>
                @if (emailLookupLoading()) {<div class="mini-loading">Verificando...</div>}
                @if (emailLookupResult()) {
                  <div class="email-result">
                    <span>{{ emailLookupResult()?.name }} ({{ emailLookupResult()?.email }})</span>
                    <button type="button" (click)="usarEmailLookup()">Usar</button>
                  </div>
                }
                @if (emailLookupError()) {<div class="erro-inline">{{ emailLookupError() }}</div>}
              </div>
              @if (recipientUserId) {<div class="selecionado">Selecionado: {{ selectedUserLabel() }}</div>}
            </div>
          }
          @if (tipoDestinatario==='pix') {
            <div class="sub-field">
              <input type="text" [(ngModel)]="recipientPixKey" name="recipientPixKey" placeholder="Chave PIX (email/telefone)" />
            </div>
          }
        </div>
        @if (metodo==='credit_card') {
        <div class="field-group">
          <label>Parcelas</label>
          <select [(ngModel)]="parcelas" name="parcelas">
            <option *ngFor="let p of opcoesParcelas" [value]="p">{{ p === 1 ? 'À vista (sem juros)' : p + 'x (3% a.m.)' }}</option>
          </select>
          @if (resumoParcelas(); as r) {
            <div class="parcelas-resumo">
              @if (r.mode==='AVISTA') {<p>Valor final: {{ valorFormatado() }}</p>}
              @if (r.mode==='PARCELADO') {<p>{{ r.quantity }}x de {{ formatarMoeda(r.installmentValue) }} (Total {{ formatarMoeda(r.totalWithInterest) }})</p>}
            </div>
          }
        </div>
        }
        <div class="acoes">
          <button type="submit" class="btn-primary" [disabled]="carregando()">{{ carregando() ? 'Processando...' : 'Iniciar Pagamento' }}</button>
          <button type="button" class="btn-secondary" (click)="voltar()" [disabled]="carregando()">Cancelar</button>
        </div>
        @if (erro()) {<div class="erros">{{ erro() }}</div>}
      </form>
    </div>
  `,
  styleUrl: './new-payment.css'
})
export class NewPaymentPage {
  valor = 100.00;
  metodo: PaymentMethod = 'credit_card';
  parcelas = 1;
  opcoesParcelas = [1,2,3,4,5,6,9,12];
  tipoDestinatario: 'none' | 'user' | 'pix' = 'none';
  recipientUserId = '';
  recipientPixKey = '';
  // User search state
  userSearch = '';
  private userSearchDebounce?: any;
  userOptions = signal<UserOption[]>([]);
  userLookupLoading = signal(false);
  emailLookup = '';
  emailLookupLoading = signal(false);
  emailLookupResult = signal<UserOption | null>(null);
  emailLookupError = signal('');

  carregando = signal(false);
  erro = signal('');

  constructor(private payment: PaymentService, private router: Router, private auth: AuthService, private users: UserService) {}

  resumoParcelas = computed(() => {
    if (this.metodo !== 'credit_card') return null;
    const amount = this.valor;
    if (this.parcelas === 1) {
      return { quantity: 1, totalWithInterest: amount, installmentValue: amount, mode: 'AVISTA' };
    }
    const interest = 0.03;
    const total = parseFloat((amount * Math.pow(1 + interest, this.parcelas)).toFixed(2));
    const each = parseFloat((total / this.parcelas).toFixed(2));
    return { quantity: this.parcelas, totalWithInterest: total, installmentValue: each, mode: 'PARCELADO' };
  });

  formatarMoeda(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  valorFormatado(): string { return this.formatarMoeda(this.valor); }

  iniciarPagamento(): void {
    this.erro.set('');
    if (!this.valor || this.valor <= 0) {
      this.erro.set('Informe um valor válido.');
      return;
    }
    if (this.tipoDestinatario === 'user' && !this.recipientUserId) {
      this.erro.set('Selecione ou busque um usuário destinatário.');
      return;
    }
    if (this.tipoDestinatario === 'pix' && !this.recipientPixKey) {
      this.erro.set('Informe a chave PIX do destinatário.');
      return;
    }

    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/auth']);
      return;
    }

    const req: PaymentInitiateRequest = {
      orderId: 'NP-' + Date.now(),
      amount: this.valor,
      currency: 'BRL',
      paymentMethod: this.metodo,
      customer: {
        name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        email: currentUser.email,
        document: currentUser.document
      },
      returnUrl: window.location.origin + '/dashboard',
      callbackUrl: window.location.origin + '/api/callback/mock'
    };

    if (this.tipoDestinatario === 'user') {
      req.recipientUserId = this.recipientUserId;
    } else if (this.tipoDestinatario === 'pix') {
      req.recipientPixKey = this.recipientPixKey;
    }

    if (this.metodo === 'credit_card') {
      req.installments = { quantity: this.parcelas };
    }

    this.carregando.set(true);
    this.payment.initiatePayment(req).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const transacao = resp.data as Transaction;
          this.router.navigate(['/payment', transacao.id]);
        } else {
          this.erro.set(resp.error?.message || 'Falha ao iniciar pagamento');
        }
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.error?.message || err.error?.message || 'Erro inesperado');
        this.carregando.set(false);
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/dashboard']);
  }

  onUserSearchChange(): void {
    this.emailLookupResult.set(null);
    this.emailLookupError.set('');
    if (this.userSearchDebounce) clearTimeout(this.userSearchDebounce);
    const term = this.userSearch.trim();
    if (!term) {
      this.userOptions.set([]);
      return;
    }
    this.userLookupLoading.set(true);
    this.userSearchDebounce = setTimeout(() => {
      this.users.search(term).subscribe({
        next: list => {
          this.userOptions.set(list);
          this.userLookupLoading.set(false);
        },
        error: () => {
          this.userOptions.set([]);
          this.userLookupLoading.set(false);
        }
      });
    }, 300);
  }

  selectUser(u: UserOption): void {
    this.recipientUserId = u.id;
    this.emailLookupResult.set(null);
  }

  clearUserSearch(): void {
    this.userSearch = '';
    this.userOptions.set([]);
    if (this.recipientUserId) this.recipientUserId = '';
  }

  buscarPorEmail(): void {
    this.emailLookupError.set('');
    this.emailLookupResult.set(null);
    const email = this.emailLookup.trim();
    if (!email) return;
    this.emailLookupLoading.set(true);
    this.users.lookupByEmail(email).subscribe({
      next: result => {
        if (!result) {
          this.emailLookupError.set('Usuário não encontrado.');
        } else {
          this.emailLookupResult.set(result);
        }
        this.emailLookupLoading.set(false);
      },
      error: () => {
        this.emailLookupError.set('Erro na busca');
        this.emailLookupLoading.set(false);
      }
    });
  }

  usarEmailLookup(): void {
    const r = this.emailLookupResult();
    if (r) {
      this.recipientUserId = r.id;
      this.userSearch = r.name || r.email;
      this.userOptions.set([r]);
    }
  }

  selectedUserLabel(): string {
    const found = this.userOptions().find(o => o.id === this.recipientUserId) || this.emailLookupResult();
    return found ? `${found.name} (${found.email})` : this.recipientUserId;
  }
}
