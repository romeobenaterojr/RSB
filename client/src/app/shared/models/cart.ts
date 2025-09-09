import { nanoid } from 'nanoid';

export type CartType = {
  id: string;
  items: CartItem[];
  deliveryMethodId?: number;
  paymentIntend?: string;
  clientSecret: string;
}

export type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  pictureUrl: string;
  brand: string;
  type: string;
}

export class Cart implements CartType {
  id = nanoid();
  items: CartItem[] = [];
  deliveryMethodId?: number;
  paymentIntend?: string;
  clientSecret: string = ''; 
  deliveryFee: number = 0; 

  
   get totals() {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + (this.deliveryFee ?? 0);
    return {
      subtotal,
      deliveryFee: this.deliveryFee,
      total
    };
  }
}
