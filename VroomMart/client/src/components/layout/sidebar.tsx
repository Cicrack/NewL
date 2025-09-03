import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProductForm from "@/components/product/product-form";
import { 
  Home, 
  Search, 
  TrendingUp, 
  Store, 
  ShoppingCart, 
  MessageCircle, 
  Bookmark, 
  User, 
  Plus,
  ShoppingBag,
  MoreHorizontal,
  LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
    retry: false,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    retry: false,
  });

  const cartItemCount = cartItems.length;
  const unreadCount = conversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);

  const navigationItems = [
    { 
      icon: Home, 
      label: "Home", 
      href: "/", 
      active: location === "/" 
    },
    { 
      icon: Search, 
      label: "Explore", 
      href: "/explore", 
      active: location === "/explore" 
    },
    { 
      icon: TrendingUp, 
      label: "Trending", 
      href: "/trending", 
      active: location === "/trending" 
    },
    { 
      icon: Store, 
      label: "My Vroom", 
      href: `/profile/${user?.id}?tab=vrooms`, 
      active: location.includes("/profile") && location.includes("vrooms") 
    },
    { 
      icon: ShoppingCart, 
      label: "Cart", 
      href: "/cart", 
      active: location === "/cart",
      badge: cartItemCount > 0 ? cartItemCount.toString() : undefined
    },
    { 
      icon: MessageCircle, 
      label: "Messages", 
      href: "/messages", 
      active: location === "/messages",
      notification: unreadCount > 0
    },
    { 
      icon: Bookmark, 
      label: "Bookmarks", 
      href: `/profile/${user?.id}?tab=bookmarks`, 
      active: location.includes("/profile") && location.includes("bookmarks") 
    },
    { 
      icon: User, 
      label: "Profile", 
      href: `/profile/${user?.id}`, 
      active: location.includes("/profile") && !location.includes("tab=") 
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-cream fixed h-full custom-scrollbar overflow-y-auto z-50">
      <div className="p-6">
        {/* Logo */}
        <Link href="/" className="flex items-center mb-8 group">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center mr-3 group-hover:opacity-90 transition-opacity">
            <ShoppingBag className="text-white text-lg" size={20} />
          </div>
          <h1 className="text-xl font-bold text-charcoal group-hover:text-terracotta transition-colors" data-testid="text-logo">
            Eldady
          </h1>
        </Link>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={`flex items-center px-4 py-3 rounded-xl transition-colors relative ${
                  item.active 
                    ? 'text-charcoal bg-cream' 
                    : 'text-medium-gray hover:bg-cream hover:text-charcoal'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon size={20} className="w-6" />
                <span className="ml-4 font-medium">{item.label}</span>
                {item.badge && (
                  <Badge 
                    className="ml-auto bg-coral text-white text-xs"
                    data-testid={`badge-${item.label.toLowerCase()}`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.notification && (
                  <span 
                    className="ml-auto w-2 h-2 bg-coral rounded-full chat-bubble"
                    data-testid={`notification-${item.label.toLowerCase()}`}
                  ></span>
                )}
              </a>
            </Link>
          ))}
        </nav>

        {/* Post Product Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="w-full mt-6 gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
              data-testid="button-post-product"
            >
              <Plus className="mr-2" size={20} />
              Post Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Post a Product</DialogTitle>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>

        {/* User Profile */}
        {user && (
          <div className="mt-8 p-4 bg-cream rounded-xl">
            <div className="flex items-center">
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={user.profileImageUrl} 
                  alt={user.firstName}
                  data-testid="img-user-avatar"
                />
                <AvatarFallback>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 min-w-0">
                <p className="font-medium text-charcoal truncate" data-testid="text-user-name">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-medium-gray truncate" data-testid="text-user-username">
                  {user.username ? `@${user.username}` : user.email}
                </p>
              </div>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-medium-gray hover:text-charcoal p-2"
                  data-testid="button-user-menu"
                >
                  <MoreHorizontal size={16} />
                </Button>
                {/* TODO: Add dropdown menu for user actions */}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-medium-gray hover:text-coral hover:bg-white"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="mr-2" size={16} />
              Logout
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
