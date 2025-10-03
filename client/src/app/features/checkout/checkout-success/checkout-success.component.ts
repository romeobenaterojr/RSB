import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SignalrService } from '../../../core/services/signalr.service';
import { AddressPipe } from '../../../shared/pipes/address-pipe';
import { PaymentCardPipe } from '../../../shared/pipes/payment-card-pipe';
import { Observable } from 'rxjs';
import { Order } from '../../../shared/models/order';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    RouterLink,
    MatProgressSpinnerModule,
    DatePipe,
    AddressPipe,
    CurrencyPipe,
    PaymentCardPipe
  ],
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss']
})
export class CheckoutSuccessComponent implements OnDestroy {
  public signalrService = inject(SignalrService);

  // Observable order from SignalR
  public order$: Observable<Order | null> = this.signalrService.order$;

  private orderService = inject(OrderService);

  ngOnDestroy(): void {
    this.orderService.orderComplete = false;

    // Clear the order via service method
    this.signalrService.clearOrder();
  }
}
