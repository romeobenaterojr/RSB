import { Pipe, PipeTransform } from '@angular/core';
import { ShippingAddress } from '../models/order';
import { ConfirmationToken } from '@stripe/stripe-js';
import { Shipping } from '../models/user';

@Pipe({
  name: 'address',
  standalone: true
})
export class AddressPipe implements PipeTransform {

  transform(
    value?: ShippingAddress | ConfirmationToken['shipping'] | Shipping | null
  ): string {
    if (!value) return 'Unknown address';

    // Handle Order's ShippingAddress
    if ('line1' in value) {
      const parts: string[] = [];
      if (value.name) parts.push(value.name);
      if (value.line1) parts.push(value.line1);
      if (value.line2) parts.push(value.line2);
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.country) parts.push(value.country);
      if ((value as any).postalCode) parts.push((value as any).postalCode);
      return parts.join(', ') || 'Unknown address';
    }

    // Handle Stripe type
    if ('address' in value && value.address) {
      const addr = value.address as any;
      const postal = addr.postal_code ?? addr.postalCode ?? '';
      const parts: string[] = [];
      if (value.name) parts.push(value.name);
      if (addr.line1) parts.push(addr.line1);
      if (addr.line2) parts.push(addr.line2);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      if (postal) parts.push(postal);
      return parts.join(', ') || 'Unknown address';
    }

    return 'Unknown address';
  }
}
