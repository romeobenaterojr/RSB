import { inject, Injectable } from '@angular/core';
import {
  ConfirmationToken,
  loadStripe,
  Stripe,
  StripeAddressElement,
  StripeAddressElementOptions,
  StripeElements,
  StripePaymentElement
} from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CartService } from './cart.service';
import { Cart } from '../../shared/models/cart';
import { firstValueFrom, map } from 'rxjs';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private cartService = inject(CartService);
  private accountService = inject(AccountService);

  private stripePromise: Promise<Stripe | null>;
  private elements?: StripeElements;
  private addressElement?: StripeAddressElement;
  private paymentElement?: StripePaymentElement;

  constructor() {
    this.stripePromise = loadStripe(environment.stripePublicKey);
  }

  getStripeInstance(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  getElements(): StripeElements | undefined {
    return this.elements;
  }

  async initializeElements(): Promise<StripeElements> {
    if (this.elements) return this.elements;

    const stripe = await this.getStripeInstance();
    if (!stripe) throw new Error('Stripe failed to load.');

    const cart = await firstValueFrom(this.createOrUpdatePaymentIntent());

    if (!cart.clientSecret) {
      throw new Error('PaymentIntent clientSecret is missing.');
    }

    this.elements = stripe.elements({
      clientSecret: cart.clientSecret,
      appearance: { labels: 'floating' }
    });

    return this.elements;
  }

  async createPaymentElement(): Promise<StripePaymentElement> {
    if (this.paymentElement) return this.paymentElement;

    const elements = await this.initializeElements();
    this.paymentElement = elements.create('payment');
    return this.paymentElement;
  }

  async createAddressElement(): Promise<StripeAddressElement> {
    if (this.addressElement) return this.addressElement;

    const elements = await this.initializeElements();
    const user = this.accountService.currentUser();

    const defaultValues: StripeAddressElementOptions['defaultValues'] = {};

    if (user) {
      defaultValues.name = `${user.firstName} ${user.lastName}`;
    }

    if (user?.address) {
      defaultValues.address = {
        line1: user.address.line1,
        line2: user.address.line2,
        city: user.address.city,
        state: user.address.state,
        country: user.address.country,
        postal_code: user.address.postalCode
      };
    }

    this.addressElement = elements.create('address', {
      mode: 'shipping',
      defaultValues
    });

    return this.addressElement;
  }

  /** Confirm payment using Stripe PaymentIntent in PHP */
  async confirmPayment(confirmationToken: ConfirmationToken) {
    const stripe = await this.getStripeInstance();
    const elements = await this.initializeElements();

    // Submit elements first (Stripe requirement)
    const submitResult = await elements.submit();
    if (submitResult.error) throw new Error(submitResult.error.message);

    const cart = this.cartService.cart();
    if (!stripe || !cart?.clientSecret) {
      throw new Error('Unable to load Stripe or clientSecret is missing');
    }

    // Confirm payment in PHP
    return await stripe.confirmPayment({
      clientSecret: cart.clientSecret,
      confirmParams: {
        confirmation_token: confirmationToken.id
      },
      redirect: 'if_required'
    });
  }

  /** Create or update PaymentIntent in PHP */
  createOrUpdatePaymentIntent() {
    const cart = this.cartService.cart();
    if (!cart) throw new Error('Cart not found.');

    // Convert cart total to centavos (smallest unit)
    const totalAmount = Math.round((cart?.totals?.total ?? 0) * 100);

    return this.http.post<Cart>(`${this.baseUrl}payments/${cart.id}`, {
      amount: totalAmount,
      currency: 'PHP'
    }).pipe(
      map(cart => {
        this.cartService.setCart(cart);
        return cart;
      })
    );
  }

  /** Reset all Stripe elements */
  disposeElements(): void {
    this.elements = undefined;
    this.addressElement = undefined;
    this.paymentElement = undefined;
  }
}
