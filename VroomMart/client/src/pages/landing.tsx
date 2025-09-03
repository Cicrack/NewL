import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, MessageCircle, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="text-white text-3xl" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">Eldady</h1>
          <p className="text-medium-gray text-lg">Social Commerce Platform</p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center mx-auto mb-2">
              <Heart className="text-terracotta" size={24} />
            </div>
            <p className="text-sm text-medium-gray">Social Shopping</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="text-coral" size={24} />
            </div>
            <p className="text-sm text-medium-gray">Connect & Chat</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="text-terracotta" size={24} />
            </div>
            <p className="text-sm text-medium-gray">Create Vrooms</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="text-coral" size={24} />
            </div>
            <p className="text-sm text-medium-gray">Trending Products</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl border border-cream shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-charcoal">Welcome to Eldady</CardTitle>
            <p className="text-medium-gray text-sm mt-2">
              Discover amazing products and connect with sellers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Sign In / Sign Up
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-medium-gray">
                By continuing, you agree to our terms and privacy policy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Browse as Guest */}
        <div className="text-center mt-6">
          <p className="text-medium-gray text-sm mb-2">Want to explore first?</p>
          <Button 
            variant="ghost" 
            className="text-terracotta hover:text-coral hover:bg-cream rounded-xl"
            data-testid="button-browse-guest"
          >
            Browse as Guest
          </Button>
        </div>
      </div>
    </div>
  );
}
