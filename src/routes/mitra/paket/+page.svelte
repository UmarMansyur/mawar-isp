<script lang="ts">
  import { Plus, Package, Edit, Trash2, Power, PowerOff, Wifi, DollarSign, Loader2, Users } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let editingPaket = $state<any>(null);
  let isSubmitting = $state(false);

  let formData = $state({
    name: "",
    description: "",
    speed: "",
    price: 100000,
  });

  function openAddModal() {
    editingPaket = null;
    formData = { name: "", description: "", speed: "", price: 100000 };
    showModal = true;
  }

  function openEditModal(paket: any) {
    editingPaket = paket;
    formData = {
      name: paket.name,
      description: paket.description || "",
      speed: paket.speed || "",
      price: paket.price,
    };
    showModal = true;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  }
</script>

<svelte:head>
  <title>Data Paket - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Data Paket WiFi</h2>
      <p class="text-slate-500 mt-1">Kelola paket harga langganan WiFi</p>
    </div>
    <button class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30" onclick={openAddModal}>
      <Plus size={18} />
      <span>Tambah Paket</span>
    </button>
  </div>

  {#if data.pakets.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Package size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Belum ada paket</h3>
      <p class="text-sm text-slate-500 mb-6">Buat paket WiFi untuk pelanggan Anda.</p>
      <button class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors" onclick={openAddModal}>
        <Plus size={18} />
        <span>Tambah Paket</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.pakets as paket}
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all {!paket.isActive ? 'opacity-60' : ''}">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Wifi size={28} class="text-white" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg text-slate-900">{paket.name}</h3>
                {#if paket.speed}
                  <p class="text-sm text-blue-600 font-medium">{paket.speed}</p>
                {/if}
              </div>
              {#if !paket.isActive}
                <span class="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-500 rounded-full">Nonaktif</span>
              {/if}
            </div>

            {#if paket.description}
              <p class="text-sm text-slate-600 mb-4">{paket.description}</p>
            {/if}

            <div class="flex items-baseline gap-1 mb-4">
              <span class="text-3xl font-bold text-slate-900">{formatCurrency(paket.price)}</span>
              <span class="text-sm text-slate-500">/bulan</span>
            </div>

            <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <Users size={14} />
              <span>{paket._count.customers} pelanggan</span>
            </div>

            <div class="flex items-center gap-2 pt-4 border-t border-slate-100">
              <form action="?/toggle" method="POST" use:enhance class="flex-1">
                <input type="hidden" name="id" value={paket.id} />
                <input type="hidden" name="isActive" value={paket.isActive} />
                <button class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors {paket.isActive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}">
                  {#if paket.isActive}
                    <PowerOff size={14} />
                    <span>Nonaktifkan</span>
                  {:else}
                    <Power size={14} />
                    <span>Aktifkan</span>
                  {/if}
                </button>
              </form>
              <button class="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" onclick={() => openEditModal(paket)} title="Edit">
                <Edit size={16} />
              </button>
              <form action="?/delete" method="POST" use:enhance>
                <input type="hidden" name="id" value={paket.id} />
                <button class="p-2 rounded-lg bg-slate-100 text-red-600 hover:bg-red-100 transition-colors" title="Hapus" onclick={(e) => !confirm("Yakin hapus paket ini?") && e.preventDefault()}>
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal bind:open={showModal} title={editingPaket ? "Edit Paket" : "Tambah Paket"} onClose={() => (showModal = false)}>
  {#snippet children()}
    <form action={editingPaket ? "?/update" : "?/create"} method="POST" use:enhance={() => { isSubmitting = true; return async ({ update }) => { await update(); isSubmitting = false; showModal = false; }; }} class="flex flex-col gap-4">
      {#if editingPaket}
        <input type="hidden" name="id" value={editingPaket.id} />
      {/if}

      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-slate-700">Nama Paket</label>
        <input id="name" type="text" name="name" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Contoh: Paket 10 Mbps" bind:value={formData.name} required />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="speed" class="text-sm font-medium text-slate-700">Kecepatan</label>
        <input id="speed" type="text" name="speed" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="Contoh: 10M/10M" bind:value={formData.speed} />
        <p class="text-xs text-slate-500">Format: Upload/Download (contoh: 10M/10M)</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="price" class="text-sm font-medium text-slate-700">Harga Bulanan (Rp)</label>
        <input id="price" type="number" name="price" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" bind:value={formData.price} required />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="description" class="text-sm font-medium text-slate-700">Deskripsi (Opsional)</label>
        <textarea id="description" name="description" rows="2" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" placeholder="Deskripsi paket..." bind:value={formData.description}></textarea>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onclick={() => (showModal = false)}>Batal</button>
        <button type="submit" disabled={isSubmitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2">
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
            <span>Menyimpan...</span>
          {:else}
            <span>{editingPaket ? "Simpan Perubahan" : "Tambah Paket"}</span>
          {/if}
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
