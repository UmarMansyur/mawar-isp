<script lang="ts">
  import { Plus, MapPin, Edit, Trash2, Loader2, Users } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let editingArea = $state<any>(null);
  let isSubmitting = $state(false);

  let formData = $state({
    name: "",
    description: "",
  });

  function openAddModal() {
    editingArea = null;
    formData = { name: "", description: "" };
    showModal = true;
  }

  function openEditModal(area: any) {
    editingArea = area;
    formData = {
      name: area.name,
      description: area.description || "",
    };
    showModal = true;
  }
</script>

<svelte:head>
  <title>Data Area - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Data Area/Wilayah</h2>
      <p class="text-slate-500 mt-1">Kelola area/wilayah layanan WiFi</p>
    </div>
    <button class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30" onclick={openAddModal}>
      <Plus size={18} />
      <span>Tambah Area</span>
    </button>
  </div>

  {#if data.areas.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <MapPin size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Belum ada area</h3>
      <p class="text-sm text-slate-500 mb-6">Buat area/wilayah untuk mengelompokkan pelanggan.</p>
      <button class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors" onclick={openAddModal}>
        <Plus size={18} />
        <span>Tambah Area</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.areas as area}
        <div class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <MapPin size={24} class="text-white" />
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-lg text-slate-900">{area.name}</h3>
              <p class="text-sm text-slate-500 flex items-center gap-1"><Users size={12} /> {area._count.customers} pelanggan</p>
            </div>
          </div>

          {#if area.description}
            <p class="text-sm text-slate-600 mb-4">{area.description}</p>
          {/if}

          <div class="flex items-center gap-2 pt-4 border-t border-slate-100">
            <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" onclick={() => openEditModal(area)}>
              <Edit size={14} />
              <span>Edit</span>
            </button>
            <form action="?/delete" method="POST" use:enhance>
              <input type="hidden" name="id" value={area.id} />
              <button class="px-3 py-2 rounded-lg bg-slate-100 text-red-600 hover:bg-red-100 transition-colors" title="Hapus" onclick={(e) => !confirm("Yakin hapus area ini?") && e.preventDefault()}>
                <Trash2 size={14} />
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal bind:open={showModal} title={editingArea ? "Edit Area" : "Tambah Area"} onClose={() => (showModal = false)}>
  {#snippet children()}
    <form action={editingArea ? "?/update" : "?/create"} method="POST" use:enhance={() => { isSubmitting = true; return async ({ update }) => { await update(); isSubmitting = false; showModal = false; }; }} class="flex flex-col gap-4">
      {#if editingArea}
        <input type="hidden" name="id" value={editingArea.id} />
      {/if}

      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-slate-700">Nama Area</label>
        <input id="name" type="text" name="name" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Contoh: Desa Sukamaju, RT 01 RW 02" bind:value={formData.name} required />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="description" class="text-sm font-medium text-slate-700">Deskripsi (Opsional)</label>
        <textarea id="description" name="description" rows="3" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" placeholder="Deskripsi area..." bind:value={formData.description}></textarea>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onclick={() => (showModal = false)}>Batal</button>
        <button type="submit" disabled={isSubmitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2">
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
            <span>Menyimpan...</span>
          {:else}
            <span>{editingArea ? "Simpan Perubahan" : "Tambah Area"}</span>
          {/if}
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
