import { useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import RightSidebar from "@/components/layout/right-sidebar";
import ProductGrid from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, MapPin, Link as LinkIcon, Calendar, Heart, MessageCircle, Store, Edit3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const vroomFormSchema = z.object({
  name: z.string().min(1, "Vroom name is required"),
  description: z.string().optional(),
  bannerImageUrl: z.string().url().optional().or(z.literal("")),
});

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userId = id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?.id;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", userId],
    enabled: !!userId && userId !== currentUser?.id,
    retry: false,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/users", userId, "products"],
    enabled: !!userId,
    retry: false,
  });

  const { data: vrooms = [], isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/users", userId, "vrooms"],
    enabled: !!userId,
    retry: false,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/users/me/bookmarks"],
    enabled: isOwnProfile && !!currentUser,
    retry: false,
  });

  const { data: followStatus } = useQuery({
    queryKey: ["/api/users", userId, "follow-status"],
    enabled: !isOwnProfile && !!userId && !!currentUser,
    retry: false,
  });

  const profileData = isOwnProfile ? currentUser : user;

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "follow-status"] });
      toast({
        title: "Success",
        description: "User followed successfully",
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
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "follow-status"] });
      toast({
        title: "Success",
        description: "User unfollowed successfully",
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
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const createVroomMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vroomFormSchema>) => {
      await apiRequest("POST", "/api/vrooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "vrooms"] });
      toast({
        title: "Success",
        description: "Vroom created successfully",
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
        description: "Failed to create vroom",
        variant: "destructive",
      });
    },
  });

  const vroomForm = useForm<z.infer<typeof vroomFormSchema>>({
    resolver: zodResolver(vroomFormSchema),
    defaultValues: {
      name: "",
      description: "",
      bannerImageUrl: "",
    },
  });

  const onSubmitVroom = (values: z.infer<typeof vroomFormSchema>) => {
    createVroomMutation.mutate(values);
  };

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 gradient-bg rounded-xl animate-pulse mx-auto mb-4"></div>
          <p className="text-medium-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex min-h-screen bg-warm-white">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-medium-gray text-lg">User not found</p>
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
            {/* Profile Header */}
            <div className="bg-white border-b border-cream">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-24 h-24 border-4 border-white">
                      <AvatarImage 
                        src={profileData.profileImageUrl} 
                        alt={profileData.firstName}
                        data-testid="img-user-avatar"
                      />
                      <AvatarFallback className="text-2xl">
                        {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-bold text-charcoal" data-testid="text-user-name">
                        {profileData.firstName} {profileData.lastName}
                      </h1>
                      {profileData.username && (
                        <p className="text-medium-gray" data-testid="text-username">
                          @{profileData.username}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isOwnProfile ? (
                    <Button 
                      variant="outline" 
                      className="border-cream hover:bg-cream text-charcoal"
                      data-testid="button-edit-profile"
                    >
                      <Edit3 className="mr-2" size={16} />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          if (followStatus?.isFollowing) {
                            unfollowMutation.mutate();
                          } else {
                            followMutation.mutate();
                          }
                        }}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                        className={followStatus?.isFollowing ? 
                          "border border-coral text-coral hover:bg-coral hover:text-white" : 
                          "gradient-bg text-white hover:opacity-90"
                        }
                        data-testid="button-follow-user"
                      >
                        {followStatus?.isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-cream hover:bg-cream text-charcoal"
                        data-testid="button-message-user"
                      >
                        <MessageCircle className="mr-2" size={16} />
                        Message
                      </Button>
                    </div>
                  )}
                </div>

                {profileData.bio && (
                  <p className="text-charcoal mb-4" data-testid="text-user-bio">
                    {profileData.bio}
                  </p>
                )}

                {/* User Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-medium-gray mb-4">
                  {profileData.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin size={16} />
                      <span data-testid="text-user-location">{profileData.location}</span>
                    </div>
                  )}
                  {profileData.website && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon size={16} />
                      <a 
                        href={profileData.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-terracotta hover:underline"
                        data-testid="link-user-website"
                      >
                        {profileData.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span data-testid="text-join-date">
                      Joined {new Date(profileData.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-charcoal" data-testid="text-following-count">
                      {profileData.followingCount || 0}
                    </span>
                    <span className="text-medium-gray">Following</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-charcoal" data-testid="text-followers-count">
                      {profileData.followersCount || 0}
                    </span>
                    <span className="text-medium-gray">Followers</span>
                  </div>
                  <Badge variant="secondary" data-testid="badge-products-count">
                    {products.length} products
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full justify-start bg-white border-b border-cream rounded-none h-auto p-0">
                <TabsTrigger 
                  value="products" 
                  className="px-6 py-4 text-charcoal font-medium border-b-2 border-transparent data-[state=active]:border-terracotta data-[state=active]:bg-transparent bg-transparent rounded-none"
                  data-testid="tab-products"
                >
                  Products
                </TabsTrigger>
                <TabsTrigger 
                  value="vrooms" 
                  className="px-6 py-4 text-medium-gray font-medium border-b-2 border-transparent data-[state=active]:border-terracotta data-[state=active]:bg-transparent bg-transparent rounded-none hover:text-charcoal"
                  data-testid="tab-vrooms"
                >
                  Vrooms
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger 
                    value="bookmarks" 
                    className="px-6 py-4 text-medium-gray font-medium border-b-2 border-transparent data-[state=active]:border-terracotta data-[state=active]:bg-transparent bg-transparent rounded-none hover:text-charcoal"
                    data-testid="tab-bookmarks"
                  >
                    Bookmarks
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="products" className="mt-0 p-6">
                {productsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-cream rounded-xl h-64 animate-pulse" data-testid={`skeleton-product-${i}`}></div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <ProductGrid products={products} />
                ) : (
                  <div className="text-center py-12" data-testid="text-no-products">
                    <Store className="mx-auto text-medium-gray mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      {isOwnProfile ? "You haven't posted any products yet" : "No products posted yet"}
                    </h3>
                    <p className="text-medium-gray">
                      {isOwnProfile ? "Start selling by creating your first product post" : "Check back later for new products"}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vrooms" className="mt-0 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-charcoal" data-testid="text-vrooms-title">Vrooms</h2>
                  {isOwnProfile && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="gradient-bg text-white px-4 py-2 rounded-xl font-semibold hover:opacity-90"
                          data-testid="button-create-vroom"
                        >
                          Create Vroom
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New Vroom</DialogTitle>
                        </DialogHeader>
                        <Form {...vroomForm}>
                          <form onSubmit={vroomForm.handleSubmit(onSubmitVroom)} className="space-y-4">
                            <FormField
                              control={vroomForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vroom Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="My Amazing Store" {...field} data-testid="input-vroom-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={vroomForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Describe your vroom..." {...field} data-testid="textarea-vroom-description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={vroomForm.control}
                              name="bannerImageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Banner Image URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://..." {...field} data-testid="input-banner-url" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              className="w-full gradient-bg text-white py-2 rounded-xl font-semibold hover:opacity-90"
                              disabled={createVroomMutation.isPending}
                              data-testid="button-submit-vroom"
                            >
                              {createVroomMutation.isPending ? "Creating..." : "Create Vroom"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {vroomsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-cream rounded-xl h-32 animate-pulse" data-testid={`skeleton-vroom-${i}`}></div>
                    ))}
                  </div>
                ) : vrooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vrooms.map((vroom: any) => (
                      <div 
                        key={vroom.id} 
                        className="bg-white border border-cream rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => window.location.href = `/vroom/${vroom.id}`}
                        data-testid={`vroom-card-${vroom.id}`}
                      >
                        <h3 className="font-semibold text-charcoal mb-2" data-testid={`text-vroom-name-${vroom.id}`}>
                          {vroom.name}
                        </h3>
                        {vroom.description && (
                          <p className="text-medium-gray text-sm mb-3" data-testid={`text-vroom-description-${vroom.id}`}>
                            {vroom.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-medium-gray">
                              <Users size={16} className="inline mr-1" />
                              {vroom.followersCount || 0} followers
                            </span>
                          </div>
                          <Badge variant="secondary">{vroom.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="text-no-vrooms">
                    <Store className="mx-auto text-medium-gray mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      {isOwnProfile ? "You haven't created any Vrooms yet" : "No Vrooms created yet"}
                    </h3>
                    <p className="text-medium-gray">
                      {isOwnProfile ? "Create a Vroom to showcase your products in a dedicated storefront" : "Check back later for new Vrooms"}
                    </p>
                  </div>
                )}
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="bookmarks" className="mt-0 p-6">
                  {bookmarks.length > 0 ? (
                    <ProductGrid products={bookmarks} />
                  ) : (
                    <div className="text-center py-12" data-testid="text-no-bookmarks">
                      <Heart className="mx-auto text-medium-gray mb-4" size={64} />
                      <h3 className="text-lg font-semibold text-charcoal mb-2">No bookmarks yet</h3>
                      <p className="text-medium-gray">Bookmark products you like to save them here</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
