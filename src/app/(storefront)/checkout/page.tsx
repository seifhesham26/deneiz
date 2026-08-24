import { CheckoutForm } from "@/components/storefront/checkout/checkout-form";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="content-shell section-y">
      <CheckoutForm />
    </div>
  );
}
