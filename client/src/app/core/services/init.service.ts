import { inject, Injectable } from '@angular/core';
import { CartService } from './cart.service';
import { AccountService } from './account.service';
import { SignalrService } from './signalr.service';
import { forkJoin, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  private readonly cartService = inject(CartService);
  private readonly accountService = inject(AccountService);
  private readonly signalrService = inject(SignalrService);

  /**
   * Application initializer
   * Loads cart and user, then starts SignalR
   */
  init() {
    const cartId = localStorage.getItem('cart_id');

    const cart$ = cartId
      ? this.cartService.getCart(cartId).pipe(
          catchError(err => {
            console.error('❌ Failed to load cart:', err);
            return of(null);
          })
        )
      : of(null);

    const user$ = this.accountService.getUserInfo().pipe(
      tap(user => {
        if (user) {
          console.log('👤 User loaded, starting SignalR connection...');
          this.signalrService.createHubConnection(); // ✅ Only here
        } else {
          console.log('👤 No user found, skipping SignalR connection');
        }
      }),
      catchError(err => {
        console.error('❌ Failed to load user:', err);
        return of(null);
      })
    );

    return forkJoin({ cart: cart$, user: user$ });
  }
}
