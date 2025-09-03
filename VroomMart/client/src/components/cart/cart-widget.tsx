import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function CartWidget() {
  const { user } = useAuth();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
    retry: false,
  });

  const totalAmount = cartItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );

  const itemCount = cartItems.length;

  if (!user || isLoading) {
    return null;
  }

  return (
    <Card className="border border-cream sticky top-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg font-bold text-charcoal">
          <div className="flex items-center">
            <ShoppingCart className="mr-2" size={20} />
            Cart
          </div>
          {itemCount > 0 && (
            <Badge className="bg-coral text-white text-xs" data-testid="badge-cart-count">
              {itemCount} items
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {itemCount === 0 ? (
          <div className="text-center py-8" data-testid="text-empty-cart-widget">
            <ShoppingCart className="mx-auto text-medium-gray mb-3" size={48} />
            <p className="text-medium-gray text-sm mb-4">Your cart is empty</p>
            <Link href="/">
              <Button 
                size="sm" 
                className="gradient-bg text-white hover:opacity-90 font-semibold"
                data-testid="button-start-shopping-widget"
              >
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items Preview */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
              {cartItems.slice(0, 3).map((item: any) => (
                <div 
                  key={item.id} 
                  className="flex items-center space-x-3 p-2 hover:bg-cream rounded-lg transition-colors"
                  data-testid={`cart-item-widget-${item.id}`}
                >
                  <div className="w-10 h-10 bg-cream rounded overflow-hidden flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-cart-item-widget-${item.id}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="text-medium-gray" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate" data-testid={`text-item-title-widget-${item.id}`}>
                      {item.product.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-medium-gray" data-testid={`text-item-price-widget-${item.id}`}>
                        ${item.product.price} × {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-terracotta" data-testid={`text-item-total-widget-${item.id}`}>
                        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {itemCount > 3 && (
                <div className="text-center py-2">
                  <p className="text-xs text-medium-gray" data-testid="text-more-items">
                    +{itemCount - 3} more items
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Total */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-medium-gray">Subtotal ({itemCount} items)</span>
                <span className="text-sm text-charcoal" data-testid="text-cart-subtotal">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-medium-gray">Shipping</span>
                <span className="text-sm text-charcoal">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-charcoal">Total</span>
                <span className="font-bold text-lg text-terracotta" data-testid="text-cart-total">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-6">
              <Link href="/cart">
                <Button 
                  className="w-full gradient-bg text-white hover:opacity-90 font-semibold"
                  data-testid="button-view-cart"
                >
                  View Cart
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </Link>
              
              <Button 
                variant="outline"
                size="sm"
                className="w-full border-cream hover:bg-cream text-charcoal"
                onClick={() => window.location.href = '/checkout'}
                data-testid="button-quick-checkout"
              >
                Quick Checkout
              </Button>
            </div>

            <p className="text-xs text-medium-gray text-center mt-4">
              Free shipping • Pay on delivery
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
