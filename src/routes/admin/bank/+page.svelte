<script lang="ts">
  import {
    Plus,
    Edit,
    Trash2,
    CreditCard,
    Building,
    Loader2,
  } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let editingBank = $state<any>(null);
  let isSubmitting = $state(false);

  let formData = $state({
    bankName: "",
    accountNumber: "",
    accountName: "",
    branch: "",
    isActive: true,
  });

  function openAddModal() {
    editingBank = null;
    formData = {
      bankName: "",
      accountNumber: "",
      accountName: "",
      branch: "",
      isActive: true,
    };
    showModal = true;
  }

  function openEditModal(bank: any) {
    editingBank = bank;
    formData = {
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      branch: bank.branch || "",
      isActive: bank.isActive,
    };
    showModal = true;
  }
</script>

<svelte:head>
  <title>Manajemen Bank - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Manajemen Bank</h2>
      <p class="text-slate-500 mt-1">
        Kelola informasi rekening untuk pembayaran mitra
      </p>
    </div>
    <button
      class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
      onclick={openAddModal}
    >
      <Plus size={18} />
      <span>Tambah Rekening</span>
    </button>
  </div>

  {#if data.banks.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Building size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">
        Belum ada rekening bank
      </h3>
      <p class="text-sm text-slate-500 mb-6">
        Tambahkan rekening bank pertama Anda.
      </p>
      <button
        class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        onclick={openAddModal}
      >
        <Plus size={18} /><span>Tambah Rekening</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.banks as bank}
        <div
          class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all {!bank.isActive
            ? 'opacity-60'
            : ''}"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"
              >
                <Building size={24} class="text-blue-600" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{bank.bankName}</h3>
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full {bank.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'}"
                >
                  {bank.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3 text-sm mb-4">
            <div class="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <CreditCard size={16} class="text-slate-400" />
              <span class="font-mono text-slate-700 tracking-wider"
                >{bank.accountNumber}</span
              >
            </div>
            <div>
              <p class="text-slate-500 mb-1">Atas Nama</p>
              <p class="font-medium text-slate-900">{bank.accountName}</p>
            </div>
            {#if bank.branch}
              <div>
                <p class="text-slate-500 mb-1">Cabang</p>
                <p class="font-medium text-slate-900">{bank.branch}</p>
              </div>
            {/if}
          </div>

          <div class="flex gap-2 pt-4 border-t border-slate-100">
            <button
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onclick={() => openEditModal(bank)}
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>
            <form action="?/delete" method="POST" use:enhance>
              <input type="hidden" name="id" value={bank.id} />
              <button
                class="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                type="submit"
                onclick={(e) =>
                  !confirm("Yakin hapus rekening ini?") && e.preventDefault()}
              >
                <Trash2 size={14} />
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal
  bind:open={showModal}
  title={editingBank ? "Edit Rekening" : "Tambah Rekening"}
  onClose={() => (showModal = false)}
>
  {#snippet children()}
    <form
      action={editingBank ? "?/update" : "?/create"}
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
      {#if editingBank}<input
          type="hidden"
          name="id"
          value={editingBank.id}
        />{/if}

      <div class="flex flex-col gap-1.5">
        <label for="bankName" class="text-sm font-medium text-slate-700"
          >Nama Bank</label
        >
        <select
          id="bankName"
          name="bankName"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          bind:value={formData.bankName}
          required
        >
          <option value="">Pilih Bank</option>
          <option value="BCA">BCA</option>
          <option value="BRI">BRI</option>
          <option value="Mandiri">Mandiri</option>
          <option value="BNI">BNI</option>
          <option value="CIMB Niaga">CIMB Niaga</option>
          <option value="Permata">Permata</option>
          <option value="Danamon">Danamon</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="accountNumber" class="text-sm font-medium text-slate-700"
          >Nomor Rekening</label
        >
        <input
          id="accountNumber"
          type="text"
          name="accountNumber"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
          placeholder="1234567890"
          bind:value={formData.accountNumber}
          required
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="accountName" class="text-sm font-medium text-slate-700"
          >Atas Nama</label
        >
        <input
          id="accountName"
          type="text"
          name="accountName"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Nama pemilik rekening"
          bind:value={formData.accountName}
          required
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="branch" class="text-sm font-medium text-slate-700"
          >Cabang (Opsional)</label
        >
        <input
          id="branch"
          type="text"
          name="branch"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="KCP/KC cabang"
          bind:value={formData.branch}
        />
      </div>

      <label
        class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 cursor-pointer"
      >
        <input
          type="checkbox"
          name="isActive"
          class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          bind:checked={formData.isActive}
        />
        <span class="text-sm font-medium text-slate-700">Rekening Aktif</span>
      </label>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onclick={() => (showModal = false)}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
          {/if}
          <span>{editingBank ? "Simpan" : "Tambah"}</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
