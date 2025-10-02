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

  dadosLogin: UserLogin = {
    email: '',
    password: ''
  };
  carregando = false;
  mostrarSenha = false;
  erros: { [key: string]: string } = {};
  erroGeral = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.validarFormulario()) {
      return;
    }
    this.carregando = true;
    this.erroGeral = '';
    this.authService.login(this.dadosLogin).subscribe({
      next: (response) => {
        if (response.success) {
          this.loginSuccess.emit();
          this.router.navigate(['/dashboard']);
        } else {
          this.erroGeral = response.error?.message || 'Erro ao fazer login';
        }
        this.carregando = false;
      },
      error: (error) => {
        this.erroGeral = error.error?.message || 'Erro ao conectar com o servidor';
        this.carregando = false;
      }
    });
  }

  validarFormulario(): boolean {
    this.erros = {};
    let isValid = true;

    // Validar email
    if (!this.dadosLogin.email) {
      this.erros['email'] = 'Email é obrigatório';
      isValid = false;
    } else if (!this.authService.isEmailValid(this.dadosLogin.email)) {
      this.erros['email'] = 'Email inválido';
      isValid = false;
    }

    // Validar senha
    if (!this.dadosLogin.password) {
      this.erros['password'] = 'Senha é obrigatória';
      isValid = false;
    }

    return isValid;
  }

  onInputChange(field: keyof UserLogin): void {
    if (this.erros[field]) {
      delete this.erros[field];
    }
    if (this.erroGeral) {
      this.erroGeral = '';
    }
  }

  togglePasswordVisibility(): void {
    this.mostrarSenha = !this.mostrarSenha;
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
