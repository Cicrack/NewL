import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  ShoppingCart, 
  Eye,
  Share,
  Hash,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductGridProps {
  products: any[];
  showUser?: boolean;
}

export default function ProductGrid({ products, showUser = true }: ProductGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Success",
        description: "Added to cart",
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
        description: "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  const handleShare = async (product: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: `${window.location.origin}/product/${product.id}`,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
        toast({
          title: "Success",
          description: "Link copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12" data-testid="text-no-products-grid">
        <p className="text-medium-gray">No products to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="product-grid">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="border border-cream hover:shadow-lg transition-shadow duration-300 product-card overflow-hidden"
          data-testid={`product-card-${product.id}`}
        >
          {/* Product Image */}
          <div 
            className="relative h-48 bg-cream cursor-pointer overflow-hidden group"
            onClick={() => window.location.href = `/product/${product.id}`}
          >
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                data-testid={`img-product-card-${product.id}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="text-medium-gray" size={32} />
              </div>
            )}
            
            {/* Price Badge */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-white text-terracotta font-bold shadow-sm" data-testid={`badge-price-${product.id}`}>
                ${product.price}
              </Badge>
            </div>

            {/* Stock Badge */}
            {product.stock !== undefined && (
              <div className="absolute top-3 right-3">
                <Badge 
                  variant={product.stock > 0 ? "secondary" : "destructive"}
                  className="shadow-sm"
                  data-testid={`badge-stock-${product.id}`}
                >
                  {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
                </Badge>
              </div>
            )}

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-charcoal hover:bg-cream"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/product/${product.id}`;
                  }}
                  data-testid={`button-view-product-${product.id}`}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-charcoal hover:bg-cream"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(product);
                  }}
                  data-testid={`button-share-product-${product.id}`}
                >
                  <Share size={16} />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            {/* User Info */}
            {showUser && product.user && (
              <div 
                className="flex items-center space-x-2 mb-3 cursor-pointer hover:bg-cream rounded-lg p-1 -m-1 transition-colors"
                onClick={() => window.location.href = `/profile/${product.userId}`}
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={product.user.profileImageUrl} 
                    alt={product.user.firstName}
                    data-testid={`img-user-avatar-card-${product.id}`}
                  />
                  <AvatarFallback className="text-xs">
                    {product.user.firstName?.[0]}{product.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate" data-testid={`text-user-name-card-${product.id}`}>
                    {product.user.firstName} {product.user.lastName}
                  </p>
                </div>
                <span className="text-xs text-medium-gray flex items-center" data-testid={`text-time-card-${product.id}`}>
                  <Clock size={10} className="mr-1" />
                  {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
                </span>
              </div>
            )}

            {/* Product Info */}
            <div 
              className="cursor-pointer"
              onClick={() => window.location.href = `/product/${product.id}`}
            >
              <h3 className="font-semibold text-charcoal mb-2 line-clamp-2" data-testid={`text-product-title-card-${product.id}`}>
                {product.title}
              </h3>
              <p className="text-sm text-medium-gray mb-3 line-clamp-3" data-testid={`text-product-description-card-${product.id}`}>
                {product.description}
              </p>
            </div>

            {/* Hashtags */}
            {product.hashtags && product.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {product.hashtags.slice(0, 3).map((tag: string, index: number) => (
                  <span 
                    key={index}
                    className="text-xs text-terracotta hover:text-coral cursor-pointer flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/search?hashtags=${encodeURIComponent(tag)}`;
                    }}
                    data-testid={`hashtag-card-${product.id}-${index}`}
                  >
                    <Hash size={10} className="mr-0.5" />
                    {tag}
                  </span>
                ))}
                {product.hashtags.length > 3 && (
                  <span className="text-xs text-medium-gray">
                    +{product.hashtags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center justify-between">
              {/* Stats */}
              <div className="flex items-center space-x-4 text-xs text-medium-gray">
                <span className="flex items-center space-x-1" data-testid={`text-likes-card-${product.id}`}>
                  <Heart size={12} />
                  <span>{product.likesCount || 0}</span>
                </span>
                <span className="flex items-center space-x-1" data-testid={`text-comments-card-${product.id}`}>
                  <MessageCircle size={12} />
                  <span>{product.commentsCount || 0}</span>
                </span>
                <span className="flex items-center space-x-1" data-testid={`text-views-card-${product.id}`}>
                  <Eye size={12} />
                  <span>{product.viewsCount || 0}</span>
                </span>
              </div>

              {/* Add to Cart */}
              <Button
                size="sm"
                className="gradient-bg text-white hover:opacity-90 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCartMutation.mutate(product.id);
                }}
                disabled={addToCartMutation.isPending || product.stock === 0}
                data-testid={`button-add-to-cart-card-${product.id}`}
              >
                <ShoppingCart size={14} className="mr-1" />
                {product.stock === 0 ? "Sold Out" : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
