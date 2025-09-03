import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  ShoppingCart, 
  MoreHorizontal,
  MapPin,
  Clock,
  Hash,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProductPostProps {
  product: any;
}

export default function ProductPost({ product }: ProductPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: likeStatus } = useQuery({
    queryKey: ["/api/products", product.id, "like-status"],
    enabled: !!user,
    retry: false,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/products", product.id, "comments"],
    enabled: showComments,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (likeStatus?.isLiked) {
        await apiRequest("DELETE", `/api/products/${product.id}/like`);
      } else {
        await apiRequest("POST", `/api/products/${product.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "like-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/products/${product.id}/bookmark`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product bookmarked",
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
        description: "Failed to bookmark product",
        variant: "destructive",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", { productId: product.id, quantity: 1 });
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

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/products/${product.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setCommentText("");
      toast({
        title: "Success",
        description: "Comment posted",
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
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
      // Fallback to clipboard
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

  const handleComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true });

  return (
    <article className="border-b border-cream p-6 bg-white product-card" data-testid={`product-post-${product.id}`}>
      <div className="flex space-x-3">
        {/* User Avatar */}
        <Avatar className="w-12 h-12 cursor-pointer" onClick={() => window.location.href = `/profile/${product.userId}`}>
          <AvatarImage 
            src={product.user?.profileImageUrl} 
            alt={product.user?.firstName}
            data-testid={`img-user-avatar-${product.id}`}
          />
          <AvatarFallback>
            {product.user?.firstName?.[0]}{product.user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* Post Header */}
          <div className="flex items-center space-x-2 mb-3">
            <h4 
              className="font-semibold text-charcoal cursor-pointer hover:underline"
              onClick={() => window.location.href = `/profile/${product.userId}`}
              data-testid={`text-seller-name-${product.id}`}
            >
              {product.user?.firstName} {product.user?.lastName}
            </h4>
            <span className="text-medium-gray">
              {product.user?.username && `@${product.user.username}`}
            </span>
            <span className="text-medium-gray">·</span>
            <span className="text-medium-gray flex items-center" data-testid={`text-time-ago-${product.id}`}>
              <Clock size={12} className="mr-1" />
              {timeAgo}
            </span>
            {product.user?.id !== user?.id && (
              <Button 
                variant="ghost" 
                size="sm"
                className="ml-auto text-coral hover:text-terracotta font-semibold"
                data-testid={`button-follow-${product.id}`}
              >
                Follow
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-medium-gray hover:text-charcoal p-1"
              data-testid={`button-more-${product.id}`}
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>

          {/* Product Content */}
          <div className="mb-3">
            <h3 className="font-bold text-charcoal text-lg mb-2" data-testid={`text-product-title-${product.id}`}>
              {product.title}
            </h3>
            
            <p className="text-charcoal mb-3" data-testid={`text-product-description-${product.id}`}>
              {product.description}
            </p>

            {/* Hashtags */}
            {product.hashtags && product.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {product.hashtags.map((tag: string, index: number) => (
                  <span 
                    key={index}
                    className="text-terracotta hover:text-coral cursor-pointer flex items-center"
                    onClick={() => window.location.href = `/search?hashtags=${encodeURIComponent(tag)}`}
                    data-testid={`hashtag-${product.id}-${index}`}
                  >
                    <Hash size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Product Image */}
            {product.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-4 cursor-pointer">
                <img 
                  src={product.imageUrl} 
                  alt={product.title}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  onClick={() => window.location.href = `/product/${product.id}`}
                  data-testid={`img-product-${product.id}`}
                />
              </div>
            )}

            {/* Multiple Images Grid */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden mb-4">
                {product.imageUrls.slice(0, 4).map((url: string, index: number) => (
                  <div 
                    key={index}
                    className="relative cursor-pointer"
                    onClick={() => window.location.href = `/product/${product.id}`}
                  >
                    <img 
                      src={url} 
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                      data-testid={`img-product-gallery-${product.id}-${index}`}
                    />
                    {index === 3 && product.imageUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-semibold">
                        +{product.imageUrls.length - 4} more
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Price and Actions */}
            <div className="flex items-center justify-between bg-cream p-4 rounded-xl">
              <div>
                <span className="text-2xl font-bold text-terracotta" data-testid={`text-product-price-${product.id}`}>
                  ${product.price}
                </span>
                <span className="text-medium-gray ml-2">Free shipping</span>
                {product.stock > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {product.stock} in stock
                  </Badge>
                )}
              </div>
              <Button 
                className="gradient-bg text-white px-6 py-2 rounded-full font-semibold hover:opacity-90"
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending || product.stock === 0}
                data-testid={`button-add-to-cart-${product.id}`}
              >
                <ShoppingCart className="mr-2" size={16} />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </div>

          {/* Interaction Buttons */}
          <div className="flex items-center justify-between max-w-md">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-2 text-medium-gray hover:text-terracotta group p-2"
              onClick={() => setShowComments(!showComments)}
              data-testid={`button-comments-${product.id}`}
            >
              <div className="p-2 rounded-full group-hover:bg-cream transition-colors">
                <MessageCircle size={16} />
              </div>
              <span data-testid={`text-comments-count-${product.id}`}>{product.commentsCount || 0}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              className={`flex items-center space-x-2 group p-2 ${
                likeStatus?.isLiked ? 'text-coral' : 'text-medium-gray hover:text-coral'
              }`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              data-testid={`button-like-${product.id}`}
            >
              <div className="p-2 rounded-full group-hover:bg-cream transition-colors">
                <Heart size={16} className={likeStatus?.isLiked ? 'fill-current' : ''} />
              </div>
              <span data-testid={`text-likes-count-${product.id}`}>{product.likesCount || 0}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-2 text-medium-gray hover:text-terracotta group p-2"
              onClick={handleShare}
              data-testid={`button-share-${product.id}`}
            >
              <div className="p-2 rounded-full group-hover:bg-cream transition-colors">
                <Share size={16} />
              </div>
              <span data-testid={`text-shares-count-${product.id}`}>{product.sharesCount || 0}</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-2 text-medium-gray hover:text-terracotta group p-2"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              data-testid={`button-bookmark-${product.id}`}
            >
              <div className="p-2 rounded-full group-hover:bg-cream transition-colors">
                <Bookmark size={16} />
              </div>
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-cream">
              {/* Add Comment */}
              {user && (
                <div className="flex space-x-3 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                    <AvatarFallback className="text-sm">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="resize-none border-cream focus:border-terracotta"
                      rows={2}
                      data-testid={`textarea-comment-${product.id}`}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleComment}
                        disabled={!commentText.trim() || commentMutation.isPending}
                        className="gradient-bg text-white hover:opacity-90"
                        data-testid={`button-post-comment-${product.id}`}
                      >
                        <Send size={14} className="mr-2" />
                        {commentMutation.isPending ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3" data-testid={`comments-list-${product.id}`}>
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user?.profileImageUrl} alt={comment.user?.firstName} />
                      <AvatarFallback className="text-sm">
                        {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-cream rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm text-charcoal">
                          {comment.user?.firstName} {comment.user?.lastName}
                        </span>
                        <span className="text-xs text-medium-gray">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-medium-gray text-sm text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
