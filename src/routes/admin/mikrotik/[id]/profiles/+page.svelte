<script lang="ts">
  import { RefreshCw, ArrowLeft, Loader2, Gauge, Network } from "lucide-svelte";
  import { onMount } from "svelte";
  import {
    getPPPProfiles,
    syncPPPProfiles,
    type PPPProfile,
  } from "$lib/api/mikrotik";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let profiles = $state<PPPProfile[]>([]);
  let isLoading = $state(true);
  let isSyncing = $state(false);
  let error = $state<string | null>(null);

  onMount(async () => {
    await loadProfiles();
  });

  async function loadProfiles() {
    isLoading = true;
    error = null;
    try {
      // Load from database cache first
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
    error = null;
    try {
      // Sync from Mikrotik and save to database
      const result = await syncPPPProfiles(data.mikrotik.id);
      if (result.success && result.data) {
        profiles = result.data;
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
  <title>PPP Profiles - {data.mikrotik.name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center gap-4 mb-8">
    <a
      href="/admin/mikrotik"
      class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
    >
      <ArrowLeft size={20} />
    </a>
    <div class="flex-1">
      <h2 class="text-3xl font-bold text-blue-600">PPP Profiles</h2>
      <p class="text-slate-500 mt-1">
        {data.mikrotik.name} ({data.mikrotik.ip})
      </p>
    </div>
    <button
      class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
      onclick={handleSync}
      disabled={isSyncing}
    >
      {#if isSyncing}
        <Loader2 size={18} class="animate-spin" />
        <span>Syncing...</span>
      {:else}
        <RefreshCw size={18} />
        <span>Sync dari Mikrotik</span>
      {/if}
    </button>
  </div>

  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 size={32} class="animate-spin mb-4" />
      <p>Loading profiles...</p>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p class="text-red-600">{error}</p>
      <button
        class="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        onclick={loadProfiles}
      >
        Retry
      </button>
    </div>
  {:else if profiles.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Gauge size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Belum ada data</h3>
      <p class="text-sm text-slate-500 mb-4">
        Klik tombol 'Sync dari Mikrotik' untuk mengambil data.
      </p>
      <button
        class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        onclick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw size={18} />
        <span>Sync dari Mikrotik</span>
      </button>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="px-6 py-4 text-left font-semibold text-slate-700"
              >Name</th
            >
            <th class="px-6 py-4 text-left font-semibold text-slate-700"
              >Local Address</th
            >
            <th class="px-6 py-4 text-left font-semibold text-slate-700"
              >Remote Address</th
            >
            <th class="px-6 py-4 text-left font-semibold text-slate-700"
              >Rate Limit</th
            >
          </tr>
        </thead>
        <tbody>
          {#each profiles as profile}
            <tr
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
                  >
                    <Network size={16} class="text-white" />
                  </div>
                  <span class="font-medium text-slate-900">{profile.name}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600"
                >{profile.local_address || "-"}</td
              >
              <td class="px-6 py-4 text-slate-600"
                >{profile.remote_address || "-"}</td
              >
              <td class="px-6 py-4">
                {#if profile.rate_limit}
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    {profile.rate_limit}
                  </span>
                {:else}
                  <span class="text-slate-400">Unlimited</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="mt-6">
    <a
      href="/admin/mikrotik/{data.mikrotik.id}/secrets"
      class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
    >
      Lihat PPP Secrets →
    </a>
  </div>
</div>
