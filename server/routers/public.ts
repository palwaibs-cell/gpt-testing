import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '../db';
import { packages, orders, promoCodes, ratings } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const publicRouter = router({
  getPackages: publicProcedure.query(async () => {
    return await db.select().from(packages).where(eq(packages.isActive, true));
  }),

  getPackage: publicProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ input }) => {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(eq(packages.packageId, input.packageId))
        .limit(1);
      return pkg;
    }),

  validatePromoCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const [promo] = await db
        .select()
        .from(promoCodes)
        .where(
          and(
            eq(promoCodes.code, input.code),
            eq(promoCodes.isActive, true)
          )
        )
        .limit(1);

      if (!promo) {
        throw new Error('Kode promo tidak valid');
      }

      if (promo.maxUsage > 0 && promo.currentUsage >= promo.maxUsage) {
        throw new Error('Kode promo sudah mencapai batas penggunaan');
      }

      if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
        throw new Error('Kode promo sudah kadaluarsa');
      }

      return promo;
    }),

  createOrder: publicProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        customerWhatsapp: z.string(),
        packageId: z.string(),
        promoCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(eq(packages.packageId, input.packageId))
        .limit(1);

      if (!pkg) {
        throw new Error('Paket tidak ditemukan');
      }

      let discount = 0;
      let finalPrice = pkg.price;

      if (input.promoCode) {
        const [promo] = await db
          .select()
          .from(promoCodes)
          .where(eq(promoCodes.code, input.promoCode))
          .limit(1);

        if (promo && promo.isActive) {
          if (promo.discountType === 'fixed') {
            discount = promo.discountValue;
          } else if (promo.discountType === 'percentage') {
            discount = Math.floor((pkg.price * promo.discountValue) / 100);
          }
          finalPrice = pkg.price - discount;

          await db
            .update(promoCodes)
            .set({ currentUsage: promo.currentUsage + 1 })
            .where(eq(promoCodes.id, promo.id));
        }
      }

      const orderId = `ORD-${nanoid(10).toUpperCase()}`;

      const [order] = await db
        .insert(orders)
        .values({
          orderId,
          customerEmail: input.customerEmail,
          customerWhatsapp: input.customerWhatsapp,
          packageId: pkg.id,
          originalPrice: pkg.price,
          discount,
          finalPrice,
          promoCode: input.promoCode || null,
          paymentStatus: 'pending',
          inviteStatus: 'pending',
        })
        .returning();

      return order;
    }),

  getOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderId, input.orderId))
        .limit(1);
      return order;
    }),

  submitRating: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
        customerEmail: z.string().email(),
        customerRole: z.string().optional(),
        customerWhatsapp: z.string().optional(),
        rating: z.number().min(1).max(5),
        review: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderId, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order tidak ditemukan');
      }

      if (order.customerEmail !== input.customerEmail) {
        throw new Error('Email tidak sesuai dengan order');
      }

      const [rating] = await db
        .insert(ratings)
        .values({
          orderId: input.orderId,
          customerEmail: input.customerEmail,
          customerRole: input.customerRole || null,
          customerWhatsapp: input.customerWhatsapp || null,
          rating: input.rating,
          review: input.review || null,
          isApproved: false,
          voucherSent: false,
        })
        .returning();

      return rating;
    }),

  getApprovedRatings: publicProcedure.query(async () => {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.isApproved, true))
      .orderBy(ratings.createdAt);
  }),
});
