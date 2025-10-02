import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { CardService } from '../../services/card.service';
import { FormsModule } from '@angular/forms';
import { SavedCard, SaveCardRequest } from '../../models/user.model';
import { PaymentService } from '../../services/payment.service';
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
    private router: Router,
    private cardService: CardService,
    private paymentService: PaymentService
  ) {
    this.usuario.set(this.auth.getCurrentUser());
    this.carregarCartoes();
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
    // Placeholder para futura edição de perfil
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
          this.carregarCartoes();
          this.novoCartao.set({ cardNumber: '', cardHolderName: '', expirationMonth: '', expirationYear: '', cvv: '', isDefault: false });
          this.mostrarFormularioNovoCartao.set(false);
        } else {
          this.errosCartao.set([resp.error?.message || 'Falha ao salvar cartão']);
        }
        this.salvandoCartao.set(false);
      },
      error: (err) => {
        this.errosCartao.set([err.error?.error?.message || err.error?.message || 'Erro inesperado']);
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
