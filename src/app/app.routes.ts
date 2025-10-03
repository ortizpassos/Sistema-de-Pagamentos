import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HomeComponent } from './pages/home/home';
import { PaymentComponent } from './pages/payment/payment';
import { AuthComponent } from './pages/auth/auth';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ReportsPage } from './pages/reports/reports';
import { SettingsPage } from './pages/settings/settings';
import { NewPaymentPage } from './pages/new-payment/new-payment';
import { TransactionsPage } from './pages/transactions/transactions';
import { AuthService } from './services/auth.service';

// Guard de autenticação
const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth']);
  return false;
};

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'payment/:transactionId', component: PaymentComponent },
  { path: 'novo-pagamento', component: NewPaymentPage, canActivate: [authGuard] },
  { path: 'relatorios', component: ReportsPage, canActivate: [authGuard] },
  { path: 'transacoes', component: TransactionsPage, canActivate: [authGuard] },
  { path: 'configuracoes', component: SettingsPage, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
