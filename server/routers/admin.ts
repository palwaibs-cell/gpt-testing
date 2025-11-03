import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '../db';
import { users, orders, packages, cookies, promoCodes, ratings } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function verifyAdminToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export const adminRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new Error('Email atau password salah');
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new Error('Email atau password salah');
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return { token, user: { id: user.id, email: user.email, role: user.role } };
    }),

  getOrders: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);
      return await db.select().from(orders).orderBy(orders.createdAt);
    }),

  updateOrderPayment: publicProcedure
    .input(
      z.object({
        token: z.string(),
        orderId: z.string(),
        paymentStatus: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      await db
        .update(orders)
        .set({
          paymentStatus: input.paymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.orderId, input.orderId));

      return { success: true };
    }),

  updateOrderInvite: publicProcedure
    .input(
      z.object({
        token: z.string(),
        orderId: z.string(),
        inviteStatus: z.string(),
        cookieAdminEmail: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      await db
        .update(orders)
        .set({
          inviteStatus: input.inviteStatus,
          invitedAt: input.inviteStatus === 'success' ? new Date() : null,
          cookieAdminEmail: input.cookieAdminEmail || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.orderId, input.orderId));

      return { success: true };
    }),

  getPackages: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);
      return await db.select().from(packages);
    }),

  updatePackage: publicProcedure
    .input(
      z.object({
        token: z.string(),
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        duration: z.string().optional(),
        features: z.array(z.string()).optional(),
        isPopular: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.price) updateData.price = input.price;
      if (input.originalPrice) updateData.originalPrice = input.originalPrice;
      if (input.duration) updateData.duration = input.duration;
      if (input.features) updateData.features = input.features;
      if (input.isPopular !== undefined) updateData.isPopular = input.isPopular;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.update(packages).set(updateData).where(eq(packages.id, input.id));

      return { success: true };
    }),

  getCookies: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);
      return await db.select().from(cookies);
    }),

  addCookie: publicProcedure
    .input(
      z.object({
        token: z.string(),
        cookieName: z.string(),
        adminEmail: z.string().email(),
        cookieData: z.string(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      const [cookie] = await db
        .insert(cookies)
        .values({
          cookieName: input.cookieName,
          adminEmail: input.adminEmail,
          cookieData: input.cookieData,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          isActive: true,
        })
        .returning();

      return cookie;
    }),

  updateCookie: publicProcedure
    .input(
      z.object({
        token: z.string(),
        id: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      await db
        .update(cookies)
        .set({ isActive: input.isActive })
        .where(eq(cookies.id, input.id));

      return { success: true };
    }),

  getPromoCodes: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);
      return await db.select().from(promoCodes);
    }),

  addPromoCode: publicProcedure
    .input(
      z.object({
        token: z.string(),
        code: z.string(),
        discountType: z.string(),
        discountValue: z.number(),
        maxUsage: z.number(),
        validUntil: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      const [promo] = await db
        .insert(promoCodes)
        .values({
          code: input.code,
          discountType: input.discountType,
          discountValue: input.discountValue,
          maxUsage: input.maxUsage,
          currentUsage: 0,
          validFrom: new Date(),
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          isActive: true,
        })
        .returning();

      return promo;
    }),

  getRatings: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);
      return await db.select().from(ratings).orderBy(ratings.createdAt);
    }),

  approveRating: publicProcedure
    .input(
      z.object({
        token: z.string(),
        id: z.number(),
        isApproved: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      verifyAdminToken(input.token);

      await db
        .update(ratings)
        .set({ isApproved: input.isApproved })
        .where(eq(ratings.id, input.id));

      return { success: true };
    }),
});
