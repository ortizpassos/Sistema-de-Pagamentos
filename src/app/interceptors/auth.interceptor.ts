import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

// Interceptor: anexa Authorization se a requisição for para nossa API
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const prodBase = 'https://sistema-de-pagamentos-backend.onrender.com/api/';
  const localBase = 'http://localhost:'; // qualquer porta local

  const url = req.url;
  const isApiRequest = (
    url.startsWith(prodBase) ||
    (url.startsWith(localBase) && url.includes('/api/')) ||
    url.startsWith('/api/') // caso no futuro use caminhos relativos
  );

  if (!isApiRequest) {
    return next(req);
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
