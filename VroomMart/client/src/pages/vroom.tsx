import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import RightSidebar from "@/components/layout/right-sidebar";
import ProductGrid from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Heart } from "lucide-react";

export default function Vroom() {
  const { id } = useParams();

  const { data: vroom, isLoading } = useQuery({
    queryKey: ["/api/vrooms", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-warm-white">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 gradient-bg rounded-xl animate-pulse mx-auto mb-4"></div>
              <p className="text-medium-gray">Loading Vroom...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!vroom) {
    return (
      <div className="flex min-h-screen bg-warm-white">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-medium-gray text-lg">Vroom not found</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-warm-white">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="flex">
          <div className="flex-1 max-w-4xl border-r border-cream">
            {/* Vroom Header */}
            <div className="bg-white border-b border-cream">
              {/* Banner */}
              {vroom.bannerImageUrl && (
                <div className="h-48 bg-cream overflow-hidden">
                  <img 
                    src={vroom.bannerImageUrl} 
                    alt="Vroom banner"
                    className="w-full h-full object-cover"
                    data-testid="img-vroom-banner"
                  />
                </div>
              )}
              
              {/* Profile Section */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20 border-4 border-white -mt-10 bg-white">
                      <AvatarImage 
                        src={vroom.user?.profileImageUrl} 
                        alt={vroom.user?.firstName}
                        data-testid="img-vroom-owner-avatar"
                      />
                      <AvatarFallback className="text-2xl">
                        {vroom.user?.firstName?.[0]}{vroom.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-bold text-charcoal" data-testid="text-vroom-name">
                        {vroom.name}
                      </h1>
                      <p className="text-medium-gray" data-testid="text-vroom-owner">
                        by {vroom.user?.firstName} {vroom.user?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    className="gradient-bg text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90"
                    data-testid="button-follow-vroom"
                  >
                    <Heart className="mr-2" size={16} />
                    Follow
                  </Button>
                </div>

                {vroom.description && (
                  <p className="text-charcoal mb-4" data-testid="text-vroom-description">
                    {vroom.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-medium-gray" />
                    <span className="text-charcoal" data-testid="text-followers-count">
                      {vroom.followersCount || 0} followers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye size={16} className="text-medium-gray" />
                    <span className="text-charcoal" data-testid="text-views-count">
                      {vroom.viewsCount || 0} views
                    </span>
                  </div>
                  <Badge variant="secondary" data-testid="badge-products-count">
                    {vroom.products?.length || 0} products
                  </Badge>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-charcoal mb-6" data-testid="text-products-title">
                Products
              </h2>
              
              {vroom.products && vroom.products.length > 0 ? (
                <ProductGrid products={vroom.products} />
              ) : (
                <div className="text-center py-12" data-testid="text-no-products">
                  <p className="text-medium-gray text-lg">No products in this Vroom yet</p>
                </div>
              )}
            </div>
          </div>
          
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
