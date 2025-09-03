import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string, quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Success",
        description: "Cart cleared",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  const totalAmount = cartItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 gradient-bg rounded-xl animate-pulse mx-auto mb-4"></div>
          <p className="text-medium-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-warm-white">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="text-terracotta" size={32} />
              <h1 className="text-3xl font-bold text-charcoal" data-testid="text-page-title">Shopping Cart</h1>
            </div>
            {cartItems.length > 0 && (
              <Button 
                variant="ghost" 
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending}
                className="text-coral hover:text-destructive hover:bg-cream"
                data-testid="button-clear-cart"
              >
                <Trash2 className="mr-2" size={16} />
                Clear Cart
              </Button>
            )}
          </div>

          {cartLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse" data-testid={`skeleton-cart-item-${i}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-cream rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-cream rounded w-1/3"></div>
                        <div className="h-3 bg-cream rounded w-1/4"></div>
                        <div className="h-4 bg-cream rounded w-1/5"></div>
                      </div>
                      <div className="w-24 h-8 bg-cream rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-16" data-testid="text-empty-cart">
              <ShoppingBag className="mx-auto text-medium-gray mb-4" size={64} />
              <h2 className="text-xl font-semibold text-charcoal mb-2">Your cart is empty</h2>
              <p className="text-medium-gray mb-6">Start shopping to add items to your cart</p>
              <Button 
                className="gradient-bg text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90"
                onClick={() => window.location.href = '/'}
                data-testid="button-start-shopping"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" data-testid="badge-item-count">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
                
                {cartItems.map((item: any) => (
                  <Card key={item.id} className="border border-cream hover:shadow-sm transition-shadow" data-testid={`cart-item-${item.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-cream rounded-xl overflow-hidden flex-shrink-0">
                          {item.product.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                              data-testid={`img-product-${item.id}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="text-medium-gray" size={24} />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-charcoal truncate mb-1" data-testid={`text-product-title-${item.id}`}>
                            {item.product.title}
                          </h3>
                          <p className="text-sm text-medium-gray mb-2" data-testid={`text-seller-name-${item.id}`}>
                            by {item.product.user.firstName} {item.product.user.lastName}
                          </p>
                          <p className="text-lg font-bold text-terracotta" data-testid={`text-product-price-${item.id}`}>
                            ${item.product.price}
                          </p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({ 
                              id: item.id, 
                              quantity: Math.max(1, item.quantity - 1) 
                            })}
                            disabled={updateQuantityMutation.isPending || item.quantity <= 1}
                            data-testid={`button-decrease-quantity-${item.id}`}
                          >
                            <Minus size={16} />
                          </Button>
                          
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value) || 1;
                              updateQuantityMutation.mutate({ id: item.id, quantity });
                            }}
                            className="w-16 text-center"
                            min="1"
                            data-testid={`input-quantity-${item.id}`}
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({ 
                              id: item.id, 
                              quantity: item.quantity + 1 
                            })}
                            disabled={updateQuantityMutation.isPending}
                            data-testid={`button-increase-quantity-${item.id}`}
                          >
                            <Plus size={16} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                            className="text-coral hover:text-destructive hover:bg-cream"
                            data-testid={`button-remove-item-${item.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="border border-cream sticky top-6">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-charcoal mb-4" data-testid="text-order-summary">
                      Order Summary
                    </h2>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-medium-gray">Items ({cartItems.length})</span>
                        <span className="text-charcoal" data-testid="text-items-total">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medium-gray">Shipping</span>
                        <span className="text-charcoal">Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-charcoal">Total</span>
                        <span className="text-terracotta" data-testid="text-grand-total">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 mb-4"
                      disabled={cartItems.length === 0}
                      data-testid="button-proceed-checkout"
                    >
                      Proceed to Checkout
                    </Button>
                    
                    <p className="text-xs text-medium-gray text-center">
                      Payment on delivery • Free shipping on all orders
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
