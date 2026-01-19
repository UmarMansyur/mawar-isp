<script lang="ts">
  import {
    Users,
    Server,
    DollarSign,
    FileText,
    UserCheck,
    BarChart3,
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

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return { label: "Aktif", class: "bg-emerald-100 text-emerald-700" };
      case "PENDING":
        return { label: "Pending", class: "bg-amber-100 text-amber-700" };
      case "SUSPENDED":
        return { label: "Suspended", class: "bg-red-100 text-red-700" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <div
        class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
      >
        <BarChart3 size={24} class="text-white" />
      </div>
      <div>
        <h2 class="text-3xl font-bold text-blue-600">Admin Dashboard</h2>
        <p class="text-slate-500">Ringkasan platform MawarISP</p>
      </div>
    </div>
  </div>

  <!-- Main Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Revenue -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/30"
    >
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"
      ></div>
      <div class="relative z-10">
        <div class="flex items-center gap-2 text-white/80 text-sm mb-2">
          <DollarSign size={16} />
          <span>Total Revenue</span>
        </div>
        <p class="text-3xl font-bold">
          {formatCurrency(data.stats.totalRevenue)}
        </p>
        <p class="text-white/60 text-sm mt-1">
          {data.stats.paidInvoices} invoices paid
        </p>
      </div>
    </div>

    <!-- Total Mitra -->
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"
        >
          <Users size={24} class="text-emerald-600" />
        </div>
        <span
          class="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"
        >
          +{data.stats.pendingMitra} pending
        </span>
      </div>
      <p class="text-sm text-slate-500 mb-1">Total Mitra</p>
      <p class="text-2xl font-bold text-slate-900">{data.stats.totalMitra}</p>
      <p class="text-xs text-slate-400 mt-1">{data.stats.activeMitra} aktif</p>
    </div>

    <!-- Total Mikrotik -->
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"
        >
          <Server size={24} class="text-blue-600" />
        </div>
      </div>
      <p class="text-sm text-slate-500 mb-1">Total Mikrotik</p>
      <p class="text-2xl font-bold text-slate-900">
        {data.stats.totalMikrotik}
      </p>
      <p class="text-xs text-slate-400 mt-1">devices registered</p>
    </div>

    <!-- Total Customers -->
    <div
      class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"
        >
          <UserCheck size={24} class="text-amber-600" />
        </div>
      </div>
      <p class="text-sm text-slate-500 mb-1">Total Pelanggan</p>
      <p class="text-2xl font-bold text-slate-900">
        {data.stats.totalCustomers}
      </p>
      <p class="text-xs text-slate-400 mt-1">across all mitra</p>
    </div>
  </div>

  <!-- Quick Actions & Recent Mitra -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Quick Actions -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 class="text-lg font-semibold text-slate-900 mb-4">Aksi Cepat</h3>
      <div class="space-y-3">
        <a
          href="/admin/users"
          class="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
        >
          <Users size={20} />
          <span class="font-medium">Kelola Mitra</span>
        </a>
        <a
          href="/admin/paket"
          class="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
        >
          <FileText size={20} />
          <span class="font-medium">Kelola Paket</span>
        </a>
        <a
          href="/admin/mikrotik"
          class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
        >
          <Server size={20} />
          <span class="font-medium">Kelola Mikrotik</span>
        </a>
      </div>
    </div>

    <!-- Recent Mitra -->
    <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900">Mitra Terbaru</h3>
        <a
          href="/admin/users"
          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >Lihat Semua →</a
        >
      </div>

      {#if data.recentMitra.length === 0}
        <div class="text-center py-8 text-slate-500">
          <Users size={32} class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">Belum ada mitra terdaftar</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each data.recentMitra as mitra}
            {@const badge = getStatusBadge(mitra.status)}
            <div
              class="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium"
                >
                  {mitra.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p class="font-medium text-slate-900">{mitra.name}</p>
                  <p class="text-xs text-slate-500">{mitra.email}</p>
                </div>
              </div>
              <div class="text-right">
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full {badge.class}"
                >
                  {badge.label}
                </span>
                <p class="text-xs text-slate-400 mt-1">
                  {formatDate(mitra.createdAt)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
