import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrderService } from '../services/order.service';

export const orderCompleteGuard: CanActivateFn = (route, state) => {
  const orderservice = inject(OrderService);
  const router = inject(Router);
  if (orderservice.orderComplete){
    return true
  } else {
    router.navigateByUrl('/shop');
    return false;
  }
};
