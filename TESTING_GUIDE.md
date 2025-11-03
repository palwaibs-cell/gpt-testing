# Panduan Testing Website ChatGPT Order System

## 🌐 URL Preview
**Website URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer

---

## 📋 Ringkasan Sistem

Website ini adalah sistem order untuk ChatGPT Plus dengan fitur:
- **Frontend:** Landing page, order form, payment confirmation, rating system
- **Backend:** Order management, payment processing (QRIS), auto-invite system, admin panel
- **Database:** MySQL dengan 11 tabel (users, orders, packages, cookies, ratings, dll)

---

## ✅ Status Deployment

### Yang Sudah Berjalan:
- ✅ Frontend & Backend deployed
- ✅ Database MySQL terpasang dan migrasi selesai
- ✅ Sample data (packages & admin user) sudah di-seed
- ✅ Server berjalan di port 3001

### Yang Belum Dikonfigurasi (Opsional):
- ⚠️ OAuth (OAUTH_SERVER_URL) - tidak diperlukan untuk testing dasar
- ⚠️ Cashify Payment Gateway (API Key) - diperlukan untuk payment QRIS
- ⚠️ WhatsApp API (WAPISender) - diperlukan untuk notifikasi
- ⚠️ Auto-Invite System - memerlukan ChatGPT admin cookies

---

## 🧪 Cara Testing Fungsi-Fungsi Website

### 1. **Landing Page (Public)**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer

**Fitur yang bisa di-test:**
- ✅ Tampilan hero section
- ✅ Daftar packages (2 paket: Individual Plan & Team Plan)
- ✅ Pricing display dengan original price & discount
- ✅ Features list untuk setiap package
- ✅ Testimonial/ratings section
- ✅ FAQ section
- ✅ Footer dengan kontak info

**Cara test:**
1. Buka URL di browser
2. Scroll ke bawah untuk melihat semua section
3. Klik tombol "Pesan Sekarang" pada salah satu package

---

### 2. **Order Page (Public)**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/order?package=chatgpt_plus_1_month

**Fitur yang bisa di-test:**
- ✅ Form input email & WhatsApp
- ✅ Package details display
- ✅ Promo code validation (jika ada promo code)
- ✅ Price calculation dengan discount
- ✅ Order creation

**Cara test:**
1. Isi form dengan:
   - Email: test@example.com
   - WhatsApp: 081234567890
2. (Opsional) Masukkan promo code jika ada
3. Klik "Buat Pesanan"
4. **Catatan:** Payment QRIS akan gagal karena Cashify API belum dikonfigurasi

**Yang perlu dikonfigurasi untuk full test:**
- Cashify API Key & Merchant ID (untuk generate QRIS)

---

### 3. **Confirmation Page (Public)**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/confirmation?orderId=ORD-xxxxx

**Fitur yang bisa di-test:**
- ✅ Order details display
- ✅ Payment status checking
- ✅ QR Code display (jika payment berhasil di-generate)
- ✅ Auto-refresh payment status
- ✅ Link ke rating page

**Cara test:**
1. Setelah membuat order, akan redirect ke halaman ini
2. Lihat order details
3. Klik "Cek Status Pembayaran"

---

### 4. **Rating Page (Public)**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/rating?orderId=ORD-xxxxx

**Fitur yang bisa di-test:**
- ✅ Rating form (1-5 stars)
- ✅ Review text input
- ✅ Customer name & role input
- ✅ Submit rating

**Cara test:**
1. Buka URL dengan order ID yang valid
2. Isi form rating
3. Submit rating
4. **Catatan:** Rating hanya bisa dikirim jika invite status = 'success'

---

### 5. **Admin Login**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/indramayu1945

**Kredensial Admin:**
- Username: `Desember1m`
- Password: `Aura1325`

**Fitur yang bisa di-test:**
- ✅ Login form
- ✅ JWT authentication
- ✅ Session management

**Cara test:**
1. Buka URL admin login
2. Masukkan username & password
3. Klik "Login"
4. Akan redirect ke admin dashboard

---

### 6. **Admin Dashboard**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/admin/dashboard

**Fitur yang bisa di-test:**
- ✅ Statistics cards (total orders, revenue, invites, cookies)
- ✅ Orders table dengan filter
- ✅ Payment status management
- ✅ Invite status tracking
- ✅ Date range filter
- ✅ Export data

**Cara test:**
1. Login sebagai admin terlebih dahulu
2. Lihat statistics di dashboard
3. Filter orders berdasarkan status
4. Update payment status manual
5. Trigger manual invite

---

### 7. **Admin - Cookies Management**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/admin/cookies

**Fitur yang bisa di-test:**
- ✅ View all ChatGPT admin cookies
- ✅ Add new cookie
- ✅ Edit cookie (max members, active status)
- ✅ Delete cookie
- ✅ Test cookie validity
- ✅ Member count tracking

**Cara test:**
1. Login sebagai admin
2. Navigate ke Cookies page
3. Klik "Add Cookie" untuk menambah cookie baru
4. Isi form dengan cookie data (JSON format)
5. Test cookie validity

**Format Cookie Data (JSON):**
```json
{
  "__Secure-next-auth.session-token": "your-token-here",
  "other-cookie-fields": "values"
}
```

---

### 8. **Admin - Packages Management**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/admin/packages

**Fitur yang bisa di-test:**
- ✅ View all packages
- ✅ Add new package
- ✅ Edit package (price, features, status)
- ✅ Delete package
- ✅ Toggle active status

**Cara test:**
1. Login sebagai admin
2. Navigate ke Packages page
3. Edit existing package
4. Add new package

---

### 9. **Admin - Promo Codes Management**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/admin/promos

**Fitur yang bisa di-test:**
- ✅ View all promo codes
- ✅ Add new promo code
- ✅ Edit promo code
- ✅ Delete promo code
- ✅ Usage tracking
- ✅ Expiry date management

**Cara test:**
1. Login sebagai admin
2. Navigate ke Promo Codes page
3. Create promo code baru:
   - Code: TESTING10
   - Discount Type: percentage
   - Discount Value: 10
   - Max Usage: 100
4. Test promo code di order page

---

### 10. **Admin - Ratings Management**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/admin/ratings

**Fitur yang bisa di-test:**
- ✅ View all ratings
- ✅ Approve/reject ratings
- ✅ Toggle public visibility
- ✅ Delete ratings

**Cara test:**
1. Login sebagai admin
2. Navigate ke Ratings page
3. Approve rating yang masuk
4. Toggle public visibility

---

### 11. **Admin - Settings**
**URL:** https://3001-ihcydrk3nkkubx31wgya6-a979b7c5.manus-asia.computer/admin/settings

**Fitur yang bisa di-test:**
- ✅ Update admin WhatsApp number
- ✅ Configure Cashify API
- ✅ Configure WhatsApp API
- ✅ System settings management

**Cara test:**
1. Login sebagai admin
2. Navigate ke Settings page
3. Update settings

---

## 🔑 Konfigurasi API yang Diperlukan untuk Full Testing

### 1. **Cashify Payment Gateway** (untuk QRIS)
Tambahkan ke `.env`:
```env
# Anda perlu mendaftar di Cashify dan mendapatkan API credentials
```

Atau update via Admin Settings page:
- `cashify_api_key`: API key dari Cashify
- `cashify_merchant_id`: Merchant ID dari Cashify

### 2. **WhatsApp Notification (WAPISender)**
Tambahkan ke `.env` atau update via Admin Settings:
- `wapisender_api_key`: API key dari WAPISender

### 3. **ChatGPT Admin Cookies** (untuk auto-invite)
Tambahkan via Admin Cookies Management page:
1. Login ke ChatGPT Plus sebagai admin
2. Export cookies menggunakan browser extension
3. Paste cookie data ke form Add Cookie
4. Set max members (default: 5)

---

## 📊 Database Tables

Berikut adalah tabel-tabel yang ada di database:

1. **users** - User authentication data
2. **admin_users** - Admin credentials
3. **packages** - Product packages
4. **promo_codes** - Discount codes
5. **orders** - Customer orders
6. **cookies** - ChatGPT admin cookies
7. **ratings** - Customer reviews
8. **invite_logs** - Invite attempt logs
9. **notifications** - WhatsApp notifications queue
10. **settings** - System settings
11. **__drizzle_migrations** - Migration history

---

## 🧪 Skenario Testing Lengkap

### Skenario 1: Customer Order Flow (Tanpa Payment)
1. ✅ Buka landing page
2. ✅ Pilih package
3. ✅ Isi form order
4. ✅ Submit order
5. ⚠️ Payment QRIS gagal (perlu Cashify API)
6. ✅ Lihat order di admin dashboard

### Skenario 2: Admin Management
1. ✅ Login sebagai admin
2. ✅ Lihat dashboard statistics
3. ✅ Buat promo code baru
4. ✅ Update package pricing
5. ✅ Add ChatGPT cookie
6. ✅ Manual approve order payment
7. ✅ Trigger manual invite

### Skenario 3: Full Order Flow (Dengan Payment - Perlu API)
1. Customer buat order
2. Generate QRIS via Cashify
3. Customer bayar via QRIS
4. Webhook update payment status
5. Auto-trigger invite
6. Send WhatsApp notification
7. Customer submit rating
8. Admin approve rating

---

## 📝 Catatan Penting

### Fungsi yang Bisa Di-test SEKARANG (Tanpa API):
- ✅ Semua tampilan frontend
- ✅ Admin authentication & dashboard
- ✅ CRUD operations (packages, promos, cookies, ratings)
- ✅ Order creation (tanpa payment)
- ✅ Manual payment status update
- ✅ Database operations

### Fungsi yang Perlu API untuk Full Testing:
- ⚠️ QRIS payment generation (perlu Cashify API)
- ⚠️ Payment status checking (perlu Cashify API)
- ⚠️ WhatsApp notifications (perlu WAPISender API)
- ⚠️ Auto-invite to ChatGPT (perlu valid ChatGPT admin cookies)

---

## 🚀 Cara Menjalankan Testing

### Testing Tanpa API (Recommended untuk awal):
1. Buka website URL
2. Test semua halaman public
3. Login ke admin panel
4. Test CRUD operations
5. Buat order dummy
6. Manual update payment status di admin
7. Test rating submission

### Testing Dengan API (Full Flow):
1. Dapatkan Cashify API credentials
2. Dapatkan WAPISender API key
3. Export ChatGPT admin cookies
4. Update settings via admin panel
5. Test full order flow dengan payment
6. Monitor auto-invite process
7. Check WhatsApp notifications

---

## 📧 Informasi Kontak

- **Admin WhatsApp:** 081214421189 (dari settings)
- **Admin Username:** Desember1m
- **Admin Password:** Aura1325
- **Admin Login URL:** /indramayu1945

---

## 🎯 Kesimpulan

**Untuk test semua fungsi LIVE saat ini, Anda TIDAK perlu mengirimkan apa-apa.**

Website sudah bisa di-test untuk:
- Semua UI/UX frontend
- Admin panel lengkap
- Database operations
- Order flow (tanpa payment)

**Jika ingin test FULL dengan payment & notifications, Anda perlu:**
1. **Cashify API Key & Merchant ID** (untuk QRIS payment)
2. **WAPISender API Key** (untuk WhatsApp notifications)
3. **ChatGPT Admin Cookies** (untuk auto-invite system)

Semua API ini bisa dikonfigurasi via Admin Settings page setelah Anda mendapatkan credentials-nya.
