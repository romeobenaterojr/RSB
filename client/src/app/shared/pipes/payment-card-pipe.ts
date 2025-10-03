import { Pipe, PipeTransform } from '@angular/core';
import { PaymentPreview as AppPaymentPreview } from '../../shared/models/user';
import { PaymentSummary } from '../models/order';

// Define Stripe-style preview
type StripePaymentPreview = {
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
};

@Pipe({
  name: 'paymentCard'
})
export class PaymentCardPipe implements PipeTransform {

  transform(value?: StripePaymentPreview | AppPaymentPreview | PaymentSummary): string {
    if (!value) return 'Unknown payment method';


    if ('card' in value && value.card) {
      const { brand, last4, exp_month, exp_year } = value.card;
      return `${brand?.toUpperCase()} **** **** **** ${last4}, Exp: ${exp_month}/${exp_year}`;
    }

    if ('brand' in value && 'last4' in value) {
      const { brand, last4 } = value as AppPaymentPreview | PaymentSummary;
      const expMonth = (value as any).expMonth ?? (value as any).exp_month;
      const expYear = (value as any).expYear ?? (value as any).exp_year;

      return `${brand?.toUpperCase()} **** **** **** ${last4}, Exp: ${expMonth}/${expYear}`;
    }

    return 'Unknown payment method';
  }
}
