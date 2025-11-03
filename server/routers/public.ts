import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { supabase } from '../supabase';
import { nanoid } from 'nanoid';

export const publicRouter = router({
  getPackages: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true);

    if (error) throw new Error(error.message);

    return data.map(pkg => ({
      ...pkg,
      isActive: pkg.is_active,
      isPopular: pkg.is_popular,
      packageId: pkg.package_id,
      originalPrice: pkg.original_price,
      createdAt: pkg.created_at
    }));
  }),

  getPackage: publicProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('package_id', input.packageId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  validatePromoCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', input.code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Kode promo tidak valid');

      if (data.max_usage > 0 && data.current_usage >= data.max_usage) {
        throw new Error('Kode promo sudah mencapai batas penggunaan');
      }

      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        throw new Error('Kode promo sudah kadaluarsa');
      }

      return data;
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
      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('package_id', input.packageId)
        .single();

      if (pkgError || !pkg) {
        throw new Error('Paket tidak ditemukan');
      }

      let discount = 0;
      let finalPrice = pkg.price;

      if (input.promoCode) {
        const { data: promo, error: promoError } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('code', input.promoCode)
          .maybeSingle();

        if (!promoError && promo && promo.is_active) {
          if (promo.discount_type === 'fixed') {
            discount = promo.discount_value;
          } else if (promo.discount_type === 'percentage') {
            discount = Math.floor((pkg.price * promo.discount_value) / 100);
          }
          finalPrice = pkg.price - discount;

          await supabase
            .from('promo_codes')
            .update({ current_usage: promo.current_usage + 1 })
            .eq('id', promo.id);
        }
      }

      const orderId = `ORD-${nanoid(10).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          customer_email: input.customerEmail,
          customer_whatsapp: input.customerWhatsapp,
          package_id: pkg.id,
          original_price: pkg.price,
          discount,
          final_price: finalPrice,
          promo_code: input.promoCode || null,
          payment_status: 'pending',
          invite_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      return {
        ...order,
        orderId: order.order_id,
        customerEmail: order.customer_email,
        customerWhatsapp: order.customer_whatsapp,
        packageId: order.package_id,
        originalPrice: order.original_price,
        finalPrice: order.final_price,
        promoCode: order.promo_code,
        paymentStatus: order.payment_status,
        inviteStatus: order.invite_status,
        createdAt: order.created_at,
      };
    }),

  getOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', input.orderId)
        .single();

      if (error) return null;

      return {
        ...data,
        orderId: data.order_id,
        customerEmail: data.customer_email,
        customerWhatsapp: data.customer_whatsapp,
        packageId: data.package_id,
        originalPrice: data.original_price,
        finalPrice: data.final_price,
        promoCode: data.promo_code,
        paymentStatus: data.payment_status,
        paymentProof: data.payment_proof,
        inviteStatus: data.invite_status,
        invitedAt: data.invited_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
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
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', input.orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order tidak ditemukan');
      }

      if (order.customer_email !== input.customerEmail) {
        throw new Error('Email tidak sesuai dengan order');
      }

      const { data: rating, error: ratingError } = await supabase
        .from('ratings')
        .insert({
          order_id: input.orderId,
          customer_email: input.customerEmail,
          customer_role: input.customerRole || null,
          customer_whatsapp: input.customerWhatsapp || null,
          rating: input.rating,
          review: input.review || null,
          is_approved: false,
          voucher_sent: false,
        })
        .select()
        .single();

      if (ratingError) throw new Error(ratingError.message);

      return rating;
    }),

  getApprovedRatings: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }),
});
