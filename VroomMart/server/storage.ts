import {
  users,
  products,
  vrooms,
  follows,
  vroomFollows,
  productLikes,
  productBookmarks,
  comments,
  cartItems,
  orders,
  messages,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Vroom,
  type InsertVroom,
  type Comment,
  type InsertComment,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type Message,
  type InsertMessage,
  type Follow,
  type VroomFollow,
  type ProductLike,
  type ProductBookmark,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ilike, inArray, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserStats(userId: string): Promise<void>;

  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(limit?: number, offset?: number): Promise<Product[]>;
  getProductsByUser(userId: string): Promise<Product[]>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string, hashtags?: string[]): Promise<Product[]>;
  getTrendingProducts(limit?: number): Promise<Product[]>;
  incrementProductViews(productId: string): Promise<void>;
  getProductWithUser(id: string): Promise<(Product & { user: User }) | undefined>;

  // Vroom operations
  createVroom(vroom: InsertVroom): Promise<Vroom>;
  getVroom(id: string): Promise<Vroom | undefined>;
  getVroomsByUser(userId: string): Promise<Vroom[]>;
  getVroomWithProducts(id: string): Promise<(Vroom & { products: Product[], user: User }) | undefined>;
  updateVroom(id: string, vroom: Partial<InsertVroom>): Promise<Vroom | undefined>;
  getTrendingVrooms(limit?: number): Promise<Vroom[]>;

  // Social operations
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowingUser(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;

  followVroom(userId: string, vroomId: string): Promise<VroomFollow>;
  unfollowVroom(userId: string, vroomId: string): Promise<void>;
  isFollowingVroom(userId: string, vroomId: string): Promise<boolean>;

  likeProduct(userId: string, productId: string): Promise<ProductLike>;
  unlikeProduct(userId: string, productId: string): Promise<void>;
  isProductLiked(userId: string, productId: string): Promise<boolean>;

  bookmarkProduct(userId: string, productId: string): Promise<ProductBookmark>;
  unbookmarkProduct(userId: string, productId: string): Promise<void>;
  getUserBookmarks(userId: string): Promise<Product[]>;

  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getProductComments(productId: string): Promise<Comment[]>;
  getCommentReplies(commentId: string): Promise<Comment[]>;

  // Cart operations
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  getCartItems(userId: string): Promise<(CartItem & { product: Product & { user: User } })[]>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<(Order & { buyer: User, seller: User, product: Product }) | undefined>;
  getUserOrders(userId: string, type: 'buyer' | 'seller'): Promise<(Order & { buyer: User, seller: User, product: Product })[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Message operations
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<(Message & { sender: User, receiver: User })[]>;
  getUserConversations(userId: string): Promise<{ user: User, lastMessage: Message, unreadCount: number }[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  markConversationAsRead(userId: string, otherUserId: string): Promise<void>;

  // Analytics
  getTrendingHashtags(limit?: number): Promise<{ hashtag: string, count: number }[]>;
  getRecommendedProducts(userId: string, limit?: number): Promise<Product[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async updateUserStats(userId: string): Promise<void> {
    const followersCount = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    
    const followingCount = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    await db
      .update(users)
      .set({
        followersCount: followersCount[0].count,
        followingCount: followingCount[0].count,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProducts(limit = 20, offset = 0): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.isAvailable, true))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.isAvailable, true)))
      .orderBy(desc(products.createdAt));
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(query: string, hashtags?: string[]): Promise<Product[]> {
    let conditions = and(
      eq(products.isAvailable, true),
      or(
        ilike(products.title, `%${query}%`),
        ilike(products.description, `%${query}%`)
      )
    );

    if (hashtags && hashtags.length > 0) {
      conditions = and(
        conditions,
        sql`${products.hashtags} && ${hashtags}`
      );
    }

    return db
      .select()
      .from(products)
      .where(conditions)
      .orderBy(desc(products.createdAt));
  }

  async getTrendingProducts(limit = 10): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.isAvailable, true))
      .orderBy(desc(products.likesCount), desc(products.viewsCount))
      .limit(limit);
  }

  async incrementProductViews(productId: string): Promise<void> {
    await db
      .update(products)
      .set({ viewsCount: sql`${products.viewsCount} + 1` })
      .where(eq(products.id, productId));
  }

  async getProductWithUser(id: string): Promise<(Product & { user: User }) | undefined> {
    const result = await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.userId, users.id))
      .where(eq(products.id, id));

    if (result.length === 0) return undefined;

    const { products: product, users: user } = result[0];
    return { ...product, user: user! };
  }

  // Vroom operations
  async createVroom(vroom: InsertVroom): Promise<Vroom> {
    const [newVroom] = await db.insert(vrooms).values(vroom).returning();
    return newVroom;
  }

  async getVroom(id: string): Promise<Vroom | undefined> {
    const [vroom] = await db.select().from(vrooms).where(eq(vrooms.id, id));
    return vroom;
  }

  async getVroomsByUser(userId: string): Promise<Vroom[]> {
    return db
      .select()
      .from(vrooms)
      .where(and(eq(vrooms.userId, userId), eq(vrooms.isActive, true)))
      .orderBy(desc(vrooms.createdAt));
  }

  async getVroomWithProducts(id: string): Promise<(Vroom & { products: Product[], user: User }) | undefined> {
    const vroomResult = await db
      .select()
      .from(vrooms)
      .leftJoin(users, eq(vrooms.userId, users.id))
      .where(eq(vrooms.id, id));

    if (vroomResult.length === 0) return undefined;

    const { vrooms: vroom, users: user } = vroomResult[0];

    const vroomProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.userId, vroom!.userId), eq(products.isAvailable, true)))
      .orderBy(desc(products.createdAt));

    return { ...vroom!, user: user!, products: vroomProducts };
  }

  async updateVroom(id: string, vroomData: Partial<InsertVroom>): Promise<Vroom | undefined> {
    const [vroom] = await db
      .update(vrooms)
      .set({ ...vroomData, updatedAt: new Date() })
      .where(eq(vrooms.id, id))
      .returning();
    return vroom;
  }

  async getTrendingVrooms(limit = 10): Promise<Vroom[]> {
    return db
      .select()
      .from(vrooms)
      .where(eq(vrooms.isActive, true))
      .orderBy(desc(vrooms.followersCount), desc(vrooms.viewsCount))
      .limit(limit);
  }

  // Social operations
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db.insert(follows).values({ followerId, followingId }).returning();
    await this.updateUserStats(followerId);
    await this.updateUserStats(followingId);
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    await this.updateUserStats(followerId);
    await this.updateUserStats(followingId);
  }

  async isFollowingUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return result.length > 0;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result.map(r => r.user!);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result.map(r => r.user!);
  }

  async followVroom(userId: string, vroomId: string): Promise<VroomFollow> {
    const [follow] = await db.insert(vroomFollows).values({ userId, vroomId }).returning();
    await db
      .update(vrooms)
      .set({ followersCount: sql`${vrooms.followersCount} + 1` })
      .where(eq(vrooms.id, vroomId));
    return follow;
  }

  async unfollowVroom(userId: string, vroomId: string): Promise<void> {
    await db.delete(vroomFollows).where(and(eq(vroomFollows.userId, userId), eq(vroomFollows.vroomId, vroomId)));
    await db
      .update(vrooms)
      .set({ followersCount: sql`${vrooms.followersCount} - 1` })
      .where(eq(vrooms.id, vroomId));
  }

  async isFollowingVroom(userId: string, vroomId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(vroomFollows)
      .where(and(eq(vroomFollows.userId, userId), eq(vroomFollows.vroomId, vroomId)));
    return result.length > 0;
  }

  async likeProduct(userId: string, productId: string): Promise<ProductLike> {
    const [like] = await db.insert(productLikes).values({ userId, productId }).returning();
    await db
      .update(products)
      .set({ likesCount: sql`${products.likesCount} + 1` })
      .where(eq(products.id, productId));
    return like;
  }

  async unlikeProduct(userId: string, productId: string): Promise<void> {
    await db.delete(productLikes).where(and(eq(productLikes.userId, userId), eq(productLikes.productId, productId)));
    await db
      .update(products)
      .set({ likesCount: sql`${products.likesCount} - 1` })
      .where(eq(products.id, productId));
  }

  async isProductLiked(userId: string, productId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(productLikes)
      .where(and(eq(productLikes.userId, userId), eq(productLikes.productId, productId)));
    return result.length > 0;
  }

  async bookmarkProduct(userId: string, productId: string): Promise<ProductBookmark> {
    const [bookmark] = await db.insert(productBookmarks).values({ userId, productId }).returning();
    return bookmark;
  }

  async unbookmarkProduct(userId: string, productId: string): Promise<void> {
    await db.delete(productBookmarks).where(and(eq(productBookmarks.userId, userId), eq(productBookmarks.productId, productId)));
  }

  async getUserBookmarks(userId: string): Promise<Product[]> {
    const result = await db
      .select({ product: products })
      .from(productBookmarks)
      .leftJoin(products, eq(productBookmarks.productId, products.id))
      .where(eq(productBookmarks.userId, userId))
      .orderBy(desc(productBookmarks.createdAt));
    return result.map(r => r.product!);
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    await db
      .update(products)
      .set({ commentsCount: sql`${products.commentsCount} + 1` })
      .where(eq(products.id, comment.productId));
    return newComment;
  }

  async getProductComments(productId: string): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(and(eq(comments.productId, productId), sql`${comments.parentId} IS NULL`))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentReplies(commentId: string): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.parentId, commentId))
      .orderBy(asc(comments.createdAt));
  }

  // Cart operations
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, cartItem.userId), eq(cartItems.productId, cartItem.productId)));

    if (existingItem) {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity: existingItem.quantity + (cartItem.quantity || 1),
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }

    const [newItem] = await db.insert(cartItems).values(cartItem).returning();
    return newItem;
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product & { user: User } })[]> {
    const result = await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(users, eq(products.userId, users.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));

    return result.map(r => ({
      ...r.cart_items!,
      product: { ...r.products!, user: r.users! }
    }));
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [item] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return item;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: string): Promise<(Order & { buyer: User, seller: User, product: Product }) | undefined> {
    const result = await db
      .select()
      .from(orders)
      .leftJoin(users, eq(orders.buyerId, users.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, id));

    if (result.length === 0) return undefined;

    const { orders: order, users: buyer, products: product } = result[0];
    
    const [seller] = await db.select().from(users).where(eq(users.id, order!.sellerId));

    return {
      ...order!,
      buyer: buyer!,
      seller: seller!,
      product: product!
    };
  }

  async getUserOrders(userId: string, type: 'buyer' | 'seller'): Promise<(Order & { buyer: User, seller: User, product: Product })[]> {
    const condition = type === 'buyer' ? eq(orders.buyerId, userId) : eq(orders.sellerId, userId);
    
    const result = await db
      .select()
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(condition)
      .orderBy(desc(orders.createdAt));

    const ordersWithUsers = await Promise.all(
      result.map(async (r) => {
        const [buyer] = await db.select().from(users).where(eq(users.id, r.orders!.buyerId));
        const [seller] = await db.select().from(users).where(eq(users.id, r.orders!.sellerId));
        
        return {
          ...r.orders!,
          buyer: buyer!,
          seller: seller!,
          product: r.products!
        };
      })
    );

    return ordersWithUsers;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Message operations
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversation(userId1: string, userId2: string): Promise<(Message & { sender: User, receiver: User })[]> {
    const result = await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));

    return Promise.all(
      result.map(async (r) => {
        const [receiver] = await db.select().from(users).where(eq(users.id, r.messages!.receiverId));
        return {
          ...r.messages!,
          sender: r.users!,
          receiver: receiver!
        };
      })
    );
  }

  async getUserConversations(userId: string): Promise<{ user: User, lastMessage: Message, unreadCount: number }[]> {
    // This is a simplified implementation - in production you'd want to optimize this query
    const conversations = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<string, { user: User, lastMessage: Message, unreadCount: number }>();

    for (const message of conversations) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
        const unreadCount = await db
          .select({ count: count() })
          .from(messages)
          .where(and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          ));

        conversationMap.set(otherUserId, {
          user: otherUser!,
          lastMessage: message,
          unreadCount: unreadCount[0].count
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId)));
  }

  // Analytics
  async getTrendingHashtags(limit = 10): Promise<{ hashtag: string, count: number }[]> {
    // This is a simplified implementation - in production you'd want to use proper full-text search
    const productsWithHashtags = await db
      .select({ hashtags: products.hashtags })
      .from(products)
      .where(eq(products.isAvailable, true));

    const hashtagCount = new Map<string, number>();

    for (const product of productsWithHashtags) {
      if (product.hashtags) {
        for (const hashtag of product.hashtags) {
          const count = hashtagCount.get(hashtag) || 0;
          hashtagCount.set(hashtag, count + 1);
        }
      }
    }

    return Array.from(hashtagCount.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getRecommendedProducts(userId: string, limit = 10): Promise<Product[]> {
    // Simple recommendation based on user's likes and bookmarks
    const userInteractions = await db
      .select({ productId: productLikes.productId })
      .from(productLikes)
      .where(eq(productLikes.userId, userId));

    const bookmarks = await db
      .select({ productId: productBookmarks.productId })
      .from(productBookmarks)
      .where(eq(productBookmarks.userId, userId));

    const interactedProductIds = [
      ...userInteractions.map(i => i.productId),
      ...bookmarks.map(b => b.productId)
    ];

    if (interactedProductIds.length === 0) {
      return this.getTrendingProducts(limit);
    }

    // Get hashtags from interacted products
    const interactedProducts = await db
      .select({ hashtags: products.hashtags })
      .from(products)
      .where(inArray(products.id, interactedProductIds));

    const userHashtags = new Set<string>();
    for (const product of interactedProducts) {
      if (product.hashtags) {
        product.hashtags.forEach(tag => userHashtags.add(tag));
      }
    }

    if (userHashtags.size === 0) {
      return this.getTrendingProducts(limit);
    }

    // Find products with similar hashtags
    const recommendedProducts = await db
      .select()
      .from(products)
      .where(and(
        eq(products.isAvailable, true),
        sql`${products.hashtags} && ${Array.from(userHashtags)}`
      ))
      .orderBy(desc(products.likesCount))
      .limit(limit);

    return recommendedProducts;
  }
}

export const storage = new DatabaseStorage();
