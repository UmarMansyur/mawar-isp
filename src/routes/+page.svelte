<script lang="ts">
  import {
    Wifi,
    Users,
    BarChart3,
    Shield,
    Check,
    ArrowRight,
    Zap,
    Clock,
    Bell,
  } from "lucide-svelte";
</script>

<svelte:head>
  <title>MawarISP - Platform Manajemen WISP Terbaik</title>
</svelte:head>

<div class="min-h-screen bg-white">
  <!-- Navbar -->
  <nav
    class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200"
  >
    <div class="container mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Wifi size={20} class="text-white" />
        </div>
        <span class="text-xl font-bold text-blue-600">MawarISP</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/login" class="text-slate-600 hover:text-slate-900 font-medium"
          >Masuk</a
        >
        <a
          href="/register"
          class="bg-blue-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
        >
          Daftar Gratis
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-32 pb-20 bg-gradient-to-br from-slate-50 to-blue-50">
    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto text-center">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6"
        >
          <Zap size={16} />
          <span>Platform WISP Management #1 di Indonesia</span>
        </div>
        <h1
          class="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6"
        >
          Kelola WISP Anda dengan <span class="text-blue-600">Lebih Mudah</span>
        </h1>
        <p class="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Billing otomatis, sinkronisasi Mikrotik real-time, isolir otomatis,
          dan notifikasi WhatsApp dalam satu platform.
        </p>
        <div class="flex items-center justify-center gap-4">
          <a
            href="/register"
            class="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-0.5"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight size={18} />
          </a>
          <a
            href="#features"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Lihat Fitur
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="py-16 bg-white">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div class="text-center">
          <p class="text-4xl font-bold text-blue-600">500+</p>
          <p class="text-slate-600 mt-1">Mitra Aktif</p>
        </div>
        <div class="text-center">
          <p class="text-4xl font-bold text-blue-600">50K+</p>
          <p class="text-slate-600 mt-1">Pelanggan Terkelola</p>
        </div>
        <div class="text-center">
          <p class="text-4xl font-bold text-blue-600">1M+</p>
          <p class="text-slate-600 mt-1">Notifikasi Terkirim</p>
        </div>
        <div class="text-center">
          <p class="text-4xl font-bold text-blue-600">99.9%</p>
          <p class="text-slate-600 mt-1">Uptime</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section id="features" class="py-20 bg-slate-50">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Fitur Lengkap untuk WISP Anda
        </h2>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto">
          Semua yang Anda butuhkan untuk mengelola bisnis internet Anda.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          class="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <div
            class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4"
          >
            <Wifi size={24} class="text-blue-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Sinkronisasi Mikrotik
          </h3>
          <p class="text-slate-600">
            Sinkronisasi PPPoE profiles dan secrets secara real-time dari
            perangkat Mikrotik Anda.
          </p>
        </div>

        <div
          class="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <div
            class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4"
          >
            <Clock size={24} class="text-emerald-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Auto-Isolir</h3>
          <p class="text-slate-600">
            Isolir otomatis pelanggan yang jatuh tempo. Aktifkan kembali setelah
            pembayaran.
          </p>
        </div>

        <div
          class="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <div
            class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4"
          >
            <Bell size={24} class="text-amber-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Notifikasi WhatsApp
          </h3>
          <p class="text-slate-600">
            Kirim pengingat tagihan H-3, H-0, dan H+1 secara otomatis via
            WhatsApp.
          </p>
        </div>

        <div
          class="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <div
            class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4"
          >
            <BarChart3 size={24} class="text-purple-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Laporan & Statistik
          </h3>
          <p class="text-slate-600">
            Dashboard lengkap dengan statistik pendapatan, pelanggan, dan
            performa jaringan.
          </p>
        </div>

        <div
          class="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <div
            class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4"
          >
            <Users size={24} class="text-red-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Manajemen Pelanggan
          </h3>
          <p class="text-slate-600">
            Kelola data pelanggan, tagihan, dan riwayat pembayaran dalam satu
            tempat.
          </p>
        </div>

        <div
          class="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <div
            class="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4"
          >
            <Shield size={24} class="text-teal-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">
            Aman & Terpercaya
          </h3>
          <p class="text-slate-600">
            Data Anda aman dengan enkripsi end-to-end dan backup otomatis.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section class="py-20 bg-white">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Pilih Paket yang Sesuai
        </h2>
        <p class="text-lg text-slate-600">Mulai gratis, upgrade kapan saja.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Lite -->
        <div
          class="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all"
        >
          <h3 class="text-xl font-semibold text-slate-900 mb-2">Lite</h3>
          <div class="flex items-end gap-1 mb-6">
            <span class="text-4xl font-bold text-slate-900">Rp 50K</span>
            <span class="text-slate-500 mb-1">/bulan</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> 1 Mikrotik
            </li>
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> 50 Pelanggan
            </li>
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> Notifikasi Manual
            </li>
          </ul>
          <a
            href="/register"
            class="block text-center py-3 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >Mulai</a
          >
        </div>

        <!-- Standard -->
        <div
          class="relative bg-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/30 transform scale-105"
        >
          <div
            class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold"
          >
            POPULER
          </div>
          <h3 class="text-xl font-semibold mb-2">Standard</h3>
          <div class="flex items-end gap-1 mb-6">
            <span class="text-4xl font-bold">Rp 100K</span>
            <span class="text-blue-200 mb-1">/bulan</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2">
              <Check size={18} class="text-blue-200" /> 3 Mikrotik
            </li>
            <li class="flex items-center gap-2">
              <Check size={18} class="text-blue-200" /> 200 Pelanggan
            </li>
            <li class="flex items-center gap-2">
              <Check size={18} class="text-blue-200" /> Auto-Reminder WA
            </li>
            <li class="flex items-center gap-2">
              <Check size={18} class="text-blue-200" /> Auto-Isolir
            </li>
          </ul>
          <a
            href="/register"
            class="block text-center py-3 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            >Mulai</a
          >
        </div>

        <!-- Business -->
        <div
          class="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all"
        >
          <h3 class="text-xl font-semibold text-slate-900 mb-2">Business</h3>
          <div class="flex items-end gap-1 mb-6">
            <span class="text-4xl font-bold text-slate-900">Rp 200K</span>
            <span class="text-slate-500 mb-1">/bulan</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> Unlimited Mikrotik
            </li>
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> Unlimited Pelanggan
            </li>
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> WA Broadcast
            </li>
            <li class="flex items-center gap-2 text-slate-600">
              <Check size={18} class="text-emerald-500" /> Export Excel
            </li>
          </ul>
          <a
            href="/register"
            class="block text-center py-3 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >Mulai</a
          >
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
    <div class="container mx-auto px-6 text-center">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Siap untuk Memulai?
      </h2>
      <p class="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
        Daftar sekarang dan kelola WISP Anda dengan lebih efisien.
      </p>
      <a
        href="/register"
        class="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-xl"
      >
        <span>Daftar Gratis</span>
        <ArrowRight size={20} />
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 bg-slate-900 text-slate-400">
    <div class="container mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
          >
            <Wifi size={16} class="text-white" />
          </div>
          <span class="font-semibold text-white">MawarISP</span>
        </div>
        <p class="text-sm">© 2026 MawarISP. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>
