<script lang="ts">
  import { enhance } from "$app/forms";
  import { Wifi, Mail, Lock, Loader2, ArrowRight } from "lucide-svelte";
  import type { ActionData } from "./$types.js";

  let { form } = $props<{ form: ActionData }>();
  let isSubmitting = $state(false);
</script>

<svelte:head>
  <title>Login - MawarISP</title>
</svelte:head>

<div class="min-h-screen flex bg-slate-50">
  <!-- Left Panel - Branding -->
  <div
    class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 relative overflow-hidden"
  >
    <!-- Decorative Elements -->
    <div class="absolute inset-0">
      <div
        class="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"
      ></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col justify-center px-16 text-white">
      <div class="flex items-center gap-3 mb-8">
        <div
          class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <Wifi size={28} />
        </div>
        <span class="text-3xl font-bold">MawarISP</span>
      </div>

      <h1 class="text-4xl font-bold leading-tight mb-4">
        Platform Manajemen<br />WISP Terbaik
      </h1>
      <p class="text-lg text-white/80 max-w-md">
        Kelola pelanggan, Mikrotik, tagihan, dan notifikasi dalam satu dashboard
        yang powerful.
      </p>

      <div class="mt-12 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span class="text-white/90">Sinkronisasi Mikrotik Real-time</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span class="text-white/90">Auto-Isolir Pelanggan Jatuh Tempo</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span class="text-white/90">Notifikasi WhatsApp Otomatis</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Panel - Login Form -->
  <div class="flex-1 flex items-center justify-center p-8">
    <div class="w-full max-w-md">
      <!-- Mobile Logo -->
      <div class="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white"
        >
          <Wifi size={24} />
        </div>
        <span class="text-2xl font-bold text-slate-900">MawarISP</span>
      </div>

      <div
        class="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200"
      >
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            Selamat Datang!
          </h2>
          <p class="text-slate-500">Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        {#if form?.error}
          <div
            class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
          >
            {form.error}
          </div>
        {/if}

        <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
              await update();
              isSubmitting = false;
            };
          }}
          class="flex flex-col gap-5"
        >
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium text-slate-700"
              >Email</label
            >
            <div class="relative">
              <Mail
                size={18}
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="email"
                type="email"
                name="email"
                value={form?.email ?? ""}
                class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium text-slate-700"
              >Password</label
            >
            <div class="relative">
              <Lock
                size={18}
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="password"
                type="password"
                name="password"
                class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            class="w-full py-3.5 px-4 rounded-xl bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if isSubmitting}
              <Loader2 size={20} class="animate-spin" />
              <span>Memproses...</span>
            {:else}
              <span>Masuk</span>
              <ArrowRight size={18} />
            {/if}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-slate-500 text-sm">
            Belum punya akun?
            <a
              href="/register"
              class="text-blue-600 hover:text-blue-700 font-semibold"
              >Daftar Mitra</a
            >
          </p>
        </div>
      </div>

      <p class="mt-8 text-center text-xs text-slate-400">
        © 2026 MawarISP. All rights reserved.
      </p>
    </div>
  </div>
</div>
