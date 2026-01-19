<script lang="ts">
  import { ArrowLeft, RefreshCw, Loader2, FileText, Shield, Download } from "lucide-svelte";
  import { onMount } from "svelte";
  import { getPPPProfiles, syncPPPProfiles, type PPPProfile } from "$lib/api/mikrotik";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let profiles = $state<PPPProfile[]>([]);
  let isLoading = $state(true);
  let isSyncing = $state(false);
  let syncCount = $state(0);
  let error = $state<string | null>(null);

  onMount(async () => {
    await loadProfiles();
  });

  async function loadProfiles() {
    isLoading = true;
    error = null;
    try {
      const result = await getPPPProfiles(data.mikrotik.id);
      if (result.success && result.data) {
        profiles = result.data;
      } else {
        error = result.error || "Failed to load profiles";
      }
    } catch (err) {
      error = String(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleSync() {
    isSyncing = true;
    syncCount = 0;
    error = null;
    try {
      const result = await syncPPPProfiles(data.mikrotik.id);
      if (result.success && result.data) {
        profiles = result.data;
        syncCount = result.data.length;
      } else {
        error = result.error || "Failed to sync profiles";
      }
    } catch (err) {
      error = String(err);
    } finally {
      isSyncing = false;
    }
  }
</script>

<svelte:head>
  <title>PPP Profiles - {data.mikrotik?.name} - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center gap-4 mb-8">
    <a href="/mitra/mikrotik" class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
      <ArrowLeft size={20} class="text-slate-600" />
    </a>
    <div class="flex-1">
      <h2 class="text-3xl font-bold text-blue-600">PPP Profiles</h2>
      <p class="text-slate-500">{data.mikrotik?.name} ({data.mikrotik?.ip})</p>
    </div>
    <button onclick={handleSync} disabled={isSyncing} class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50">
      {#if isSyncing}
        <Loader2 size={18} class="animate-spin" />
        <span>Syncing...</span>
      {:else}
        <Download size={18} />
        <span>Sync dari Mikrotik</span>
      {/if}
    </button>
  </div>

  <!-- Sync Success -->
  {#if syncCount > 0 && !isSyncing}
    <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
        <RefreshCw size={20} class="text-emerald-600" />
      </div>
      <div>
        <p class="text-sm font-medium text-emerald-700">Sync Berhasil!</p>
        <p class="text-sm text-emerald-600">{syncCount} PPP Profiles berhasil disinkronkan.</p>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-50 text-red-700 p-4 rounded-xl mb-6">{error}</div>
  {/if}

  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 size={32} class="animate-spin mb-4" />
      <p>Loading profiles...</p>
    </div>
  {:else if isSyncing}
    <div class="flex flex-col items-center justify-center py-16 text-blue-600">
      <div class="relative">
        <div class="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
        <Download size={24} class="absolute inset-0 m-auto text-blue-500" />
      </div>
      <p class="mt-4 font-medium">Mengambil data dari Mikrotik...</p>
    </div>
  {:else if profiles.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <FileText size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Belum ada data</h3>
      <p class="text-sm text-slate-500 mb-4">Klik "Sync dari Mikrotik" untuk mengambil data.</p>
      <button onclick={handleSync} class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
        <Download size={18} />
        <span>Sync dari Mikrotik</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each profiles as profile}
        <div class="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-all">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield size={20} class="text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">{profile.name}</h3>
              <p class="text-xs text-slate-500">PPP Profile</p>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Local Address</span>
              <span class="text-slate-700">{profile.local_address || "-"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Remote Address</span>
              <span class="text-slate-700">{profile.remote_address || "-"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Rate Limit</span>
              <span class="text-slate-700">{profile.rate_limit || "Unlimited"}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
