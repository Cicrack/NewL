import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import RightSidebar from "@/components/layout/right-sidebar";
import ProductPost from "@/components/product/product-post";
import ProductForm from "@/components/product/product-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
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

  const { data: recommendedProducts = [] } = useQuery({
    queryKey: ["/api/products/recommended"],
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
      
      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="flex">
          {/* Timeline Feed */}
          <div className="flex-1 max-w-2xl border-r border-cream">
            {/* Header */}
            <div className="sticky top-0 bg-white bg-opacity-80 backdrop-blur-sm border-b border-cream px-6 py-4 z-10">
              <h2 className="text-xl font-bold text-charcoal mb-4" data-testid="text-page-title">Home</h2>
              <Tabs defaultValue="for-you" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-cream rounded-none h-auto p-0">
                  <TabsTrigger 
                    value="for-you" 
                    className="px-4 py-2 text-charcoal font-medium border-b-2 border-transparent data-[state=active]:border-terracotta data-[state=active]:bg-transparent bg-transparent rounded-none"
                    data-testid="tab-for-you"
                  >
                    For You
                  </TabsTrigger>
                  <TabsTrigger 
                    value="following" 
                    className="px-4 py-2 text-medium-gray font-medium border-b-2 border-transparent data-[state=active]:border-terracotta data-[state=active]:bg-transparent bg-transparent rounded-none hover:text-charcoal"
                    data-testid="tab-following"
                  >
                    Following
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trending" 
                    className="px-4 py-2 text-medium-gray font-medium border-b-2 border-transparent data-[state=active]:border-terracotta data-[state=active]:bg-transparent bg-transparent rounded-none hover:text-charcoal"
                    data-testid="tab-trending"
                  >
                    Trending
                  </TabsTrigger>
                </TabsList>
                
                {/* Product Post Creation */}
                <div className="border-b border-cream p-6 bg-white mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                        data-testid="button-create-product"
                      >
                        <Plus className="mr-2" size={20} />
                        What are you selling today?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Post a Product</DialogTitle>
                      </DialogHeader>
                      <ProductForm />
                    </DialogContent>
                  </Dialog>
                </div>

                <TabsContent value="for-you" className="mt-0">
                  <div className="custom-scrollbar">
                    {productsLoading ? (
                      <div className="space-y-6 p-6">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-white p-6 rounded-xl animate-pulse" data-testid={`skeleton-product-${i}`}>
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-cream rounded-full"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-cream rounded w-24"></div>
                                <div className="h-3 bg-cream rounded w-16"></div>
                              </div>
                            </div>
                            <div className="h-4 bg-cream rounded mb-2"></div>
                            <div className="h-32 bg-cream rounded mb-4"></div>
                            <div className="h-12 bg-cream rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {products.map((product: any) => (
                          <ProductPost key={product.id} product={product} />
                        ))}
                        {products.length === 0 && (
                          <div className="text-center py-12" data-testid="text-no-products">
                            <p className="text-medium-gray">No products yet. Be the first to post!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="following" className="mt-0">
                  <div className="custom-scrollbar">
                    <div className="text-center py-12" data-testid="text-following-empty">
                      <p className="text-medium-gray">Follow some users to see their products here</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trending" className="mt-0">
                  <div className="custom-scrollbar">
                    <div className="space-y-0">
                      {recommendedProducts.map((product: any) => (
                        <ProductPost key={product.id} product={product} />
                      ))}
                      {recommendedProducts.length === 0 && (
                        <div className="text-center py-12" data-testid="text-no-trending">
                          <p className="text-medium-gray">No trending products yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
