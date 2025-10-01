import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserLogin } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  @Output() switchToRegister = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  loginData: UserLogin = {
    email: '',
    password: ''
  };

  isLoading = false;
  showPassword = false;
  errors: { [key: string]: string } = {};
  generalError = '';

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

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loginSuccess.emit();
          this.router.navigate(['/dashboard']);
        } else {
          this.generalError = response.error?.message || 'Erro ao fazer login';
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

    // Validar email
    if (!this.loginData.email) {
      this.errors['email'] = 'Email é obrigatório';
      isValid = false;
    } else if (!this.authService.isEmailValid(this.loginData.email)) {
      this.errors['email'] = 'Email inválido';
      isValid = false;
    }

    // Validar senha
    if (!this.loginData.password) {
      this.errors['password'] = 'Senha é obrigatória';
      isValid = false;
    }

    return isValid;
  }

  onInputChange(field: keyof UserLogin): void {
    if (this.errors[field]) {
      delete this.errors[field];
    }
    if (this.generalError) {
      this.generalError = '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSwitchToRegister(): void {
    this.switchToRegister.emit();
  }

  onForgotPassword(): void {
    // Implementar modal ou página de esqueci senha
    this.router.navigate(['/auth/forgot-password']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
