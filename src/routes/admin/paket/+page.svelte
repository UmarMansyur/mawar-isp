<script lang="ts">
  import { Plus, Edit, Trash2, Check, Loader2 } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let editingPaket = $state<any>(null);
  let isSubmitting = $state(false);

  let formData = $state({
    name: "",
    price: 0,
    maxMikrotik: 1,
    maxCustomers: 50,
    features: "",
    isPopular: false,
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  function openAddModal() {
    editingPaket = null;
    formData = {
      name: "",
      price: 0,
      maxMikrotik: 1,
      maxCustomers: 50,
      features: "",
      isPopular: false,
    };
    showModal = true;
  }

  function openEditModal(paket: any) {
    editingPaket = paket;
    formData = {
      name: paket.name,
      price: paket.price,
      maxMikrotik: paket.maxMikrotik,
      maxCustomers: paket.maxCustomers,
      features: paket.features,
      isPopular: paket.isPopular,
    };
    showModal = true;
  }
</script>

<svelte:head>
  <title>Paket SaaS - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Paket SaaS</h2>
      <p class="text-slate-500 mt-1">Kelola paket langganan untuk mitra</p>
    </div>
    <button
      class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
      onclick={openAddModal}
    >
      <Plus size={18} /><span>Tambah Paket</span>
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each data.packages as paket}
      <div
        class="relative bg-white rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-xl {paket.isPopular
          ? 'border-blue-500 shadow-blue-500/10'
          : 'border-slate-200'}"
      >
        {#if paket.isPopular}
          <div
            class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-0.5 rounded-full text-xs font-semibold shadow-md"
          >
            Populer
          </div>
        {/if}

        <div class="text-center mb-6">
          <h3 class="text-xl font-semibold text-slate-900 mb-2">
            {paket.name}
          </h3>
          <div class="flex items-end justify-center gap-1">
            <span class="text-3xl font-bold text-blue-600"
              >{formatCurrency(paket.price)}</span
            >
            <span class="text-sm text-slate-500 mb-1">/bulan</span>
          </div>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 mb-6 flex justify-around">
          <div class="text-center">
            <span class="block text-xl font-bold text-slate-900"
              >{paket.maxMikrotik}</span
            >
            <span class="text-xs text-slate-500">Mikrotik</span>
          </div>
          <div class="w-px bg-slate-200"></div>
          <div class="text-center">
            <span class="block text-xl font-bold text-slate-900"
              >{paket.maxCustomers === -1 ? "∞" : paket.maxCustomers}</span
            >
            <span class="text-xs text-slate-500">Pelanggan</span>
          </div>
        </div>

        <ul class="space-y-3 mb-8">
          {#each paket.features.split("\n") as feature}
            {#if feature.trim()}
              <li class="flex items-start gap-2 text-sm text-slate-600">
                <Check
                  size={16}
                  class="text-emerald-500 mt-0.5 shrink-0"
                /><span>{feature}</span>
              </li>
            {/if}
          {/each}
        </ul>

        <div class="flex justify-center gap-2 pt-4 border-t border-slate-100">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            onclick={() => openEditModal(paket)}
          >
            <Edit size={14} /><span>Edit</span>
          </button>
          <form action="?/delete" method="POST" use:enhance>
            <input type="hidden" name="id" value={paket.id} />
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              type="submit"
              onclick={(e) =>
                !confirm("Yakin hapus paket?") && e.preventDefault()}
            >
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      </div>
    {/each}
  </div>
</div>

<Modal
  bind:open={showModal}
  title={editingPaket ? "Edit Paket" : "Tambah Paket"}
  onClose={() => (showModal = false)}
>
  {#snippet children()}
    <form
      action={editingPaket ? "?/update" : "?/create"}
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
          showModal = false;
        };
      }}
      class="flex flex-col gap-4"
    >
      {#if editingPaket}<input
          type="hidden"
          name="id"
          value={editingPaket.id}
        />{/if}

      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-slate-700"
          >Nama Paket</label
        >
        <input
          id="name"
          type="text"
          name="name"
          class="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Contoh: Business"
          bind:value={formData.name}
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="price" class="text-sm font-medium text-slate-700"
            >Harga (Rp)</label
          >
          <input
            id="price"
            type="number"
            name="price"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.price}
            required
          />
        </div>
        <div class="flex items-center pt-6">
          <label
            class="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              name="isPopular"
              class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              bind:checked={formData.isPopular}
            />
            <span>Populer?</span>
          </label>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="maxMikrotik" class="text-sm font-medium text-slate-700"
            >Max Mikrotik</label
          >
          <input
            id="maxMikrotik"
            type="number"
            name="maxMikrotik"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.maxMikrotik}
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="maxCustomers" class="text-sm font-medium text-slate-700"
            >Max User (-1=Unlim)</label
          >
          <input
            id="maxCustomers"
            type="number"
            name="maxCustomers"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.maxCustomers}
            required
          />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="features" class="text-sm font-medium text-slate-700"
          >Fitur (1 per baris)</label
        >
        <textarea
          id="features"
          name="features"
          rows="5"
          class="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="Billing otomatis&#10;Notifikasi WA&#10;Helpdesk"
          bind:value={formData.features}
        ></textarea>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onclick={() => (showModal = false)}>Batal</button
        >
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}<Loader2 size={16} class="animate-spin" /><span
              >Menyimpan...</span
            >{:else}<span
              >{editingPaket ? "Simpan Perubahan" : "Tambah Paket"}</span
            >{/if}
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
