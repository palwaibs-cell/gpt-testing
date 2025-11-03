import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatCurrency } from '@/lib/utils';
import { useLocation } from 'wouter';

export function LandingPage() {
  const [, setLocation] = useLocation();
  const { data: packages, isLoading } = trpc.public.getPackages.useQuery();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerEmail: '',
    customerWhatsapp: '',
    promoCode: '',
  });

  const createOrder = trpc.public.createOrder.useMutation({
    onSuccess: (data) => {
      setLocation(`/order/${data.orderId}`);
    },
  });

  const handleOrder = async (packageId: string) => {
    if (!formData.customerEmail || !formData.customerWhatsapp) {
      alert('Mohon isi email dan nomor WhatsApp');
      return;
    }

    createOrder.mutate({
      customerEmail: formData.customerEmail,
      customerWhatsapp: formData.customerWhatsapp,
      packageId,
      promoCode: formData.promoCode || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            ChatGPT Plus Murah & Terpercaya
          </h1>
          <p className="text-lg text-slate-600">
            Dapatkan akses ChatGPT Plus dengan harga terjangkau
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8 bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Informasi Pembeli</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp</label>
              <Input
                type="tel"
                placeholder="08123456789"
                value={formData.customerWhatsapp}
                onChange={(e) => setFormData({ ...formData, customerWhatsapp: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kode Promo (Opsional)</label>
              <Input
                type="text"
                placeholder="Masukkan kode promo"
                value={formData.promoCode}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {packages?.map((pkg) => (
            <Card key={pkg.id} className={pkg.isPopular ? 'border-blue-500 border-2' : ''}>
              {pkg.isPopular && (
                <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg font-semibold">
                  PALING POPULER
                </div>
              )}
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className="text-sm text-slate-500 line-through">
                      {formatCurrency(pkg.originalPrice)}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{pkg.duration}</div>
                  </div>

                  <div className="space-y-2">
                    {(JSON.parse(pkg.features as string) as string[]).map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleOrder(pkg.packageId)}
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? 'Memproses...' : 'Beli Sekarang'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => setLocation('/admin')}>
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  );
}
