import { nanoid } from 'nanoid';

export type Coupon = {
  name: string;
  amountOff?: number;   // fixed discount (e.g. ₱100 off)
  percentOff?: number;  // percentage discount (e.g. 10% off)
  promotionCode: string;
  couponId: string;
};

export type CartType = {
  id: string;
  items: CartItem[];
  deliveryMethodId?: number;
  paymentIntend?: string;
  clientSecret: string;
  coupon?: Coupon;
};

export type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  pictureUrl: string;
  brand: string;
  type: string;
};

export class Cart implements CartType {
  id = nanoid();
  items: CartItem[] = [];
  deliveryMethodId?: number;
  paymentIntend?: string;
  clientSecret = '';
  deliveryFee = 0;
  coupon?: Coupon;

  // ✅ Automatically calculate totals with coupon discount
  get totals() {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    if (this.coupon) {
      if (this.coupon.amountOff) {
        discount = this.coupon.amountOff;
      } else if (this.coupon.percentOff) {
        discount = subtotal * (this.coupon.percentOff / 100);
      }
    }

    const totalBeforeDiscount = subtotal + this.deliveryFee;
    const total = Math.max(totalBeforeDiscount - discount, 0);

    return {
      subtotal,
      deliveryFee: this.deliveryFee,
      discount,
      total
    };
  }
}
