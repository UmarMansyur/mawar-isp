<script lang="ts">
  import {
    Users,
    Server,
    DollarSign,
    FileText,
    Wifi,
    WifiOff,
  } from "lucide-svelte";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Dashboard Mitra - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-blue-600">Dashboard Mitra</h2>
    <p class="text-slate-500 mt-1">Ringkasan bisnis WISP Anda</p>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Total Pelanggan</p>
          <p class="text-2xl font-bold text-slate-900">
            {data.stats.totalCustomers}
          </p>
        </div>
        <div
          class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"
        >
          <Users size={24} class="text-blue-600" />
        </div>
      </div>
    </div>
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Pelanggan Aktif</p>
          <p class="text-2xl font-bold text-slate-900">
            {data.stats.activeCustomers}
          </p>
        </div>
        <div
          class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"
        >
          <Wifi size={24} class="text-emerald-600" />
        </div>
      </div>
    </div>
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Isolir</p>
          <p class="text-2xl font-bold text-slate-900">
            {data.stats.isolatedCustomers}
          </p>
        </div>
        <div
          class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center"
        >
          <WifiOff size={24} class="text-red-600" />
        </div>
      </div>
    </div>
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Pendapatan Bulan Ini</p>
          <p class="text-2xl font-bold text-slate-900">
            {formatCurrency(data.stats.monthlyRevenue)}
          </p>
        </div>
        <div
          class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"
        >
          <DollarSign size={24} class="text-amber-600" />
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions & Recent Activity -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Quick Actions -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 class="text-lg font-semibold text-slate-900 mb-4">Aksi Cepat</h3>
      <div class="space-y-3">
        <a
          href="/mitra/pelanggan"
          class="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Users size={20} />
          <span class="font-medium">Kelola Pelanggan</span>
        </a>
        <a
          href="/mitra/tagihan"
          class="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <FileText size={20} />
          <span class="font-medium">Lihat Tagihan</span>
        </a>
        <a
          href="/mitra/mikrotik"
          class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <Server size={20} />
          <span class="font-medium">Kelola Mikrotik</span>
        </a>
      </div>
    </div>

    <!-- Recent Invoices -->
    <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900">Tagihan Terbaru</h3>
        <a
          href="/mitra/tagihan"
          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >Lihat Semua →</a
        >
      </div>

      {#if data.recentInvoices.length === 0}
        <div class="text-center py-8 text-slate-500">
          <FileText size={32} class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">Belum ada tagihan</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each data.recentInvoices as invoice}
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-slate-50"
            >
              <div>
                <p class="font-medium text-slate-900">{invoice.invoiceNo}</p>
                <p class="text-xs text-slate-500">
                  {invoice.description || "Tagihan Bulanan"}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-slate-900">
                  {formatCurrency(invoice.amount)}
                </p>
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full
                  {invoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-700'
                    : invoice.status === 'UNPAID'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'}"
                >
                  {invoice.status === "PAID"
                    ? "Lunas"
                    : invoice.status === "UNPAID"
                      ? "Belum Bayar"
                      : "Expired"}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Mikrotik Status -->
  <div class="mt-6 bg-white rounded-2xl p-6 border border-slate-200">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-900">Status Mikrotik</h3>
      <span class="text-sm text-slate-500"
        >{data.stats.totalMikrotik} perangkat terdaftar</span
      >
    </div>
    <div class="flex items-center gap-4">
      <a
        href="/mitra/mikrotik"
        class="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        <Server size={20} />
        <span>Kelola Mikrotik →</span>
      </a>
    </div>
  </div>
</div>
