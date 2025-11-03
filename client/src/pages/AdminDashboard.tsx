import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { useLocation } from 'wouter';
import { formatCurrency, formatDate } from '@/lib/utils';

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem('adminToken') || '';

  useEffect(() => {
    if (!token) {
      setLocation('/admin');
    }
  }, [token, setLocation]);

  const { data: orders, refetch } = trpc.admin.getOrders.useQuery({ token });

  const updatePayment = trpc.admin.updateOrderPayment.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateInvite = trpc.admin.updateOrderInvite.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin');
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">WhatsApp</th>
                    <th className="text-left p-2">Harga</th>
                    <th className="text-left p-2">Pembayaran</th>
                    <th className="text-left p-2">Invite</th>
                    <th className="text-left p-2">Tanggal</th>
                    <th className="text-left p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-2">{order.orderId}</td>
                      <td className="p-2">{order.customerEmail}</td>
                      <td className="p-2">{order.customerWhatsapp}</td>
                      <td className="p-2">{formatCurrency(order.finalPrice)}</td>
                      <td className="p-2">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) =>
                            updatePayment.mutate({
                              token,
                              orderId: order.orderId,
                              paymentStatus: e.target.value,
                            })
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={order.inviteStatus}
                          onChange={(e) =>
                            updateInvite.mutate({
                              token,
                              orderId: order.orderId,
                              inviteStatus: e.target.value,
                            })
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="success">Success</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="p-2 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="p-2">
                        <Button size="sm" variant="outline">
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
