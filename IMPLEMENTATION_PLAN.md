# Implementation Plan - 9 Feature Requests

## Request Summary

1. **Team Package Admin Notification** - Kirim notif WA ke 081214421189 saat order Team Plan
2. **Update Garansi** - 7 hari → 1 bulan
3. **Update Validity Period** - 1 Bulan → 25-30 hari
4. **Rating + Voucher System** - Input WA untuk kirim voucher 5k
5. **Cookie Expiry Tracking** - Auto-check masa aktif cookies
6. **Admin CRUD Products** - Edit harga & produk
7. **Fix Recent Orders** - Error di admin panel
8. **Fix Admin UI** - Styling button & text overlap
9. **Inviter Email Tracking** - Record email inviter untuk Excel export

---

## Implementation Details

### 1. Team Package Admin Notification

**Files to modify:**
- `server/routers/public.ts` - createOrder mutation
- `server/services/whatsapp.ts` - add notifyTeamPackageOrder function

**Changes:**
```typescript
// In createOrder mutation, after order created:
if (input.packageId === 'team_package') {
  await whatsappService.notifyTeamPackageOrder(
    orderId,
    input.customerEmail,
    input.customerWhatsapp,
    pkg.name
  );
}

// New function in whatsappService:
async notifyTeamPackageOrder(orderId, email, phone, packageName) {
  const message = `🔔 *Order Team Package Baru!*\n\n` +
    `Order ID: ${orderId}\n` +
    `Email: ${email}\n` +
    `WhatsApp: ${phone}\n` +
    `Paket: ${packageName}\n\n` +
    `⚠️ Note: Script belum support invite admin.\n` +
    `Mohon lakukan manual invite via admin panel.\n\n` +
    `Contact Support: 089673706790`;
  
  // Send to admin WA
  return this.sendMessage({ 
    phone: '081214421189', 
    message, 
    orderId 
  });
}
```

**Update support contact:**
- Update all WhatsApp contact references to 089673706790

---

### 2. Update Garansi (7 hari → 1 bulan)

**Files to modify:**
- `server/seed.ts` - package features
- `client/src/pages/LandingPage.tsx` - display text
- Database - update existing packages

**Changes:**
```typescript
// Update package features:
features: JSON.stringify([
  'Akses ChatGPT Plus penuh',
  'Invite ke email pribadi',
  'Garansi 1 bulan',  // Changed from 7 hari
  'Support 24/7'
])
```

**SQL Update:**
```sql
UPDATE packages 
SET features = JSON_REPLACE(features, '$[2]', 'Garansi 1 bulan')
WHERE package_id IN ('chatgpt_plus_1_month', 'team_package');
```

---

### 3. Update Validity Period (1 Bulan → 25-30 hari)

**Files to modify:**
- `server/seed.ts` - package duration
- `client/src/pages/LandingPage.tsx` - display text
- Database - update existing packages

**Changes:**
```typescript
duration: '25-30 Hari',  // Changed from '1 Bulan'
```

**SQL Update:**
```sql
UPDATE packages 
SET duration = '25-30 Hari'
WHERE package_id IN ('chatgpt_plus_1_month', 'team_package');
```

---

### 4. Rating + Voucher System

**Database Schema Update:**
Add WhatsApp field to ratings table:
```sql
ALTER TABLE ratings 
ADD COLUMN customer_whatsapp VARCHAR(20) AFTER customer_role;
```

**Files to modify:**
- `drizzle/schema.ts` - add customerWhatsapp field
- `client/src/pages/RatingPage.tsx` - add WhatsApp input
- `server/routers/public.ts` - update submitRating mutation
- `server/routers/admin.ts` - add sendVoucher mutation
- Create new admin page: `client/src/pages/admin/VouchersPage.tsx`

**Rating Form Changes:**
```tsx
// Add WhatsApp input field
<Input
  placeholder="08123456789"
  value={whatsapp}
  onChange={(e) => setWhatsapp(e.target.value)}
  required
/>

// Update info text
<Alert>
  Berikan rating dan dapatkan voucher diskon Rp 5.000! 
  Kami akan kirim voucher ke WhatsApp Anda.
</Alert>
```

**Admin Voucher Management:**
```tsx
// New admin page to manage vouchers
- View all ratings with WhatsApp
- Button "Kirim Voucher" for each approved rating
- Track voucher sent status
- Generate unique voucher code
```

**Voucher Generation:**
```typescript
function generateVoucherCode(): string {
  return `REVIEW${Date.now().toString().slice(-6)}`;
}

// Create promo code automatically
await db.insert(promoCodes).values({
    code: voucherCode,
    discountType: 'fixed',
    discountValue: 5000,
    maxUsage: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
  });

// Send via WhatsApp
await whatsappService.sendVoucher(whatsapp, voucherCode);
```

---

### 5. Cookie Expiry Tracking

**Database Schema Update:**
```sql
-- expiresAt field already exists in cookies table
-- Add lastChecked field for tracking
ALTER TABLE cookies 
ADD COLUMN last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

**Files to modify:**
- `drizzle/schema.ts` - add lastChecked field
- `server/services/cookie-checker.ts` - NEW FILE
- `server/_core/index.ts` - start cookie checker cron
- `client/src/pages/admin/CookiesPage.tsx` - show expiry status

**Cookie Checker Service:**
```typescript
class CookieCheckerService {
  async checkAllCookies() {
    const cookies = await getAllCookies();
    
    for (const cookie of cookies) {
      if (!cookie.isActive) continue;
      
      const isValid = await this.validateCookie(cookie);
      
      if (!isValid) {
        // Auto-disable expired cookie
        await updateCookie(cookie.id, { 
          isActive: false,
          lastChecked: new Date()
        });
        
        // Notify admin
        await whatsappService.notifyCookieExpired(
          cookie.id,
          cookie.cookieName,
          cookie.adminEmail
        );
      } else {
        // Update last checked
        await updateCookie(cookie.id, { 
          lastChecked: new Date()
        });
      }
    }
  }
  
  async validateCookie(cookie): Promise<boolean> {
    // Call Python script to validate
    const result = await executePythonScript('cookie_validator.py', cookie);
    return result.valid;
  }
  
  startCron() {
    // Check every 6 hours
    setInterval(() => {
      this.checkAllCookies();
    }, 6 * 60 * 60 * 1000);
  }
}
```

**Admin UI Changes:**
```tsx
// Show expiry status with color coding
<Badge className={
  cookie.expiresAt && new Date(cookie.expiresAt) < new Date()
    ? 'bg-red-500'  // Expired
    : cookie.expiresAt && new Date(cookie.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ? 'bg-yellow-500'  // Expiring soon (< 7 days)
    : 'bg-green-500'  // Active
}>
  {cookie.expiresAt ? formatDate(cookie.expiresAt) : 'No expiry'}
</Badge>

// Add "Check Now" button
<Button onClick={() => checkCookie(cookie.id)}>
  Check Validity
</Button>
```

---

### 6. Admin CRUD Products

**Files to modify:**
- `server/routers/admin.ts` - add updatePackage, deletePackage mutations
- `client/src/pages/admin/PackagesPage.tsx` - add edit/delete UI

**Admin Router Changes:**
```typescript
// Add mutations
updatePackage: publicProcedure
  .input(z.object({
    token: z.string(),
    id: z.number(),
    name: z.string().optional(),
    price: z.number().optional(),
    originalPrice: z.number().optional(),
    duration: z.string().optional(),
    features: z.array(z.string()).optional(),
    isPopular: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }))
  .mutation(async ({ input }) => {
    verifyAdminToken(input.token);
    
    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.price) updateData.price = input.price;
    if (input.originalPrice) updateData.originalPrice = input.originalPrice;
    if (input.duration) updateData.duration = input.duration;
    if (input.features) updateData.features = JSON.stringify(input.features);
    if (input.isPopular !== undefined) updateData.isPopular = input.isPopular;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    
    await db.update(packages).set(updateData).where(eq(packages.id, input.id));
    
    return { success: true };
  }),

deletePackage: publicProcedure
  .input(z.object({
    token: z.string(),
    id: z.number(),
  }))
  .mutation(async ({ input }) => {
    verifyAdminToken(input.token);
    await db.delete(packages).where(eq(packages.id, input.id));
    return { success: true };
  }),
```

**Admin UI Changes:**
```tsx
// Edit Package Dialog
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Package</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleUpdatePackage}>
      <Input name="name" defaultValue={pkg.name} />
      <Input name="price" type="number" defaultValue={pkg.price} />
      <Input name="originalPrice" type="number" defaultValue={pkg.originalPrice} />
      <Input name="duration" defaultValue={pkg.duration} />
      <Textarea name="features" defaultValue={JSON.parse(pkg.features).join('\n')} />
      <Switch name="isPopular" defaultChecked={pkg.isPopular} />
      <Switch name="isActive" defaultChecked={pkg.isActive} />
      <Button type="submit">Save Changes</Button>
    </form>
  </DialogContent>
</Dialog>

// Delete Button with Confirmation
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the package.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => deletePackage(pkg.id)}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 7. Fix Recent Orders Error

**Diagnosis needed:**
- Check browser console for errors
- Check network tab for failed API calls
- Check server logs

**Potential fixes:**
```typescript
// Ensure proper error handling in getOrders query
getOrders: publicProcedure
  .query(async ({ input }) => {
    try {
      verifyAdminToken(input.token);
      const orders = await getAllOrders();
      
      // Ensure all fields are properly serialized
      return orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        invitedAt: order.invitedAt?.toISOString() || null,
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch orders',
      });
    }
  }),
```

**Frontend fix:**
```tsx
// Add proper loading and error states
const { data: orders, isLoading, error } = trpc.admin.getOrders.useQuery({ token });

if (error) {
  return <div>Error loading orders: {error.message}</div>;
}

if (isLoading) {
  return <Loader2 className="animate-spin" />;
}

// Add null checks
{orders?.map(order => (
  <TableRow key={order.id}>
    <TableCell>{order.orderId || 'N/A'}</TableCell>
    <TableCell>{order.customerEmail || 'N/A'}</TableCell>
    ...
  </TableRow>
))}
```

---

### 8. Fix Admin UI Styling

**Common issues to fix:**
- Button text overflow
- Overlapping elements
- Unreadable text on dark backgrounds
- Mobile responsiveness

**CSS fixes:**
```tsx
// Ensure proper spacing and text wrapping
<Button className="whitespace-nowrap overflow-hidden text-ellipsis">
  Long Button Text
</Button>

// Fix overlapping elements
<div className="space-y-4">  {/* Add vertical spacing */}
  <div className="flex flex-wrap gap-2">  {/* Allow wrapping */}
    <Button>Action 1</Button>
    <Button>Action 2</Button>
  </div>
</div>

// Fix text contrast
<p className="text-slate-200">  {/* Light text on dark bg */}
  Readable text
</p>

// Add responsive breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

**Specific areas to check:**
- Dashboard stats cards
- Orders table
- Cookies management page
- Settings page

---

### 9. Inviter Email Tracking

**Database Schema Update:**
Already exists in orders table:
- `invited_by_cookie_id` - Cookie ID used for invite
- `cookie_admin_email` - Email of cookie admin

Just need to ensure it's populated:

**Files to modify:**
- `server/services/inviter.ts` - ensure fields are updated
- `server/routers/admin.ts` - add Excel export function
- `client/src/pages/admin/OrdersPage.tsx` - add export button

**Ensure Inviter Tracking:**
```typescript
// In inviterService.manualInvite()
await updateOrderInviteStatus(
  orderId, 
  'success', 
  cookie.id,           // Store cookie ID
  cookie.adminEmail    // Store inviter email
);
```

**Excel Export Function:**
```typescript
exportOrders: publicProcedure
  .input(z.object({
    token: z.string(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    verifyAdminToken(input.token);
    
    let orders = await getAllOrders();
    
    // Filter by date if provided
    if (input.dateFrom) {
      orders = orders.filter(o => new Date(o.createdAt) >= new Date(input.dateFrom));
    }
    if (input.dateTo) {
      orders = orders.filter(o => new Date(o.createdAt) <= new Date(input.dateTo));
    }
    
    // Format data for Excel
    const excelData = orders.map(order => ({
      'Order ID': order.orderId,
      'Email': order.customerEmail,
      'No HP': order.customerWhatsapp,
      'Kode Promo': order.promoCode || '-',
      'Harga': order.finalPrice,
      'Email Inviter': order.cookieAdminEmail || '-',
      'Tanggal Pembelian': new Date(order.createdAt).toLocaleString('id-ID'),
      'Status Payment': order.paymentStatus,
      'Status Invite': order.inviteStatus,
    }));
    
    // Return as CSV (can be opened in Excel)
    const csv = convertToCSV(excelData);
    return { csv };
  }),
```

**Frontend Export Button:**
```tsx
<Button onClick={handleExportOrders}>
  <Download className="mr-2 w-4 h-4" />
  Export to Excel
</Button>

async function handleExportOrders() {
  const result = await exportOrders.mutateAsync({ 
    token,
    dateFrom,
    dateTo 
  });
  
  // Download CSV file
  const blob = new Blob([result.csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders_${new Date().toISOString()}.csv`;
  a.click();
}
```

---

## Implementation Order

1. ✅ Database schema updates (ratings WhatsApp, cookie lastChecked)
2. ✅ Update seed data (garansi, validity period)
3. ✅ Update existing packages in database
4. ✅ Implement Team Package notification
5. ✅ Implement rating + voucher system
6. ✅ Implement cookie expiry tracking
7. ✅ Implement admin CRUD for products
8. ✅ Fix recent orders error
9. ✅ Fix admin UI styling issues
10. ✅ Ensure inviter email tracking
11. ✅ Add Excel export function
12. ✅ Test all features
13. ✅ Rebuild production

---

## Testing Checklist

- [ ] Team Package order triggers admin notification
- [ ] Garansi text shows "1 bulan"
- [ ] Duration shows "25-30 Hari"
- [ ] Rating form has WhatsApp input
- [ ] Admin can send voucher from ratings page
- [ ] Cookie expiry is tracked and displayed
- [ ] Admin can edit package price and details
- [ ] Recent orders loads without error
- [ ] Admin UI buttons and text are readable
- [ ] Inviter email is recorded in orders
- [ ] Excel export includes all required fields

---

## Estimated Time

- Database updates: 10 min
- Notification system: 15 min
- Rating + voucher: 30 min
- Cookie tracking: 30 min
- Admin CRUD: 20 min
- Bug fixes: 20 min
- UI fixes: 15 min
- Excel export: 15 min
- Testing: 20 min
- Build & deploy: 5 min

**Total: ~3 hours**
