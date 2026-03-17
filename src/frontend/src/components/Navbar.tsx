import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, ShieldCheck, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const { totalItems, isOpen, setIsOpen } = useCart();
  const { identity, login, clear } = useInternetIdentity();
  const navigate = useNavigate();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-xs">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-xl font-bold text-primary"
            data-ocid="nav.link"
          >
            JK Baking Essentials
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium hover:text-primary transition-colors"
              data-ocid="nav.home.link"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-sm font-medium hover:text-primary transition-colors"
              data-ocid="nav.products.link"
            >
              Products
            </Link>
            {identity && (
              <Link
                to="/orders"
                className="text-sm font-medium hover:text-primary transition-colors"
                data-ocid="nav.orders.link"
              >
                My Orders
              </Link>
            )}
            <Link
              to="/admin-login"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-ocid="nav.admin_login.link"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Login
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
              data-ocid="nav.cart.button"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>

            {identity ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: "/orders" })}
                  data-ocid="nav.orders.button"
                >
                  <Package className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clear}
                  data-ocid="nav.logout.button"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={login} data-ocid="nav.login.button">
                <User className="h-4 w-4 mr-1" /> Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-96">
          <SheetHeader>
            <SheetTitle className="font-display">Your Cart</SheetTitle>
          </SheetHeader>
          <CartDrawer />
        </SheetContent>
      </Sheet>
    </>
  );
}
