import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Address, User } from '../../shared/models/user';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  currentUser = signal<User | null>(null);
  isadmin = computed(() => {
    const roles = this.currentUser()?.roles;
    return Array.isArray(roles) ? roles.includes('Admin') : roles === 'Admin';
  }) ;
  

  // -------------------- Login --------------------
  login(values: any) {
    let params = new HttpParams().set('useCookies', 'true');

    return this.http.post<User>(`${this.baseUrl}login`, values, { params }).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  // -------------------- Register --------------------
  register(values: any) {
    return this.http.post(`${this.baseUrl}account/register`, values);
  }

  // -------------------- Get User Info --------------------
  getUserInfo() {
    return this.http.get<User>(`${this.baseUrl}account/user-info`).pipe(
      tap(user => this.currentUser.set(user)),
      map(user => user)
    );
  }

  // -------------------- Logout --------------------
  logout() {
    return this.http.post(`${this.baseUrl}account/logout`, {}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }

  // -------------------- Update Address --------------------
  updateAddress(address: Address) {
    return this.http.post(`${this.baseUrl}account/address`, address).pipe(
      tap(() => {
        this.currentUser.update(user => {
          if (user) user.address = address;
          return user;
        });
      })
    );
  }

  // -------------------- Auth Status --------------------
  getAuthState() {
    return this.http.get<{ isAuthenticated: boolean }>(`${this.baseUrl}account/auth-status`);
  }
}
