import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CartWidget from "@/components/cart/cart-widget";
import { Search, TrendingUp, Hash, Users, ExternalLink } from "lucide-react";

export default function RightSidebar() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trendingProducts = [] } = useQuery({
    queryKey: ["/api/products/trending"],
    retry: false,
  });

  const { data: trendingHashtags = [] } = useQuery({
    queryKey: ["/api/hashtags/trending"],
    retry: false,
  });

  const { data: trendingVrooms = [] } = useQuery({
    queryKey: ["/api/vrooms/trending"],
    retry: false,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <aside className="w-80 p-6 custom-scrollbar overflow-y-auto h-screen">
      {/* Search Box */}
      <Card className="mb-6 border border-cream">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-medium-gray" size={16} />
            <Input
              type="text"
              placeholder="Search products, users, #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4 py-2 bg-cream border-none rounded-lg outline-none focus:ring-2 focus:ring-terracotta"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trending Products */}
      <Card className="mb-6 border border-cream">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-charcoal">
            <TrendingUp className="mr-2" size={20} />
            Trending Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingProducts.slice(0, 3).map((product: any) => (
            <div 
              key={product.id} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-cream rounded-lg p-2 transition-colors"
              onClick={() => window.location.href = `/product/${product.id}`}
              data-testid={`trending-product-${product.id}`}
            >
              <div className="w-12 h-12 bg-cream rounded-lg overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                    data-testid={`img-trending-product-${product.id}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TrendingUp className="text-medium-gray" size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal truncate" data-testid={`text-trending-title-${product.id}`}>
                  {product.title}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-medium-gray" data-testid={`text-trending-stats-${product.id}`}>
                    {product.likesCount} likes · ${product.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {trendingProducts.length === 0 && (
            <p className="text-medium-gray text-sm text-center py-4" data-testid="text-no-trending-products">
              No trending products yet
            </p>
          )}
          {trendingProducts.length > 3 && (
            <Button 
              variant="ghost" 
              className="w-full text-terracotta hover:text-coral font-medium"
              onClick={() => window.location.href = '/trending'}
              data-testid="button-show-more-products"
            >
              Show more
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Trending Hashtags */}
      <Card className="mb-6 border border-cream">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-charcoal">
            <Hash className="mr-2" size={20} />
            Trending Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingHashtags.slice(0, 4).map((hashtag: any, index: number) => (
            <div 
              key={index} 
              className="flex items-center justify-between cursor-pointer hover:bg-cream rounded-lg p-2 transition-colors"
              onClick={() => window.location.href = `/search?hashtags=${encodeURIComponent(hashtag.hashtag)}`}
              data-testid={`trending-hashtag-${index}`}
            >
              <span className="text-charcoal font-medium" data-testid={`text-hashtag-${index}`}>
                #{hashtag.hashtag}
              </span>
              <span className="text-sm text-medium-gray" data-testid={`text-hashtag-count-${index}`}>
                {hashtag.count} posts
              </span>
            </div>
          ))}
          {trendingHashtags.length === 0 && (
            <p className="text-medium-gray text-sm text-center py-4" data-testid="text-no-trending-hashtags">
              No trending hashtags yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Popular Vrooms */}
      <Card className="mb-6 border border-cream">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-charcoal">
            <Users className="mr-2" size={20} />
            Popular Vrooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingVrooms.slice(0, 3).map((vroom: any) => (
            <div 
              key={vroom.id} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-cream rounded-lg p-2 transition-colors"
              onClick={() => window.location.href = `/vroom/${vroom.id}`}
              data-testid={`popular-vroom-${vroom.id}`}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={vroom.user?.profileImageUrl} 
                  alt={vroom.name}
                  data-testid={`img-vroom-avatar-${vroom.id}`}
                />
                <AvatarFallback>
                  {vroom.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal truncate" data-testid={`text-vroom-name-${vroom.id}`}>
                  {vroom.name}
                </p>
                <p className="text-sm text-medium-gray" data-testid={`text-vroom-stats-${vroom.id}`}>
                  {vroom.followersCount} followers
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-coral hover:text-terracotta font-medium text-sm"
                data-testid={`button-follow-vroom-${vroom.id}`}
              >
                Follow
              </Button>
            </div>
          ))}
          {trendingVrooms.length === 0 && (
            <p className="text-medium-gray text-sm text-center py-4" data-testid="text-no-popular-vrooms">
              No popular Vrooms yet
            </p>
          )}
          {trendingVrooms.length > 3 && (
            <Button 
              variant="ghost" 
              className="w-full text-terracotta hover:text-coral font-medium"
              onClick={() => window.location.href = '/vrooms'}
              data-testid="button-show-more-vrooms"
            >
              Show more
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Shopping Cart Widget */}
      <CartWidget />

      {/* Footer Links */}
      <div className="mt-6 p-4 text-xs text-medium-gray space-y-2">
        <div className="flex flex-wrap gap-2">
          <a href="/terms" className="hover:text-terracotta">Terms</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-terracotta">Privacy</a>
          <span>•</span>
          <a href="/help" className="hover:text-terracotta">Help</a>
        </div>
        <p className="leading-relaxed">
          © 2024 Eldady. A social commerce platform for discovering and sharing amazing products.
        </p>
      </div>
    </aside>
  );
}
