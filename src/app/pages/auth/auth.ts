import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../../components/auth/login/login';
import { RegisterComponent } from '../../components/auth/register/register';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  isLoginMode = true;

  constructor(private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onLoginSuccess() {
    // Navegar para o dashboard após login bem-sucedido
    this.router.navigate(['/dashboard']);
  }

  onRegisterSuccess() {
    // Após registro bem-sucedido, trocar para modo de login
    this.isLoginMode = true;
  }
}
