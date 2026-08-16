"use client";

import { useState, useEffect } from "react";
import { Search, Image as ImageIcon, Loader2, FileCheck } from "lucide-react";
import { fetchPaymentsAction } from "./actions";
import { toast } from "@/utils/toast";
import VerifyPaymentButton from "@/components/actions/admin/VerifyPaymentButton";
import RejectPaymentButton from "@/components/actions/admin/RejectPaymentButton";

export default function AdminVerifikasiPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    const result = await fetchPaymentsAction();
    
    if (result.success && result.data) {
      setPayments(result.data);
      if (result.data.length > 0 && !selectedPaymentId) {
        const pending = result.data.find((p: any) => p.status === 'pending');
        if (pending) {
          setSelectedPaymentId(pending.id);
        } else {
          setSelectedPaymentId(result.data[0].id);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);



  const filteredPayments = payments.filter(p => 
    p.orders?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.orders?.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const selectedPayment = payments.find(p => p.id === selectedPaymentId);

  return (
      <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif font-bold text-brand-navy text-2xl">Verifikasi Pembayaran</h1>
            <p className="text-gray-500 text-sm">Periksa bukti transfer dan verifikasi pembayaran pesanan</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center rounded py-1.5 px-3 gap-2 bg-amber-50 border border-amber-200">
              <span className="font-medium text-amber-700 text-sm">{pendingCount} menunggu verifikasi</span>
            </div>
          )}
        </div>

        {/* Main Content (Split view) */}
        <div className="flex flex-1 overflow-hidden gap-6">
          {/* Left List */}
          <div className="flex flex-col w-[350px] shrink-0 rounded bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center rounded py-2 px-3 gap-2 bg-white border border-slate-300 focus-within:border-brand-navy focus-within:ring-1 focus-within:ring-brand-navy transition-all">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari ID atau Pemesan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent outline-none text-sm text-brand-navy placeholder:text-gray-400 w-full"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-evergreen" />
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Tidak ada data pembayaran.
                </div>
              ) : (
                filteredPayments.map(payment => {
                  const isSelected = selectedPaymentId === payment.id;
                  const isPending = payment.status === 'pending';
                  return (
                    <button 
                      key={payment.id}
                      onClick={() => setSelectedPaymentId(payment.id)}
                      className={`w-full flex items-center p-4 gap-3.5 text-left border-l-4 transition-colors ${isSelected ? "bg-slate-50 border-brand-navy" : "bg-white border-transparent hover:bg-slate-50 border-b border-b-slate-100"}`}
                    >
                      <div className="flex flex-col flex-1 gap-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold text-sm ${isSelected ? 'text-brand-navy' : 'text-gray-700'}`}>
                            #{payment.orders?.id?.slice(0,8).toUpperCase()}
                          </span>
                          {isPending ? (
                            <div className="rounded-sm py-0.5 px-2 bg-amber-50 border border-amber-200">
                              <span className="font-medium text-amber-700 text-[10px]">Pending</span>
                            </div>
                          ) : payment.status === 'verified' ? (
                            <div className="rounded-sm py-0.5 px-2 bg-green-50 border border-green-200">
                              <span className="font-medium text-green-700 text-[10px]">Verified</span>
                            </div>
                          ) : (
                            <div className="rounded-sm py-0.5 px-2 bg-red-50 border border-red-200">
                              <span className="font-medium text-red-700 text-[10px]">Ditolak</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-brand-navy text-[13px] truncate">{payment.orders?.users?.full_name || 'Tanpa Nama'}</span>
                        <span className="text-gray-500 text-[11px]">Rp {payment.amount.toLocaleString('id-ID')} • {new Date(payment.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Detail */}
          <div className="flex flex-col flex-1 rounded bg-white border border-slate-200 p-7 overflow-y-auto shadow-sm custom-scrollbar">
            {!selectedPayment ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileCheck size={48} className="mb-4 opacity-50 text-slate-300" />
                <p className="font-medium text-brand-navy">Pilih pembayaran untuk melihat detail</p>
              </div>
            ) : (
              <>
                {/* Top Info */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-serif font-bold text-brand-navy text-xl">Pesanan <span className="font-mono">#{selectedPayment.orders?.id?.slice(0,8).toUpperCase()}</span></h2>
                    <span className="text-gray-500 text-sm">
                      Diunggah: {new Date(selectedPayment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <div className="font-bold text-brand-navy text-2xl">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Info Pemesan</h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Nama Pemesan</span>
                        <span className="font-medium text-brand-navy text-sm">{selectedPayment.orders?.users?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Nama Pasien</span>
                        <span className="font-medium text-brand-navy text-sm">{selectedPayment.orders?.patient_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Paket</span>
                        <span className="font-medium text-brand-navy text-sm">{selectedPayment.orders?.service_packages?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Info Transfer</h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Metode</span>
                        <span className="font-medium text-brand-navy text-sm">Bank Transfer</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Status</span>
                        <span className={`font-semibold text-sm ${
                          selectedPayment.status === 'pending' ? 'text-amber-600' :
                          selectedPayment.status === 'verified' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedPayment.status === 'pending' ? 'Menunggu Verifikasi' :
                           selectedPayment.status === 'verified' ? 'Terverifikasi' : 'Ditolak'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bukti Transfer */}
                <div className="flex flex-col gap-4 py-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bukti Transfer</h3>
                  {selectedPayment.proof_of_transfer_url ? (
                    <div className="w-full flex justify-center rounded bg-slate-50 border border-slate-200 overflow-hidden">
                      <img 
                        src={selectedPayment.proof_of_transfer_url} 
                        alt="Bukti Transfer" 
                        className="max-h-[400px] object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-gray-400 text-sm">
                      Tidak ada foto bukti transfer
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedPayment.status === 'pending' && (
                  <div className="flex gap-4 mt-auto pt-4 border-t border-gray-100">
                    <RejectPaymentButton
                      paymentId={selectedPayment.id}
                      onSuccess={fetchPayments}
                    />
                    <VerifyPaymentButton
                      paymentId={selectedPayment.id}
                      orderId={selectedPayment.order_id}
                      onSuccess={fetchPayments}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );
}
