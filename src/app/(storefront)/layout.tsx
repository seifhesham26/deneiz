import { Footer } from "@/components/layout/storefront/footer";
import { MobileMenu } from "@/components/layout/storefront/mobile-menu";
import { Navbar } from "@/components/layout/storefront/navbar";
import { CartDrawer } from "@/components/storefront/cart/cart-drawer";
import { Toaster } from "@/components/ui/toast";

export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <MobileMenu />
      <CartDrawer />
      <Toaster />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
