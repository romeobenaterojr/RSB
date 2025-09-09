export type Shipping = {
  name?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
};

export type PaymentPreview = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type ConfirmationTokenWithPreview = {
  shipping: Shipping | null;
  paymentMethodPreview: PaymentPreview | null;
  clientSecret?: string;
};
