import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface ListResponse { success: boolean; data: UserOption[]; }
interface LookupResponse { success: boolean; data: UserOption | null; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  // URL absoluta apontando para backend em produção
  private api = 'https://sistema-de-pagamentos-backend.onrender.com/api/users';

  search(term: string): Observable<UserOption[]> {
    const q = term?.trim();
    return this.http.get<ListResponse>(`${this.api}`, { params: q ? { q } : {} }).pipe(
      map(r => r.success ? r.data : [])
    );
  }

  lookupByEmail(email: string): Observable<UserOption | null> {
    return this.http.get<LookupResponse>(`${this.api}/lookup`, { params: { email } }).pipe(
      map(r => r.success ? r.data : null)
    );
  }
}
