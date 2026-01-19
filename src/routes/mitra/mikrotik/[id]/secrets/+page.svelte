<script lang="ts">
  import { ArrowLeft, RefreshCw, Loader2, Users, Search, Power, PowerOff, Wifi, WifiOff, Download, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { onMount } from "svelte";
  import { getPPPSecrets, syncPPPSecrets, enablePPPSecret, disablePPPSecret, type PPPSecret } from "$lib/api/mikrotik";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let secrets = $state<PPPSecret[]>([]);
  let filteredSecrets = $state<PPPSecret[]>([]);
  let isLoading = $state(true);
  let isSyncing = $state(false);
  let syncCount = $state(0);
  let error = $state<string | null>(null);
  let searchQuery = $state("");
  let togglingUser = $state<string | null>(null);

  // Pagination
  let currentPage = $state(1);
  let perPage = $state(10);
  let totalPages = $derived(Math.ceil(filteredSecrets.length / perPage));
  let paginatedSecrets = $derived(filteredSecrets.slice((currentPage - 1) * perPage, currentPage * perPage));

  onMount(async () => {
    await loadSecrets();
  });

  $effect(() => {
    if (searchQuery) {
      filteredSecrets = secrets.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.profile?.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      filteredSecrets = secrets;
    }
    currentPage = 1;
  });

  async function loadSecrets() {
    isLoading = true;
    error = null;
    try {
      const result = await getPPPSecrets(data.mikrotik.id);
      if (result.success && result.data) {
        secrets = result.data;
        filteredSecrets = result.data;
      } else {
        error = result.error || "Failed to load secrets";
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
      const result = await syncPPPSecrets(data.mikrotik.id);
      if (result.success && result.data) {
        secrets = result.data;
        filteredSecrets = result.data;
        syncCount = result.data.length;
      } else {
        error = result.error || "Failed to sync secrets";
      }
    } catch (err) {
      error = String(err);
    } finally {
      isSyncing = false;
    }
  }

  async function toggleUserStatus(secret: PPPSecret) {
    togglingUser = secret.name;
    try {
      if (secret.disabled) {
        await enablePPPSecret(data.mikrotik.id, secret.name);
      } else {
        await disablePPPSecret(data.mikrotik.id, secret.name);
      }
      await loadSecrets();
    } catch (err) {
      console.error(err);
    } finally {
      togglingUser = null;
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) currentPage = page;
  }

  function getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
</script>

<svelte:head>
  <title>PPP Secrets - {data.mikrotik?.name} - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center gap-4 mb-8">
    <a href="/mitra/mikrotik" class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
      <ArrowLeft size={20} class="text-slate-600" />
    </a>
    <div class="flex-1">
      <h2 class="text-3xl font-bold text-blue-600">PPP Secrets</h2>
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
        <p class="text-sm text-emerald-600">{syncCount} PPP Secrets berhasil disinkronkan.</p>
      </div>
    </div>
  {/if}

  <!-- Search & Per Page -->
  <div class="flex flex-wrap items-center gap-4 mb-6">
    <div class="relative flex-1 max-w-md">
      <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" placeholder="Cari user..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" bind:value={searchQuery} />
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-slate-600">Per halaman:</span>
      <select class="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" bind:value={perPage} onchange={() => currentPage = 1}>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 text-red-700 p-4 rounded-xl mb-6">{error}</div>
  {/if}

  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 size={32} class="animate-spin mb-4" />
      <p>Loading secrets...</p>
    </div>
  {:else if isSyncing}
    <div class="flex flex-col items-center justify-center py-16 text-blue-600">
      <div class="relative">
        <div class="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
        <Download size={24} class="absolute inset-0 m-auto text-blue-500" />
      </div>
      <p class="mt-4 font-medium">Mengambil data dari Mikrotik...</p>
    </div>
  {:else if filteredSecrets.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Users size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">{searchQuery ? "Tidak ditemukan" : "Belum ada data"}</h3>
      <p class="text-sm text-slate-500 mb-4">{searchQuery ? `Tidak ada user dengan nama "${searchQuery}"` : "Klik 'Sync dari Mikrotik' untuk mengambil data."}</p>
      {#if !searchQuery}
        <button onclick={handleSync} class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          <Download size={18} />
          <span>Sync dari Mikrotik</span>
        </button>
      {/if}
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <p class="text-sm text-slate-600">
          Menampilkan <span class="font-semibold text-slate-900">{(currentPage - 1) * perPage + 1}</span> - <span class="font-semibold text-slate-900">{Math.min(currentPage * perPage, filteredSecrets.length)}</span> dari <span class="font-semibold text-slate-900">{filteredSecrets.length}</span> users
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="px-6 py-4 text-left font-semibold text-slate-700">User</th>
              <th class="px-6 py-4 text-left font-semibold text-slate-700">Profile</th>
              <th class="px-6 py-4 text-center font-semibold text-slate-700">Status</th>
              <th class="px-6 py-4 text-center font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedSecrets as secret}
              <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full {secret.disabled ? 'bg-slate-200' : 'bg-blue-100'} flex items-center justify-center">
                      {#if secret.disabled}
                        <WifiOff size={18} class="text-slate-500" />
                      {:else}
                        <Wifi size={18} class="text-blue-600" />
                      {/if}
                    </div>
                    <span class="font-medium text-slate-900">{secret.name}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-600">{secret.profile || "-"}</td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {secret.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                    {secret.disabled ? "Isolir" : "Aktif"}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button onclick={() => toggleUserStatus(secret)} disabled={togglingUser === secret.name} class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors {secret.disabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'} disabled:opacity-50">
                    {#if togglingUser === secret.name}
                      <Loader2 size={12} class="animate-spin" />
                    {:else if secret.disabled}
                      <Power size={12} />
                    {:else}
                      <PowerOff size={12} />
                    {/if}
                    <span>{secret.disabled ? "Aktifkan" : "Isolir"}</span>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p class="text-sm text-slate-600">Halaman {currentPage} dari {totalPages}</p>
          <div class="flex items-center gap-1">
            <button class="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft size={18} class="text-slate-600" />
            </button>
            {#each getPageNumbers() as page (page)}
              <button class="w-9 h-9 rounded-lg text-sm font-medium transition-colors {currentPage === page ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-200'}" onclick={() => goToPage(page)}>
                {page}
              </button>
            {/each}
            <button class="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors" onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight size={18} class="text-slate-600" />
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
