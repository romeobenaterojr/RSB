import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Cart, CartItem, Coupon } from '../../shared/models/cart';
import { Product } from '../../shared/models/product';
import { firstValueFrom, map, tap } from 'rxjs';
import { DeliveryMethod } from '../../shared/models/deliveryMethod';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  baseUrl = environment.apiUrl; 
  private http = inject(HttpClient);

  cart = signal<Cart | null>(null);
  selectedDelivery = signal<DeliveryMethod | null>(null);

  // ✅ Total items in the cart
  itemCount = computed(() =>
    this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  );

  // ✅ Corrected totals computation (includes discount logic)
  totals = computed(() => {
    const cart = this.cart();
    const delivery = this.selectedDelivery();

    const subtotal = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
    const deliveryFee = delivery?.price ?? cart?.deliveryFee ?? 0;

    let discount = 0;
    if (cart?.coupon) {
      if (cart.coupon.amountOff) {
        discount = cart.coupon.amountOff;
      } else if (cart.coupon.percentOff) {
        discount = subtotal * (cart.coupon.percentOff / 100);
      }
    }

    const total = Math.max(subtotal + deliveryFee - discount, 0);

    return { subtotal, deliveryFee, discount, total };
  });

  // ✅ Fetch existing cart from API
  getCart(id: string) {
    return this.http.get<Cart>(`${this.baseUrl}cart?id=${id}`).pipe(
      map(cart => {
        this.cart.set(cart);
        return cart;
      })
    );
  }

  // ✅ Save cart to backend and update signal
  setCart(cart: Cart) {
    return this.http.post<Cart>(`${this.baseUrl}cart`, cart).pipe(
      tap(cart => this.cart.set(cart))
    );
  }

  // ✅ Add item (either product or existing cart item)
  async addItemToCart(item: CartItem | Product, quantity = 1) {
    const cart = this.cart() ?? this.createCart();

    if (this.isProduct(item)) {
      item = this.mapProductCartItem(item);
    }

    cart.items = this.addOrUpdateItem(cart.items, item, quantity);
    await firstValueFrom(this.setCart(cart));
  }

  // ✅ Remove item or decrease quantity
  async removeItemFromCart(productId: number, quantity = 1) {
    const cart = this.cart();
    if (!cart) return;

    const index = cart.items.findIndex(x => x.productId === productId);
    if (index !== -1) {
      if (cart.items[index].quantity > quantity) {
        cart.items[index].quantity -= quantity;
      } else {
        cart.items.splice(index, 1);
      }

      if (cart.items.length === 0) {
        this.deleteCart();
      } else {
        await firstValueFrom(this.setCart(cart));
      }
    }
  }

  // ✅ Delete the entire cart
  deleteCart() {
    this.http.delete(`${this.baseUrl}cart?id=${this.cart()?.id}`).subscribe({
      next: () => {
        localStorage.removeItem('cart_id');
        this.cart.set(null);
      }
    });
  }

  // ✅ Apply coupon (and persist to backend)
  applyDiscount(code: string) {
    return this.http.get<Coupon>(`${this.baseUrl}coupons/${code}`).pipe(
      tap(async coupon => {
        const cart = this.cart();
        if (!cart) return;
        cart.coupon = coupon;
        await firstValueFrom(this.setCart(cart));
      })
    );
  }

  // ✅ Remove applied coupon
  async removeDiscount() {
    const cart = this.cart();
    if (!cart) return;
    if (cart.coupon) cart.coupon = undefined;
    await firstValueFrom(this.setCart(cart));
  }

  // 🔧 Utility: check if input is a Product
  private isProduct(item: CartItem | Product): item is Product {
    return (item as Product).id !== undefined;
  }

  // 🔧 Utility: map Product → CartItem
  private mapProductCartItem(item: Product): CartItem {
    return {
      productId: item.id,
      productName: item.name,
      price: item.price,
      quantity: 0,
      pictureUrl: item.pictureUrl,
      brand: item.brand,
      type: item.type
    };
  }

  // 🔧 Utility: add or update item in the cart
  private addOrUpdateItem(items: CartItem[], item: CartItem, quantity: number): CartItem[] {
    const index = items.findIndex(x => x.productId === item.productId);
    if (index === -1) {
      item.quantity = quantity;
      items.push(item);
    } else {
      items[index].quantity += quantity;
    }
    return items;
  }

  // 🔧 Utility: create a new cart
  private createCart(): Cart {
    const cart = new Cart();
    localStorage.setItem('cart_id', cart.id);
    return cart;
  }

  // Placeholder — if needed later
  getUserInfo(): any {
    throw new Error('Method not implemented.');
  }
}
