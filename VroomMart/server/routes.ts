import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertProductSchema, insertVroomSchema, insertCommentSchema, insertOrderSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Product routes
  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productData = insertProductSchema.parse({ ...req.body, userId });
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const products = await storage.getProducts(limit, offset);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getTrendingProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching trending products:", error);
      res.status(500).json({ message: "Failed to fetch trending products" });
    }
  });

  app.get('/api/products/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const hashtags = req.query.hashtags ? (req.query.hashtags as string).split(',') : undefined;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const products = await storage.searchProducts(query, hashtags);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get('/api/products/recommended', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getRecommendedProducts(userId, limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching recommended products:", error);
      res.status(500).json({ message: "Failed to fetch recommended products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await storage.getProductWithUser(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Increment view count
      await storage.incrementProductViews(productId);
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;
      
      // Check if user owns the product
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct || existingProduct.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;
      
      // Check if user owns the product
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct || existingProduct.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Vroom routes
  app.post('/api/vrooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vroomData = insertVroomSchema.parse({ ...req.body, userId });
      const vroom = await storage.createVroom(vroomData);
      res.status(201).json(vroom);
    } catch (error) {
      console.error("Error creating vroom:", error);
      res.status(400).json({ message: "Failed to create vroom" });
    }
  });

  app.get('/api/vrooms/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const vrooms = await storage.getTrendingVrooms(limit);
      res.json(vrooms);
    } catch (error) {
      console.error("Error fetching trending vrooms:", error);
      res.status(500).json({ message: "Failed to fetch trending vrooms" });
    }
  });

  app.get('/api/vrooms/:id', async (req, res) => {
    try {
      const vroomId = req.params.id;
      const vroom = await storage.getVroomWithProducts(vroomId);
      
      if (!vroom) {
        return res.status(404).json({ message: "Vroom not found" });
      }

      res.json(vroom);
    } catch (error) {
      console.error("Error fetching vroom:", error);
      res.status(500).json({ message: "Failed to fetch vroom" });
    }
  });

  app.get('/api/users/:id/vrooms', async (req, res) => {
    try {
      const userId = req.params.id;
      const vrooms = await storage.getVroomsByUser(userId);
      res.json(vrooms);
    } catch (error) {
      console.error("Error fetching user vrooms:", error);
      res.status(500).json({ message: "Failed to fetch user vrooms" });
    }
  });

  // Social interaction routes
  app.post('/api/users/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;

      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;

      await storage.unfollowUser(followerId, followingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/:id/follow-status', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;

      const isFollowing = await storage.isFollowingUser(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.post('/api/vrooms/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vroomId = req.params.id;

      const follow = await storage.followVroom(userId, vroomId);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following vroom:", error);
      res.status(500).json({ message: "Failed to follow vroom" });
    }
  });

  app.delete('/api/vrooms/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vroomId = req.params.id;

      await storage.unfollowVroom(userId, vroomId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing vroom:", error);
      res.status(500).json({ message: "Failed to unfollow vroom" });
    }
  });

  app.post('/api/products/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;

      const like = await storage.likeProduct(userId, productId);
      res.status(201).json(like);
    } catch (error) {
      console.error("Error liking product:", error);
      res.status(500).json({ message: "Failed to like product" });
    }
  });

  app.delete('/api/products/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;

      await storage.unlikeProduct(userId, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unliking product:", error);
      res.status(500).json({ message: "Failed to unlike product" });
    }
  });

  app.get('/api/products/:id/like-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;

      const isLiked = await storage.isProductLiked(userId, productId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  app.post('/api/products/:id/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;

      const bookmark = await storage.bookmarkProduct(userId, productId);
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error bookmarking product:", error);
      res.status(500).json({ message: "Failed to bookmark product" });
    }
  });

  app.delete('/api/products/:id/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;

      await storage.unbookmarkProduct(userId, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unbookmarking product:", error);
      res.status(500).json({ message: "Failed to unbookmark product" });
    }
  });

  app.get('/api/users/me/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Comment routes
  app.post('/api/products/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.id;
      const commentData = insertCommentSchema.parse({ ...req.body, userId, productId });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/products/:id/comments', async (req, res) => {
    try {
      const productId = req.params.id;
      const comments = await storage.getProductComments(productId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get('/api/comments/:id/replies', async (req, res) => {
    try {
      const commentId = req.params.id;
      const replies = await storage.getCommentReplies(commentId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  // Cart routes
  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartData = { userId, productId: req.body.productId, quantity: req.body.quantity || 1 };
      
      const cartItem = await storage.addToCart(cartData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add to cart" });
    }
  });

  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.put('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const cartItemId = req.params.id;
      const { quantity } = req.body;
      
      const cartItem = await storage.updateCartItem(cartItemId, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const cartItemId = req.params.id;
      await storage.removeFromCart(cartItemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const buyerId = req.user.claims.sub;
      const orderData = insertOrderSchema.parse({ ...req.body, buyerId });
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as 'buyer' | 'seller' || 'buyer';
      
      const orders = await storage.getUserOrders(userId, type);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      
      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      
      const conversation = await storage.getConversation(currentUserId, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/conversations/:userId/read', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      
      await storage.markConversationAsRead(currentUserId, otherUserId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });

  // Analytics routes
  app.get('/api/hashtags/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const hashtags = await storage.getTrendingHashtags(limit);
      res.json(hashtags);
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
      res.status(500).json({ message: "Failed to fetch trending hashtags" });
    }
  });

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:id/products', async (req, res) => {
    try {
      const userId = req.params.id;
      const products = await storage.getProductsByUser(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching user products:", error);
      res.status(500).json({ message: "Failed to fetch user products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
