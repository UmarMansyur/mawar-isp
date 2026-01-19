<script lang="ts">
  import {
    User,
    Mail,
    Lock,
    Save,
    Loader2,
    Moon,
    Sun,
    Bell,
    CheckCircle,
    AlertCircle,
  } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types.js";

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let isSavingProfile = $state(false);
  let isSavingPassword = $state(false);
  let darkMode = $state(false);
  let notifications = $state(true);

  let profileData = $state({
    name: data.user?.name || "",
    email: data.user?.email || "",
  });

  let passwordData = $state({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Reset password fields after successful update
  $effect(() => {
    if (form?.success && form?.message?.includes("Password")) {
      passwordData = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
    }
  });
</script>

<svelte:head>
  <title>Pengaturan - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-blue-600">Pengaturan</h2>
    <p class="text-slate-500 mt-1">Kelola profil dan preferensi akun Anda</p>
  </div>

  <!-- Success/Error Messages -->
  {#if form?.success}
    <div
      class="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
    >
      <CheckCircle size={20} class="text-emerald-600" />
      <p class="text-sm font-medium text-emerald-700">{form.message}</p>
    </div>
  {/if}
  {#if form?.error}
    <div
      class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3"
    >
      <AlertCircle size={20} class="text-red-600" />
      <p class="text-sm font-medium text-red-700">{form.error}</p>
    </div>
  {/if}

  <div class="space-y-6">
    <!-- Profile Section -->
    <form
      action="?/updateProfile"
      method="POST"
      use:enhance={() => {
        isSavingProfile = true;
        return async ({ update }) => {
          await update();
          isSavingProfile = false;
        };
      }}
      class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
    >
      <h3
        class="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2"
      >
        <User size={20} class="text-blue-600" />
        Profil
      </h3>

      <div class="flex items-center gap-6 mb-6">
        <div
          class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
        >
          {data.user?.name?.substring(0, 2).toUpperCase() || "U"}
        </div>
        <div>
          <h4 class="text-xl font-semibold text-slate-900">
            {data.user?.name || "User"}
          </h4>
          <p class="text-slate-500">
            {data.user?.email || "email@example.com"}
          </p>
          <span
            class="inline-flex mt-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
          >
            {data.user?.role === "SUPER_ADMIN" ? "Super Admin" : "Mitra"}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="name" class="text-sm font-medium text-slate-700"
            >Nama</label
          >
          <div class="relative">
            <User
              size={18}
              class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="name"
              type="text"
              name="name"
              class="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              bind:value={profileData.name}
              required
            />
          </div>
        </div>
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
              class="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              bind:value={profileData.email}
              required
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isSavingProfile}
          class="flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {#if isSavingProfile}
            <Loader2 size={18} class="animate-spin" />
            <span>Menyimpan...</span>
          {:else}
            <Save size={18} />
            <span>Simpan Profil</span>
          {/if}
        </button>
      </div>
    </form>

    <!-- Password Section -->
    <form
      action="?/updatePassword"
      method="POST"
      use:enhance={() => {
        isSavingPassword = true;
        return async ({ update }) => {
          await update();
          isSavingPassword = false;
        };
      }}
      class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
    >
      <h3
        class="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2"
      >
        <Lock size={20} class="text-blue-600" />
        Ubah Password
      </h3>

      <div class="space-y-4">
        <div class="flex flex-col gap-2">
          <label for="currentPassword" class="text-sm font-medium text-slate-700"
            >Password Saat Ini</label
          >
          <input
            id="currentPassword"
            type="password"
            name="currentPassword"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
            bind:value={passwordData.currentPassword}
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="newPassword" class="text-sm font-medium text-slate-700"
              >Password Baru</label
            >
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              bind:value={passwordData.newPassword}
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              for="confirmPassword"
              class="text-sm font-medium text-slate-700"
              >Konfirmasi Password</label
            >
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              bind:value={passwordData.confirmPassword}
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          type="submit"
          disabled={isSavingPassword}
          class="flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {#if isSavingPassword}
            <Loader2 size={18} class="animate-spin" />
            <span>Menyimpan...</span>
          {:else}
            <Lock size={18} />
            <span>Ubah Password</span>
          {/if}
        </button>
      </div>
    </form>

    <!-- Preferences Section -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-900 mb-6">Preferensi</h3>

      <div class="space-y-4">
        <div
          class="flex items-center justify-between p-4 rounded-xl bg-slate-50"
        >
          <div class="flex items-center gap-3">
            {#if darkMode}
              <Moon size={20} class="text-blue-600" />
            {:else}
              <Sun size={20} class="text-amber-500" />
            {/if}
            <div>
              <p class="font-medium text-slate-900">Mode Gelap</p>
              <p class="text-sm text-slate-500">Aktifkan tampilan gelap</p>
            </div>
          </div>
          <button
            aria-label="Toggle dark mode"
            class="relative w-12 h-6 rounded-full transition-colors {darkMode
              ? 'bg-blue-600'
              : 'bg-slate-300'}"
            onclick={() => (darkMode = !darkMode)}
          >
            <span
              class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {darkMode
                ? 'translate-x-6'
                : ''}"
            ></span>
          </button>
        </div>

        <div
          class="flex items-center justify-between p-4 rounded-xl bg-slate-50"
        >
          <div class="flex items-center gap-3">
            <Bell size={20} class="text-blue-600" />
            <div>
              <p class="font-medium text-slate-900">Notifikasi Email</p>
              <p class="text-sm text-slate-500">Terima update via email</p>
            </div>
          </div>
          <button
            aria-label="Toggle notifications"
            class="relative w-12 h-6 rounded-full transition-colors {notifications
              ? 'bg-blue-600'
              : 'bg-slate-300'}"
            onclick={() => (notifications = !notifications)}
          >
            <span
              class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform {notifications
                ? 'translate-x-6'
                : ''}"
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
