import { pgTable, text, integer, boolean, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('customer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const packages = pgTable('packages', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  packageId: varchar('package_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  price: integer('price').notNull(),
  originalPrice: integer('original_price').notNull(),
  duration: varchar('duration', { length: 100 }).notNull(),
  features: jsonb('features').notNull(),
  isPopular: boolean('is_popular').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  orderId: varchar('order_id', { length: 50 }).notNull().unique(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerWhatsapp: varchar('customer_whatsapp', { length: 50 }).notNull(),
  packageId: integer('package_id').notNull().references(() => packages.id),
  originalPrice: integer('original_price').notNull(),
  discount: integer('discount').notNull().default(0),
  finalPrice: integer('final_price').notNull(),
  promoCode: varchar('promo_code', { length: 50 }),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending'),
  paymentProof: text('payment_proof'),
  inviteStatus: varchar('invite_status', { length: 50 }).notNull().default('pending'),
  invitedAt: timestamp('invited_at'),
  invitedByCookieId: integer('invited_by_cookie_id'),
  cookieAdminEmail: varchar('cookie_admin_email', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cookies = pgTable('cookies', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  cookieName: varchar('cookie_name', { length: 255 }).notNull(),
  adminEmail: varchar('admin_email', { length: 255 }).notNull(),
  cookieData: text('cookie_data').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  lastChecked: timestamp('last_checked').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const promoCodes = pgTable('promo_codes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: varchar('discount_type', { length: 20 }).notNull(),
  discountValue: integer('discount_value').notNull(),
  maxUsage: integer('max_usage').notNull().default(0),
  currentUsage: integer('current_usage').notNull().default(0),
  validFrom: timestamp('valid_from').notNull().defaultNow(),
  validUntil: timestamp('valid_until'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const ratings = pgTable('ratings', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  orderId: varchar('order_id', { length: 50 }).notNull().unique(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerRole: varchar('customer_role', { length: 100 }),
  customerWhatsapp: varchar('customer_whatsapp', { length: 50 }),
  rating: integer('rating').notNull(),
  review: text('review'),
  isApproved: boolean('is_approved').notNull().default(false),
  voucherSent: boolean('voucher_sent').notNull().default(false),
  voucherCode: varchar('voucher_code', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertPackageSchema = createInsertSchema(packages);
export const insertOrderSchema = createInsertSchema(orders);
export const insertCookieSchema = createInsertSchema(cookies);
export const insertPromoCodeSchema = createInsertSchema(promoCodes);
export const insertRatingSchema = createInsertSchema(ratings);
