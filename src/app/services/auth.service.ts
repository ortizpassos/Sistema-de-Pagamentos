import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { 
  User, 
  UserRegistration, 
  UserLogin, 
  AuthResponse,
  UserProfile,
  PasswordChange,
  ForgotPassword,
  ResetPassword
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://sistema-de-pagamentos-backend.onrender.com/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  // Registrar novo usuário
  register(userData: UserRegistration): Observable<AuthResponse> {
    const payload = this.sanitizeRegistrationData(userData);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuth(response.data.user, response.data.token, response.data.refreshToken);
          }
        })
      );
  }

  // Login do usuário
  login(credentials: UserLogin): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuth(response.data.user, response.data.token, response.data.refreshToken);
          }
        })
      );
  }

  // Logout
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.clearAuth();
        })
      );
  }

  // Verificar se o usuário está logado
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verificar se o token não expirou
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Obter token atual
  getToken(): string | null {
    return this.tokenSubject.value || localStorage.getItem('auth_token');
  }

  // Atualizar perfil do usuário
  updateProfile(userData: Partial<User>): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data.user);
          }
        })
      );
  }

  // Alterar senha
  changePassword(passwordData: PasswordChange): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/change-password`, passwordData);
  }

  // Esqueci minha senha
  forgotPassword(data: ForgotPassword): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, data);
  }

  // Resetar senha
  resetPassword(data: ResetPassword): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password`, data);
  }

  // Obter perfil completo do usuário
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  // Verificar email
  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-email`, { token });
  }

  // Reenviar email de verificação
  resendVerificationEmail(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/resend-verification`, {});
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuth(response.data.user, response.data.token, response.data.refreshToken);
          }
        })
      );
  }

  // Métodos privados
  private setAuth(user: User, token: string, refreshToken?: string): void {
    this.currentUserSubject.next(user);
    this.tokenSubject.next(token);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private clearAuth(): void {
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');
    
    if (token && userStr && this.isAuthenticated()) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.tokenSubject.next(token);
      } catch {
        this.clearAuth();
      }
    } else {
      this.clearAuth();
    }
  }

  // Validações
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isPasswordStrong(password: string): boolean {
    // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }

  validateDocument(document: string): boolean {
    // Validação simples de CPF (11 dígitos)
    const cleanDoc = document.replace(/\D/g, '');
    return cleanDoc.length === 11;
  }

  // Sanitização dos dados de registro para evitar envio de campos vazios
  private sanitizeRegistrationData(data: UserRegistration): any {
    const payload: any = {
      email: data.email?.trim().toLowerCase(),
      password: data.password
    };

    if (data.firstName) payload.firstName = data.firstName.trim();
    if (data.lastName) payload.lastName = data.lastName.trim();
    if (data.phone) {
      const phone = data.phone.replace(/\D/g, '');
      if (phone.length >= 10) {
        // Formato (99) 99999-9999 ou (99) 9999-9999
        const isNine = phone.length === 11;
        const ddd = phone.substring(0,2);
        const part1 = isNine ? phone.substring(2,7) : phone.substring(2,6);
        const part2 = isNine ? phone.substring(7) : phone.substring(6);
        payload.phone = `(${ddd}) ${part1}-${part2}`;
      }
    }
    if (data.document) {
      const doc = data.document.replace(/\D/g, '');
      if (doc.length === 11) payload.document = doc;
    }
    return payload;
  }
}