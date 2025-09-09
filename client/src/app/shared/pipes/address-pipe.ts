import { Pipe, PipeTransform } from '@angular/core';
import { Shipping } from '../../shared/models/confirmation-token.model';

@Pipe({
  name: 'address'
})
export class AddressPipe implements PipeTransform {

  transform(value?: Shipping | null, ...args: unknown[]): string {
    if (!value || !value.address) return 'Unknown address';

    const { line1, line2, city, state, country, postalCode } = value.address;
    const name = value.name ? value.name + ', ' : '';
    const line2Text = line2 ? ', ' + line2 : '';

    return `${name}${line1}${line2Text}, ${city}, ${state}, ${country} ${postalCode}`;
  }

}
