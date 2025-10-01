import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserRegistration } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<void>();

  registerData: UserRegistration = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    document: ''
  };

  confirmPassword = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errors: { [key: string]: string } = {};
  generalError = '';
  acceptTerms = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.generalError = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        if (response.success) {
          this.registerSuccess.emit();
          this.router.navigate(['/dashboard']);
        } else {
          this.generalError = response.error?.message || 'Erro ao criar conta';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.generalError = error.error?.message || 'Erro ao conectar com o servidor';
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Validar nome
    if (!this.registerData.firstName.trim()) {
      this.errors['firstName'] = 'Nome é obrigatório';
      isValid = false;
    }

    // Validar sobrenome
    if (!this.registerData.lastName.trim()) {
      this.errors['lastName'] = 'Sobrenome é obrigatório';
      isValid = false;
    }

    // Validar email
    if (!this.registerData.email) {
      this.errors['email'] = 'Email é obrigatório';
      isValid = false;
    } else if (!this.authService.isEmailValid(this.registerData.email)) {
      this.errors['email'] = 'Email inválido';
      isValid = false;
    }

    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (this.registerData.phone && this.registerData.phone.replace(/\D/g, '').length < 10) {
      this.errors['phone'] = 'Telefone inválido';
      isValid = false;
    }

    // Validar documento (opcional, mas se preenchido deve ser válido)
    if (this.registerData.document && !this.authService.validateDocument(this.registerData.document)) {
      this.errors['document'] = 'CPF inválido';
      isValid = false;
    }

    // Validar senha
    if (!this.registerData.password) {
      this.errors['password'] = 'Senha é obrigatória';
      isValid = false;
    } else if (!this.authService.isPasswordStrong(this.registerData.password)) {
      this.errors['password'] = 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo';
      isValid = false;
    }

    // Validar confirmação de senha
    if (!this.confirmPassword) {
      this.errors['confirmPassword'] = 'Confirmação de senha é obrigatória';
      isValid = false;
    } else if (this.confirmPassword !== this.registerData.password) {
      this.errors['confirmPassword'] = 'Senhas não coincidem';
      isValid = false;
    }

    // Validar termos
    if (!this.acceptTerms) {
      this.errors['terms'] = 'Você deve aceitar os termos de uso';
      isValid = false;
    }

    return isValid;
  }

  onInputChange(field: string): void {
    if (this.errors[field]) {
      delete this.errors[field];
    }
    if (this.generalError) {
      this.generalError = '';
    }

    // Formatação automática de telefone
    if (field === 'phone' && this.registerData.phone) {
      this.registerData.phone = this.formatPhone(this.registerData.phone);
    }

    // Formatação automática de CPF
    if (field === 'document' && this.registerData.document) {
      this.registerData.document = this.formatCPF(this.registerData.document);
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
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
  }

  getPasswordStrength(): string {
    const password = this.registerData.password;
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
}
