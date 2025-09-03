import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  location: varchar("location"),
  website: varchar("website"),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  imageUrls: text("image_urls").array(),
  hashtags: text("hashtags").array(),
  category: varchar("category"),
  stock: integer("stock").default(1),
  isAvailable: boolean("is_available").default(true),
  likesCount: integer("likes_count").default(0),
  sharesCount: integer("shares_count").default(0),
  commentsCount: integer("comments_count").default(0),
  viewsCount: integer("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vrooms (user storefronts)
export const vrooms = pgTable("vrooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bannerImageUrl: varchar("banner_image_url"),
  followersCount: integer("followers_count").default(0),
  viewsCount: integer("views_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Follows (users following other users)
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: varchar("following_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vroom follows
export const vroomFollows = pgTable("vroom_follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vroomId: uuid("vroom_id").references(() => vrooms.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product likes
export const productLikes = pgTable("product_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product bookmarks
export const productBookmarks = pgTable("product_bookmarks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id").references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping cart
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sellerId: varchar("seller_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default('pending'), // pending, confirmed, shipped, delivered, cancelled
  paymentMethod: varchar("payment_method").default('pay_on_delivery'),
  shippingAddress: jsonb("shipping_address"), // {country, town, street, details}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: 'cascade' }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  vrooms: many(vrooms),
  followers: many(follows, { relationName: "UserFollowers" }),
  following: many(follows, { relationName: "UserFollowing" }),
  vroomFollows: many(vroomFollows),
  productLikes: many(productLikes),
  productBookmarks: many(productBookmarks),
  comments: many(comments),
  cartItems: many(cartItems),
  ordersAsBuyer: many(orders, { relationName: "OrderBuyer" }),
  ordersAsSeller: many(orders, { relationName: "OrderSeller" }),
  sentMessages: many(messages, { relationName: "MessageSender" }),
  receivedMessages: many(messages, { relationName: "MessageReceiver" }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  likes: many(productLikes),
  bookmarks: many(productBookmarks),
  comments: many(comments),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const vroomsRelations = relations(vrooms, ({ one, many }) => ({
  user: one(users, {
    fields: [vrooms.userId],
    references: [users.id],
  }),
  followers: many(vroomFollows),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "UserFollowers",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "UserFollowing",
  }),
}));

export const vroomFollowsRelations = relations(vroomFollows, ({ one }) => ({
  user: one(users, {
    fields: [vroomFollows.userId],
    references: [users.id],
  }),
  vroom: one(vrooms, {
    fields: [vroomFollows.vroomId],
    references: [vrooms.id],
  }),
}));

export const productLikesRelations = relations(productLikes, ({ one }) => ({
  user: one(users, {
    fields: [productLikes.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productLikes.productId],
    references: [products.id],
  }),
}));

export const productBookmarksRelations = relations(productBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [productBookmarks.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productBookmarks.productId],
    references: [products.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [comments.productId],
    references: [products.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: "OrderBuyer",
  }),
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
    relationName: "OrderSeller",
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "MessageSender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "MessageReceiver",
  }),
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  likesCount: true,
  sharesCount: true,
  commentsCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVroomSchema = createInsertSchema(vrooms).omit({
  id: true,
  followersCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Vroom = typeof vrooms.$inferSelect;
export type InsertVroom = z.infer<typeof insertVroomSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Follow = typeof follows.$inferSelect;
export type VroomFollow = typeof vroomFollows.$inferSelect;
export type ProductLike = typeof productLikes.$inferSelect;
export type ProductBookmark = typeof productBookmarks.$inferSelect;
