import { Component, Output, EventEmitter, OnDestroy, input } from '@angular/core';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UserRegistration, User } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent implements OnDestroy {
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<void>();
  // Tempo (ms) que a mensagem de sucesso fica visível antes de trocar para login
  redirectDelay = input<number>(1500);

  dadosCadastro: UserRegistration = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    document: ''
  };
  confirmarSenha = '';
  carregando = false;
  sucessoMsg = '';
  mostrarSenha = false;
  mostrarConfirmarSenha = false;
  erros: { [key: string]: string } = {};
  erroGeral = '';
  aceitarTermos = false;
  private redirectTimeoutId: any;

  constructor(
    private authService: AuthService
  ) {}

  onSubmit(): void {
    if (!this.validarFormulario()) {
      return;
    }
    this.carregando = true;
    this.erroGeral = '';
    console.log('[Register] Enviando requisição de registro', this.dadosCadastro.email);
    this.authService.register(this.dadosCadastro)
      .pipe(
        finalize(() => {
          // Garantir reset sempre
          this.carregando = false;
          console.log('[Register] finalize chamado, carregando=false');
        })
      )
      .subscribe({
      next: (response) => {
        console.log('[Register] Resposta recebida', response);
        if (response.success && response.data?.user) {
          // Feedback rápido e redireciona para login em seguida
          this.sucessoMsg = 'Conta criada com sucesso! Faça login para continuar.';
          this.registerSuccess.emit();
          // Limpa formulário
          this.dadosCadastro = { email: '', password: '', firstName: '', lastName: '', phone: '', document: '' };
          this.confirmarSenha = '';
          // Delay curto para o usuário ver a mensagem
          this.redirectTimeoutId = setTimeout(() => {
            this.switchToLogin.emit();
          }, this.redirectDelay());
        } else {
          this.erroGeral = response.error?.message || 'Erro ao criar conta';
        }
      },
      error: (error) => {
        console.error('[Register] Erro na requisição', error);
        this.erroGeral = error.error?.message || 'Erro ao conectar com o servidor';
      }
    });
  }

  validarFormulario(): boolean {
    this.erros = {};
    let isValid = true;

    // Validar nome
    if (!this.dadosCadastro.firstName.trim()) {
      this.erros['firstName'] = 'Nome é obrigatório';
      isValid = false;
    }

    // Validar sobrenome
    if (!this.dadosCadastro.lastName.trim()) {
      this.erros['lastName'] = 'Sobrenome é obrigatório';
      isValid = false;
    }

    // Validar email
    if (!this.dadosCadastro.email) {
      this.erros['email'] = 'Email é obrigatório';
      isValid = false;
    } else if (!this.authService.isEmailValid(this.dadosCadastro.email)) {
      this.erros['email'] = 'Email inválido';
      isValid = false;
    }

    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (this.dadosCadastro.phone && this.dadosCadastro.phone.replace(/\D/g, '').length < 10) {
      this.erros['phone'] = 'Telefone inválido';
      isValid = false;
    }

    // Validar documento (opcional, mas se preenchido deve ser válido)
    if (this.dadosCadastro.document && !this.authService.validateDocument(this.dadosCadastro.document)) {
      this.erros['document'] = 'CPF inválido';
      isValid = false;
    }

    // Validar senha
    if (!this.dadosCadastro.password) {
      this.erros['password'] = 'Senha é obrigatória';
      isValid = false;
    } else if (!this.authService.isPasswordStrong(this.dadosCadastro.password)) {
      this.erros['password'] = 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo';
      isValid = false;
    }

    // Validar confirmação de senha
    if (!this.confirmarSenha) {
      this.erros['confirmPassword'] = 'Confirmação de senha é obrigatória';
      isValid = false;
    } else if (this.confirmarSenha !== this.dadosCadastro.password) {
      this.erros['confirmPassword'] = 'Senhas não coincidem';
      isValid = false;
    }

    // Validar termos
    if (!this.aceitarTermos) {
      this.erros['terms'] = 'Você deve aceitar os termos de uso';
      isValid = false;
    }

    return isValid;
  }

  onInputChange(field: string): void {
    if (this.erros[field]) {
      delete this.erros[field];
    }
    if (this.erroGeral) {
      this.erroGeral = '';
    }

    // Formatação automática de telefone
    if (field === 'phone' && this.dadosCadastro.phone) {
      this.dadosCadastro.phone = this.formatPhone(this.dadosCadastro.phone);
    }

    // Formatação automática de CPF
    if (field === 'document' && this.dadosCadastro.document) {
      this.dadosCadastro.document = this.formatCPF(this.dadosCadastro.document);
    }
  }

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  }

  formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  }

  togglePasswordVisibility(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleConfirmPasswordVisibility(): void {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }

  getPasswordStrength(): string {
    const password = this.dadosCadastro.password;
    if (!password) return '';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (score < 3) return 'weak';
    if (score < 4) return 'medium';
    return 'strong';
  }

  ngOnDestroy(): void {
    if (this.redirectTimeoutId) {
      clearTimeout(this.redirectTimeoutId);
    }
  }
}
