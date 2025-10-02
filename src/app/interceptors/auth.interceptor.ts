import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

// Interceptor responsável por anexar o header Authorization com o token JWT
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Apenas adiciona Authorization para chamadas à nossa API backend
  const isApiRequest = req.url.startsWith('http://localhost:3000/api/');
  if (!isApiRequest) {
    return next(req);
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(cloned);
};
