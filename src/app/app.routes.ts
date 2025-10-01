import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { PaymentComponent } from './pages/payment/payment';
import { AuthComponent } from './pages/auth/auth';
import { DashboardComponent } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'payment/:transactionId', component: PaymentComponent },
  { path: '**', redirectTo: '' }
];
