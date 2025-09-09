import { Pipe, PipeTransform } from '@angular/core';
import { PaymentPreview } from '../../shared/models/user';

@Pipe({
  name: 'paymentCard'
})
export class PaymentCardPipe implements PipeTransform {

  transform(value?: PaymentPreview | null, ...args: unknown[]): string {
    if (!value) return 'Unknown payment method';

    const { brand, last4, expMonth, expYear } = value;
    return `${brand.toUpperCase()} **** **** **** ${last4}, Exp: ${expMonth}/${expYear}`;
  }

}
