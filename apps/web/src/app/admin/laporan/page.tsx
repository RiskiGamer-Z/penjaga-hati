"use client";

import { BarChart2, Download, Filter, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getLaporanStatsAction } from "./actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function AdminLaporanPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7days' | 'this_month' | 'last_month'>('last_month');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const res = await getLaporanStatsAction(period);
      if (res.success && res.data) {
        setStats(res.data.stats);
        setChartData(res.data.chartData);
      }
      setLoading(false);
    };

    fetchReport();
  }, [period]);

  const handleExportPDF = () => {
    window.print();
  };

  const getPeriodLabel = () => {
    if (period === '7days') return '7 Hari Terakhir';
    if (period === 'this_month') return 'Bulan Ini';
    if (period === 'last_month') return 'Bulan Lalu';
    return 'Bulan Ini';
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif font-bold text-brand-navy text-2xl">Laporan & Analitik</h1>
          <p className="text-gray-500 text-sm">Ringkasan performa platform Penjaga Hati</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <select
            className="rounded py-2 px-3 bg-white border border-slate-300 text-brand-navy font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm outline-none cursor-pointer focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <option value="7days">7 Hari Terakhir</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
          </select>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 rounded py-2 px-4 bg-brand-navy text-white font-medium text-sm hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow transition-shadow">
          <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Total Pendapatan</span>
          <span className="font-serif text-3xl font-bold text-brand-navy">Rp {stats.totalRevenue.toLocaleString('id-ID')}</span>
        </div>
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow transition-shadow">
          <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Total Transaksi</span>
          <span className="font-serif text-3xl font-bold text-brand-navy">{stats.totalOrders}</span>
        </div>
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow transition-shadow">
          <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Layanan Selesai</span>
          <span className="font-serif text-3xl font-bold text-green-700">{stats.completedOrders}</span>
        </div>
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow transition-shadow">
          <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">Dibatalkan</span>
          <span className="font-serif text-3xl font-bold text-red-600">{stats.cancelledOrders}</span>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="flex-1 bg-white border border-slate-200 rounded shadow-sm flex flex-col p-6 min-h-[400px]">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="font-serif font-bold text-xl text-brand-navy">Tren Pendapatan & Pesanan ({getPeriodLabel()})</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-evergreen mb-2" />
            <span className="text-gray-500 text-sm">Memuat data grafik...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <BarChart2 size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 text-sm">Tidak ada data untuk ditampilkan</p>
          </div>
        ) : (
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7B8D' }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#10b981"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7B8D' }}
                  tickFormatter={(val) => `Rp ${val / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7B8D' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'Pendapatan') return [`Rp ${Number(value).toLocaleString('id-ID')}`, name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="pendapatan" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar yAxisId="right" dataKey="pesanan" name="Jml Pesanan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
