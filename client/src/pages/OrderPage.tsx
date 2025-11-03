import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { formatCurrency } from '@/lib/utils';

export function OrderPage() {
  const [, params] = useRoute('/order/:orderId');
  const orderId = params?.orderId || '';

  const { data: order, isLoading } = trpc.public.getOrder.useQuery({ orderId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Order tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Detail Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">Order berhasil dibuat!</p>
              <p className="text-sm text-green-700 mt-1">
                Silakan lakukan pembayaran dan kirim bukti transfer ke WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Order ID:</span>
                <span className="font-semibold">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Email:</span>
                <span className="font-semibold">{order.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">WhatsApp:</span>
                <span className="font-semibold">{order.customerWhatsapp}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Pembayaran:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(order.finalPrice)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Informasi Pembayaran</h3>
              <p className="text-sm text-slate-700">Transfer ke rekening:</p>
              <p className="text-sm font-mono bg-white p-2 rounded mt-2">
                BCA: 1234567890 a.n. Admin
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Setelah transfer, kirim bukti pembayaran ke WhatsApp: <strong>089673706790</strong>
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div>
                <div className="text-sm text-slate-600">Status Pembayaran</div>
                <div className={`font-semibold ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus === 'paid' ? 'Lunas' : 'Menunggu Pembayaran'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Status Invite</div>
                <div className={`font-semibold ${
                  order.inviteStatus === 'success' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.inviteStatus === 'success' ? 'Terkirim' : 'Menunggu'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
