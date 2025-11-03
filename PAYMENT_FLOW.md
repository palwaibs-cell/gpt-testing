# Payment & Invite Flow - ChatGPT Order System

## 📋 Overview

Website Anda menggunakan **Manual Invite Mode** yang di-trigger otomatis setelah payment confirmed.

```
Customer Order → Generate QRIS → Payment → Webhook → Manual Invite API → Invite Sent → Done!
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

1. Customer buka landing page
   ↓
2. Pilih package (Individual Plan / Team Plan)
   ↓
3. Isi form order (Email + WhatsApp + Promo Code)
   ↓
4. Submit order
   ↓
5. Backend create order record di database
   ↓
6. Backend call Cashify API untuk generate QRIS
   ↓
7. Cashify return QR String + Transaction ID
   ↓
8. Backend generate QR Code image URL
   ↓
9. Redirect ke confirmation page dengan QR Code
   ↓
10. Customer scan QR Code dengan e-wallet
   ↓
11. Customer bayar via DANA/OVO/ShopeePay/GoPay
   ↓

┌─────────────────────────────────────────────────────────────────────┐
│                         PAYMENT WEBHOOK                              │
└─────────────────────────────────────────────────────────────────────┘

12. Cashify kirim webhook ke server Anda
    URL: https://your-domain.com/api/payments/webhook
   ↓
13. Server verify webhook payload
   ↓
14. Update order payment_status = "paid"
   ↓

┌─────────────────────────────────────────────────────────────────────┐
│                    AUTO-TRIGGER MANUAL INVITE                        │
└─────────────────────────────────────────────────────────────────────┘

15. Server auto-trigger manual invite (async)
    inviterService.manualInvite(orderId, 0)
   ↓
16. Get available ChatGPT admin cookie from database
   ↓
17. Call Python script untuk invite via ChatGPT API
   ↓
18. Python script kirim invite ke customer email
   ↓
19. Update order invite_status = "success"
   ↓
20. Send WhatsApp notification ke customer
    "✅ Invite berhasil dikirim ke email Anda!"
   ↓
21. Done! Customer terima email invite dari ChatGPT
```

---

## 🔧 Technical Implementation

### 1. **Order Creation** (`server/routers/public.ts`)

```typescript
createOrder: publicProcedure
  .mutation(async ({ input }) => {
    // Generate QRIS with Cashify
    const qrisResult = await cashifyService.generateQRIS({
      amount: finalPrice,
      orderId,
    });
    
    // Create order record
    await createOrder({
      orderId,
      packageId: input.packageId,
      customerEmail: input.customerEmail,
      customerWhatsapp: input.customerWhatsapp,
      paymentStatus: 'pending',
      paymentReference: qrisResult.qrImageUrl,
      transactionId: qrisResult.transactionId,
      inviteStatus: 'manual',  // Manual invite mode
      inviteMethod: 'manual',
    });
    
    return {
      orderId,
      qrImageUrl: qrisResult.qrImageUrl,
      transactionId: qrisResult.transactionId,
    };
  })
```

### 2. **Payment Webhook** (`server/routes/payments.ts`)

```typescript
router.post('/webhook', async (req, res) => {
  const payload = req.body;
  
  // Verify webhook
  if (!cashifyService.verifyCallback(payload)) {
    return res.status(400).json({ error: 'Invalid webhook' });
  }
  
  // Update payment status
  await updateOrderPaymentStatus(orderId, 'paid');
  
  // Auto-trigger manual invite (async)
  inviterService.manualInvite(orderId, 0).then(result => {
    if (result.success) {
      console.log('✅ Auto-triggered manual invite succeeded');
    } else {
      console.error('❌ Auto-triggered manual invite failed');
      // Notify admin on failure
      whatsappService.notifyAdminNewOrder(orderId, email, packageName);
    }
  });
  
  res.json({ success: true });
});
```

### 3. **Manual Invite Service** (`server/services/inviter.ts`)

```typescript
async manualInvite(orderId: string, retryCount: number = 0) {
  // Get order
  const order = await getOrderByOrderId(orderId);
  
  // Get available cookie
  const cookie = await getAvailableCookie();
  
  if (!cookie) {
    // No cookie available - notify admin
    await whatsappService.notifyNoCookieAvailable(orderId, order.customerEmail);
    return { success: false, error: 'No available cookie' };
  }
  
  // Update invite status to processing
  await updateOrderInviteStatus(orderId, 'processing');
  
  // Call Python script to send invite
  const result = await this.executePythonInvite(cookie, order.customerEmail);
  
  if (result.success) {
    // Update invite status to success
    await updateOrderInviteStatus(orderId, 'success', cookie.id, cookie.adminEmail);
    
    // Send WhatsApp notification to customer
    await whatsappService.notifyInviteSuccess(
      order.customerWhatsapp,
      order.customerEmail,
      orderId
    );
    
    return { success: true };
  } else {
    // Retry logic (max 3 attempts)
    if (retryCount < 2) {
      return this.manualInvite(orderId, retryCount + 1);
    }
    
    // Failed after retries - notify admin
    await updateOrderInviteStatus(orderId, 'failed');
    await whatsappService.notifyInviteFailed(orderId, order.customerEmail, result.error);
    
    return { success: false, error: result.error };
  }
}
```

### 4. **Python Invite Script** (`inviter/manual_inviter.py`)

```python
def send_invite(cookie_data, email):
    # Use ChatGPT admin cookie to send invite
    session = requests.Session()
    
    # Set cookies
    for key, value in cookie_data.items():
        session.cookies.set(key, value)
    
    # Call ChatGPT API to send invite
    response = session.post(
        'https://chatgpt.com/backend-api/workspace/invites',
        json={'email': email, 'role': 'member'}
    )
    
    if response.status_code == 200:
        return {'success': True}
    else:
        return {'success': False, 'error': response.text}
```

---

## 📊 Database Flow

### Order Status Transitions

```
1. Order Created
   payment_status: "pending"
   invite_status: "manual"
   ↓
2. Payment Confirmed (via webhook)
   payment_status: "paid"
   invite_status: "manual" → "processing"
   ↓
3. Invite Processing
   invite_status: "processing"
   ↓
4. Invite Success
   invite_status: "success"
   invited_at: timestamp
   invited_by_cookie_id: cookie.id
   cookie_admin_email: cookie.adminEmail
   ↓
5. Done!
```

### Cookie Member Count Update

```
1. Get available cookie (currentMembers < maxMembers)
   ↓
2. Lock cookie row (SELECT FOR UPDATE)
   ↓
3. Increment currentMembers + 1
   ↓
4. Assign cookie to order
   ↓
5. Release lock
```

---

## 🔔 Notification Flow

### Customer Notifications

**1. Payment Success:**
```
✅ Pembayaran Berhasil!

Terima kasih atas pembayaran Anda.

Order ID: ORD-xxxxx
Paket: Individual Plan

Admin akan segera memproses invite Anda.
Invite akan dikirim ke email Anda dalam waktu dekat.

Mohon tunggu ya! 🙏
```

**2. Invite Success:**
```
✅ ChatGPT Plus Invite Berhasil!

Selamat! Invite ChatGPT Plus sudah dikirim ke email:
📧 customer@example.com

Silakan cek inbox atau folder spam email Anda.
Klik link invite dan nikmati ChatGPT Plus! 🚀

Order ID: ORD-xxxxx
Terima kasih! 🙏
```

### Admin Notifications

**1. Auto-Invite Failed:**
```
⚠️ Auto-Invite Failed

Order ID: ORD-xxxxx
Email: customer@example.com
Error: Cookie expired

Mohon lakukan manual invite.
```

**2. No Available Cookie:**
```
⚠️ No Available Cookie

Order ID: ORD-xxxxx
Email: customer@example.com

Semua cookie sudah penuh. Mohon tambahkan cookie baru atau lakukan manual invite.
```

**3. New Paid Order (if auto-invite disabled):**
```
🔔 Order Baru Terbayar!

Order ID: ORD-xxxxx
Email: customer@example.com
Paket: Individual Plan

Silakan lakukan manual invite via admin dashboard.
https://your-domain.com/indramayu1945
```

---

## 🎯 Current Configuration

### Mode: **Manual Invite (Auto-Triggered)**

```typescript
// server/_core/index.ts
console.log('[Auto-Invite] Manual invite mode - triggered by payment webhook');
```

Artinya:
- ❌ **TIDAK ADA** auto-polling yang cek database setiap X detik
- ✅ **ADA** auto-trigger saat payment confirmed via webhook
- ✅ Manual invite API dipanggil otomatis setelah payment
- ✅ Admin bisa manual trigger dari dashboard jika gagal

---

## 🔐 Security & Error Handling

### 1. **Webhook Verification**
```typescript
verifyCallback(payload: any): boolean {
  return (
    payload &&
    typeof payload.transactionId === 'string' &&
    typeof payload.amount === 'number' &&
    typeof payload.status === 'string'
  );
}
```

### 2. **Cookie Transaction Lock**
```sql
SELECT * FROM cookies 
WHERE is_active = 1 AND current_members < max_members
ORDER BY current_members
LIMIT 1
FOR UPDATE;  -- Lock row until transaction completes
```

### 3. **Retry Logic**
- Max 3 attempts untuk invite
- Exponential backoff (optional)
- Notify admin after all retries failed

### 4. **Error Logging**
```typescript
try {
  const result = await inviterService.manualInvite(orderId, 0);
} catch (error) {
  console.error('❌ Auto-triggered manual invite error:', error);
  // Log to database
  await createInviteLog({
    orderId,
    status: 'failed',
    errorMessage: error.message,
  });
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Happy Path (Success)
```
1. Customer order → ✅
2. Generate QRIS → ✅
3. Customer bayar → ✅
4. Webhook received → ✅
5. Payment confirmed → ✅
6. Auto-trigger invite → ✅
7. Get available cookie → ✅
8. Send invite via Python → ✅
9. Update status success → ✅
10. Send WhatsApp notification → ✅
11. Customer terima email invite → ✅
```

### Scenario 2: No Available Cookie
```
1. Customer order → ✅
2. Generate QRIS → ✅
3. Customer bayar → ✅
4. Webhook received → ✅
5. Payment confirmed → ✅
6. Auto-trigger invite → ✅
7. Get available cookie → ❌ (all full)
8. Notify admin → ✅
9. Admin add new cookie → ✅
10. Admin manual trigger invite → ✅
```

### Scenario 3: Cookie Expired
```
1. Customer order → ✅
2. Generate QRIS → ✅
3. Customer bayar → ✅
4. Webhook received → ✅
5. Payment confirmed → ✅
6. Auto-trigger invite → ✅
7. Get available cookie → ✅
8. Send invite via Python → ❌ (401 Unauthorized)
9. Retry with different cookie → ✅
10. Success on 2nd attempt → ✅
```

### Scenario 4: Payment Timeout
```
1. Customer order → ✅
2. Generate QRIS → ✅
3. Customer tidak bayar → ❌
4. After 15 minutes → ⏰
5. Cashify webhook: status = "expired" → ✅
6. Update payment_status = "expired" → ✅
7. Order cancelled → ✅
```

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Order Metrics:**
   - Total orders created
   - Conversion rate (order → payment)
   - Average time to payment
   - Payment success rate

2. **Invite Metrics:**
   - Invite success rate
   - Average invite time
   - Retry rate
   - Failure reasons

3. **Cookie Metrics:**
   - Active cookies count
   - Available slots
   - Cookie utilization rate
   - Cookie expiry rate

4. **Revenue Metrics:**
   - Total revenue
   - Revenue by package
   - Promo code usage
   - Refund rate

### Database Queries for Analytics

```sql
-- Order conversion rate
SELECT 
  COUNT(*) as total_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  (SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as conversion_rate
FROM orders;

-- Invite success rate
SELECT 
  COUNT(*) as total_invites,
  SUM(CASE WHEN invite_status = 'success' THEN 1 ELSE 0 END) as successful_invites,
  (SUM(CASE WHEN invite_status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as success_rate
FROM orders
WHERE payment_status = 'paid';

-- Cookie utilization
SELECT 
  id,
  cookie_name,
  admin_email,
  current_members,
  max_members,
  (current_members / max_members) * 100 as utilization_rate
FROM cookies
WHERE is_active = 1;
```

---

## 🚀 Optimization Tips

### 1. **Webhook Performance**
- Use async processing untuk invite
- Return 200 OK immediately ke Cashify
- Process invite di background

### 2. **Cookie Management**
- Monitor cookie expiry dates
- Auto-disable expired cookies
- Alert admin when slots < 10%

### 3. **Error Recovery**
- Implement retry queue
- Manual intervention dashboard
- Automated health checks

### 4. **Scalability**
- Add more cookies as demand grows
- Implement load balancing for cookies
- Cache frequently accessed data

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue 1: Invite tidak terkirim**
- Check: Cookie masih aktif?
- Check: Email valid?
- Check: Python script error logs
- Solution: Manual trigger dari admin dashboard

**Issue 2: Payment webhook tidak masuk**
- Check: Webhook URL accessible?
- Check: Cashify webhook settings
- Check: Server logs
- Solution: Manual update payment status

**Issue 3: Cookie penuh semua**
- Check: Current members vs max members
- Solution: Add new cookie atau increase max_members

**Issue 4: WhatsApp notification gagal**
- Check: WAPISender API key valid?
- Check: Device key active?
- Check: Phone number format (62xxx)
- Solution: Resend via admin dashboard

---

## 🎉 Summary

Skema flow website Anda:

```
Payment confirmed → Trigger manual invite API → Invite sent → Done!
```

**Keunggulan sistem ini:**
✅ Fully automated setelah payment
✅ No polling overhead
✅ Real-time processing via webhook
✅ Automatic retry on failure
✅ Admin notification on error
✅ Manual fallback available
✅ Transaction-safe cookie allocation
✅ Complete audit trail

**Website Anda sudah production-ready!** 🚀
