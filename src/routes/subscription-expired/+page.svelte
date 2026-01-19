<script lang="ts">
  import {
    AlertCircle,
    Package,
    Clock,
    ArrowRight,
    PhoneCall,
    Mail,
  } from "lucide-svelte";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Langganan Kedaluwarsa - MawarISP</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <div class="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
      <!-- Icon -->
      <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={40} class="text-red-500" />
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-slate-900 mb-2">
        Langganan Tidak Aktif
      </h1>
      <p class="text-slate-500 mb-6">
        Akses Anda ke panel mitra telah dibatasi karena langganan Anda belum aktif atau sudah kedaluwarsa.
      </p>

      <!-- Status Card -->
      <div class="bg-slate-50 rounded-2xl p-6 mb-6 text-left">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
            <Package size={20} class="text-slate-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">Status Langganan</p>
            <p class="font-semibold text-red-600">
              {#if data.subscription}
                Kedaluwarsa
              {:else}
                Belum Berlangganan
              {/if}
            </p>
          </div>
        </div>

        {#if data.subscription}
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
              <Clock size={20} class="text-slate-600" />
            </div>
            <div>
              <p class="text-sm text-slate-500">Berakhir Pada</p>
              <p class="font-semibold text-slate-900">
                {new Date(data.subscription.endDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Action -->
      <div class="space-y-3">
        <p class="text-sm text-slate-600 mb-4">
          Silakan hubungi admin untuk memperpanjang langganan Anda.
        </p>

        <div class="flex flex-col gap-2">
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            class="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
          >
            <PhoneCall size={18} />
            <span>Hubungi Admin via WhatsApp</span>
          </a>
          <a
            href="mailto:admin@mawar-isp.com"
            class="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Mail size={18} />
            <span>Email Admin</span>
          </a>
        </div>
      </div>

      <!-- Logout Link -->
      <div class="mt-6 pt-6 border-t border-slate-100">
        <form action="/logout" method="POST">
          <button
            type="submit"
            class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Logout dari akun
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
