<script lang="ts">
  import {
    Send,
    Users,
    User,
    Smartphone,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    Loader2,
    Search,
  } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types.js";

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let mode = $state<"individual" | "blast">("individual");
  let selectedDevice = $state("");
  let selectedCustomer = $state("");
  let selectedCustomers = $state<string[]>([]);
  let message = $state("");
  let searchQuery = $state("");
  let isSubmitting = $state(false);

  let filteredCustomers = $derived(() => {
    if (!searchQuery) return data.customers;
    return data.customers.filter(
      (c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );
  });

  function toggleCustomer(id: string) {
    if (selectedCustomers.includes(id)) {
      selectedCustomers = selectedCustomers.filter((c) => c !== id);
    } else {
      selectedCustomers = [...selectedCustomers, id];
    }
  }

  function selectAll() {
    selectedCustomers = filteredCustomers().map((c: any) => c.id);
  }

  function clearSelection() {
    selectedCustomers = [];
  }

  function applyTemplate(templateMessage: string) {
    message = templateMessage;
  }
</script>

<svelte:head>
  <title>Kirim Pesan - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-blue-600">Kirim Pesan WhatsApp</h2>
    <p class="text-slate-500 mt-1">Kirim notifikasi ke pelanggan</p>
  </div>

  <!-- Check devices -->
  {#if data.devices.length === 0}
    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
      <Smartphone size={48} class="mx-auto text-amber-400 mb-4" />
      <h3 class="text-lg font-medium text-amber-800 mb-2">
        Tidak Ada Device Terhubung
      </h3>
      <p class="text-sm text-amber-600 mb-4">
        Hubungkan device WhatsApp terlebih dahulu untuk mengirim pesan
      </p>
      <a
        href="/mitra/whatsapp"
        class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <Smartphone size={16} />
        <span>Kelola Device</span>
      </a>
    </div>
  {:else}
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Settings -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Mode Toggle -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">Mode Kirim</h3>
          <div class="flex gap-2">
            <button
              onclick={() => (mode = "individual")}
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                {mode === 'individual'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
            >
              <User size={16} />
              <span>Individual</span>
            </button>
            <button
              onclick={() => (mode = "blast")}
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                {mode === 'blast'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
            >
              <Users size={16} />
              <span>Blast</span>
            </button>
          </div>
        </div>

        <!-- Device Selection -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">
            Pilih Device
          </h3>
          <select
            bind:value={selectedDevice}
            class="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Pilih device...</option>
            {#each data.devices as device}
              <option value={device.id}>
                {device.name} ({device.phone})
              </option>
            {/each}
          </select>
        </div>

        <!-- Templates -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">
            Template Pesan
          </h3>
          <div class="space-y-2">
            {#each data.templates as template}
              <button
                onclick={() => applyTemplate(template.message)}
                class="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <p class="text-sm font-medium text-slate-700">{template.name}</p>
                <p class="text-xs text-slate-500 line-clamp-2">
                  {template.message}
                </p>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Middle: Recipients -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl p-4 border border-slate-200 h-full">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-slate-700">
              {mode === "individual" ? "Pilih Pelanggan" : "Pilih Penerima"}
            </h3>
            {#if mode === "blast"}
              <span class="text-xs text-blue-600 font-medium">
                {selectedCustomers.length} dipilih
              </span>
            {/if}
          </div>

          <!-- Search -->
          <div class="relative mb-3">
            <Search
              size={16}
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              bind:value={searchQuery}
            />
          </div>

          {#if mode === "blast"}
            <div class="flex gap-2 mb-3">
              <button
                onclick={selectAll}
                class="text-xs text-blue-600 hover:underline"
              >
                Pilih Semua
              </button>
              <button
                onclick={clearSelection}
                class="text-xs text-slate-500 hover:underline"
              >
                Hapus Pilihan
              </button>
            </div>
          {/if}

          <!-- Customer List -->
          <div class="space-y-1 max-h-96 overflow-y-auto">
            {#each filteredCustomers() as customer}
              <button
                onclick={() => {
                  if (mode === "individual") {
                    selectedCustomer = customer.id;
                  } else {
                    toggleCustomer(customer.id);
                  }
                }}
                class="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors
                  {(mode === 'individual' && selectedCustomer === customer.id) ||
                (mode === 'blast' && selectedCustomers.includes(customer.id))
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-slate-50'}"
              >
                {#if mode === "blast"}
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    class="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                {/if}
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {customer.name}
                  </p>
                  <p class="text-xs text-slate-500">{customer.phone}</p>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded-full
                    {customer.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'}"
                >
                  {customer.status === "ACTIVE" ? "Aktif" : "Isolir"}
                </span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Right: Message -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl p-4 border border-slate-200 h-full flex flex-col">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">Pesan</h3>

          <textarea
            bind:value={message}
            rows="8"
            placeholder="Tulis pesan Anda..."
            class="flex-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          ></textarea>

          <p class="text-xs text-slate-500 mt-2 mb-4">
            Variabel: {"{nama}"} akan diganti dengan nama pelanggan
          </p>

          <!-- Send Button -->
          {#if mode === "individual"}
            <form
              action="?/sendMessage"
              method="POST"
              use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                  await update();
                  isSubmitting = false;
                };
              }}
            >
              <input type="hidden" name="deviceId" value={selectedDevice} />
              <input type="hidden" name="customerId" value={selectedCustomer} />
              <input type="hidden" name="message" value={message} />
              <button
                type="submit"
                disabled={isSubmitting || !selectedDevice || !selectedCustomer || !message}
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isSubmitting}
                  <Loader2 size={18} class="animate-spin" />
                {:else}
                  <Send size={18} />
                {/if}
                <span>Kirim Pesan</span>
              </button>
            </form>
          {:else}
            <form
              action="?/sendBlast"
              method="POST"
              use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                  await update();
                  isSubmitting = false;
                };
              }}
            >
              <input type="hidden" name="deviceId" value={selectedDevice} />
              {#each selectedCustomers as customerId}
                <input type="hidden" name="customerIds" value={customerId} />
              {/each}
              <input type="hidden" name="message" value={message} />
              <button
                type="submit"
                disabled={isSubmitting || !selectedDevice || selectedCustomers.length === 0 || !message}
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isSubmitting}
                  <Loader2 size={18} class="animate-spin" />
                {:else}
                  <Send size={18} />
                {/if}
                <span>Kirim ke {selectedCustomers.length} Penerima</span>
              </button>
            </form>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
