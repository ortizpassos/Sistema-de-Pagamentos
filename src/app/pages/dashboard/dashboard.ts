import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { CardService } from '../../services/card.service';
import { FormsModule } from '@angular/forms';
import { SavedCard, SaveCardRequest } from '../../models/user.model';
import { PaymentService } from '../../services/payment.service';
import { Transaction } from '../../models/transaction.model';
import { mapExternalCardReason } from '../../shared/utils/external-reason.util';
import { PaymentInitiateRequest } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  usuario = signal<User | null>(null);
  iniciais = computed(() => {
    const u = this.usuario();
    if (!u) return '';
    const partes = [u.firstName, u.lastName].filter(Boolean).map(p => p.charAt(0).toUpperCase());
    return partes.slice(0,2).join('');
  });

  cartoes = signal<SavedCard[]>([]);
  carregandoCartoes = signal(false);
  mostrarFormularioNovoCartao = signal(false);
  errosCartao = signal<string[]>([]);
  salvandoCartao = signal(false);
  removendoCartaoId = signal<string | null>(null);
  definindoPadraoId = signal<string | null>(null);
  transacoesRecentes = signal<Transaction[]>([]);
  carregandoTransacoes = signal(false);

  novoCartao = signal<SaveCardRequest>({
    cardNumber: '',
    cardHolderName: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    isDefault: false
  });

  constructor(
    private auth: AuthService,
    public router: Router,
    private cardService: CardService,
    public paymentService: PaymentService
  ) {
    this.usuario.set(this.auth.getCurrentUser());
    this.carregarCartoes();
    this.carregarTransacoesRecentes();
  }

  sair(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/auth']);
    });
  }

  abrirFormularioNovoCartao(): void {
    this.mostrarFormularioNovoCartao.set(true);
  }

  editarPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  carregarCartoes(): void {
    this.carregandoCartoes.set(true);
    this.cardService.getUserCards().subscribe({
      next: (resp) => {
        if (resp.success && Array.isArray(resp.data)) {
          this.cartoes.set(resp.data as SavedCard[]);
        } else {
          this.cartoes.set([]);
        }
        this.carregandoCartoes.set(false);
      },
      error: () => {
        this.cartoes.set([]);
        this.carregandoCartoes.set(false);
      }
    });
  }

  formatarNumeroCartaoInput(): void {
    const atual = this.novoCartao();
    const formatado = this.cardService.formatCardNumber(atual.cardNumber);
    this.novoCartao.set({ ...atual, cardNumber: formatado });
  }

  enviarNovoCartao(): void {
    this.errosCartao.set([]);
    const dados = this.novoCartao();
    const validacao = this.cardService.validateCardForSaving(dados);
    if (!validacao.isValid) {
      this.errosCartao.set(validacao.errors);
      return;
    }
    this.salvandoCartao.set(true);
    this.cardService.saveCard({ ...dados }).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          // Sucesso somente se backend validou externamente (backend já bloqueia salvar se inválido)
          this.carregarCartoes();
          this.novoCartao.set({ cardNumber: '', cardHolderName: '', expirationMonth: '', expirationYear: '', cvv: '', isDefault: false });
          this.mostrarFormularioNovoCartao.set(false);
        } else {
          const friendly = mapExternalCardReason(resp.error?.message) || resp.error?.message || 'Falha ao salvar cartão';
            this.errosCartao.set([friendly]);
        }
        this.salvandoCartao.set(false);
      },
      error: (err) => {
        const raw = err.error?.error?.message || err.error?.message || 'Erro inesperado';
        const friendly = mapExternalCardReason(raw) || raw;
        this.errosCartao.set([friendly]);
        this.salvandoCartao.set(false);
      }
    });
  }

  removerCartao(cartao: SavedCard): void {
    if (!confirm('Remover este cartão?')) return;
    this.removendoCartaoId.set(cartao.id);
    this.cardService.deleteCard(cartao.id).subscribe({
      next: () => {
        this.cartoes.set(this.cartoes().filter(c => c.id !== cartao.id));
        this.removendoCartaoId.set(null);
      },
      error: () => {
        this.removendoCartaoId.set(null);
      }
    });
  }

  definirPadrao(cartao: SavedCard): void {
    this.definindoPadraoId.set(cartao.id);
    this.cardService.setDefaultCard(cartao.id).subscribe({
      next: () => {
        this.cartoes.set(this.cartoes().map(c => ({ ...c, isDefault: c.id === cartao.id })));
        this.definindoPadraoId.set(null);
      },
      error: () => {
        this.definindoPadraoId.set(null);
      }
    });
  }

  // ===== Transações Recentes =====
  carregarTransacoesRecentes(limit = 5): void {
    this.carregandoTransacoes.set(true);
    this.paymentService.getRecentTransactions(limit).subscribe({
      next: (resp) => {
        if (resp.success && resp.data?.transactions) {
          this.transacoesRecentes.set(resp.data.transactions as Transaction[]);
        } else {
          this.transacoesRecentes.set([]);
        }
        this.carregandoTransacoes.set(false);
      },
      error: () => {
        this.transacoesRecentes.set([]);
        this.carregandoTransacoes.set(false);
      }
    });
  }

  formatStatus(status: string): string {
    const map: Record<string,string> = {
      'PENDING': 'Pendente',
      'PROCESSING': 'Processando',
      'APPROVED': 'Aprovado',
      'DECLINED': 'Recusado',
      'FAILED': 'Falhou',
      'EXPIRED': 'Expirado'
    };
    return map[status] || status;
  }

  statusClass(status: string): string {
    if (status === 'APPROVED') return 'success';
    if (status === 'PENDING' || status === 'PROCESSING') return 'pending';
    return 'error';
  }

  descricaoTransacao(t: Transaction): string {
    if (t.paymentMethod === 'credit_card') return 'Pagamento Cartão';
    if (t.paymentMethod === 'pix') return 'Pagamento PIX';
    return 'Transação';
  }

  // ===== Ações Rápidas =====
  novoPagamento(): void {
    this.router.navigate(['/novo-pagamento']);
  }

  irParaRelatorios(): void {
    this.router.navigate(['/relatorios']);
  }

  irParaConfiguracoes(): void {
    this.router.navigate(['/configuracoes']);
  }
}
