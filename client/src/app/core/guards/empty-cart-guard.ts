import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { SnackbarService } from '../services/snackbar.service';

export const emptyCartGuard: CanActivateFn = () => {
  const cartService = inject(CartService);
  const router = inject(Router);
  const snack = inject(SnackbarService);

  const cart = cartService.cart();

  if (!cart || cart.items.length === 0) {
    snack.error('Your Cart is empty')
    router.navigateByUrl('/cart');
    return false;
  }

  return true;
};
