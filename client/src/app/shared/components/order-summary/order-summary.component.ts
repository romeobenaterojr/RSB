import { Component, inject } from '@angular/core';
import { Location, CurrencyPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-order-summary',
  standalone: true, // Standalone component
  imports: [
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    CurrencyPipe
  ],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss']
})
export class OrderSummaryComponent {
  // Inject services using the new inject() syntax
  cartService = inject(CartService);
  location = inject(Location);
}
