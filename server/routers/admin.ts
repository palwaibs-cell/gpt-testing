import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { supabase } from '../supabase';
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
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', input.email)
        .single();

      if (error || !user) {
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

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return data.map(order => ({
        ...order,
        orderId: order.order_id,
        customerEmail: order.customer_email,
        customerWhatsapp: order.customer_whatsapp,
        packageId: order.package_id,
        originalPrice: order.original_price,
        finalPrice: order.final_price,
        promoCode: order.promo_code,
        paymentStatus: order.payment_status,
        paymentProof: order.payment_proof,
        inviteStatus: order.invite_status,
        invitedAt: order.invited_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      }));
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

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: input.paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', input.orderId);

      if (error) throw new Error(error.message);

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

      const { error } = await supabase
        .from('orders')
        .update({
          invite_status: input.inviteStatus,
          invited_at: input.inviteStatus === 'success' ? new Date().toISOString() : null,
          cookie_admin_email: input.cookieAdminEmail || null,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', input.orderId);

      if (error) throw new Error(error.message);

      return { success: true };
    }),

  getPackages: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);

      const { data, error } = await supabase
        .from('packages')
        .select('*');

      if (error) throw new Error(error.message);
      return data;
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
      if (input.originalPrice) updateData.original_price = input.originalPrice;
      if (input.duration) updateData.duration = input.duration;
      if (input.features) updateData.features = input.features;
      if (input.isPopular !== undefined) updateData.is_popular = input.isPopular;
      if (input.isActive !== undefined) updateData.is_active = input.isActive;

      const { error } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', input.id);

      if (error) throw new Error(error.message);

      return { success: true };
    }),

  getCookies: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);

      const { data, error } = await supabase
        .from('cookies')
        .select('*');

      if (error) throw new Error(error.message);
      return data;
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

      const { data: cookie, error } = await supabase
        .from('cookies')
        .insert({
          cookie_name: input.cookieName,
          admin_email: input.adminEmail,
          cookie_data: input.cookieData,
          expires_at: input.expiresAt || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

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

      const { error } = await supabase
        .from('cookies')
        .update({ is_active: input.isActive })
        .eq('id', input.id);

      if (error) throw new Error(error.message);

      return { success: true };
    }),

  getPromoCodes: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);

      const { data, error } = await supabase
        .from('promo_codes')
        .select('*');

      if (error) throw new Error(error.message);
      return data;
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

      const { data: promo, error } = await supabase
        .from('promo_codes')
        .insert({
          code: input.code,
          discount_type: input.discountType,
          discount_value: input.discountValue,
          max_usage: input.maxUsage,
          current_usage: 0,
          valid_from: new Date().toISOString(),
          valid_until: input.validUntil || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return promo;
    }),

  getRatings: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      verifyAdminToken(input.token);

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
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

      const { error } = await supabase
        .from('ratings')
        .update({ is_approved: input.isApproved })
        .eq('id', input.id);

      if (error) throw new Error(error.message);

      return { success: true };
    }),
});
