import { Component, inject, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { AddressPipe } from "../../../shared/pipes/address-pipe";
import { PaymentCardPipe } from "../../../shared/pipes/payment-card-pipe";
import { ConfirmationTokenWithPreview } from '../../../shared/models/confirmation-token.model';
import { Order } from '../../../shared/models/order';

@Component({
  selector: 'app-checkout-review',
  standalone: true, 
  imports: [
    CurrencyPipe,
    AddressPipe,
    PaymentCardPipe
  ],
  templateUrl: './checkout-review.component.html',
  styleUrls: ['./checkout-review.component.scss'] 
})
export class CheckoutReviewComponent {
  
  
  protected cartService = inject(CartService);
   order?: Order;
 
  @Input() confirmationToken?: ConfirmationTokenWithPreview;

}
