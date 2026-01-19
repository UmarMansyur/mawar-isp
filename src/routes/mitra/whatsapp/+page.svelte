<script lang="ts">
  import {
    Smartphone,
    Plus,
    QrCode,
    Link,
    Power,
    PowerOff,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    X,
    Phone,
  } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import type { PageData, ActionData } from "./$types.js";

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  const WA_API_URL = "http://localhost:3001";

  let showAddModal = $state(false);
  let showPairingModal = $state(false);
  let selectedDevice = $state<any>(null);
  let pairingMode = $state<"qr" | "code">("qr");
  let phoneNumber = $state("");
  let pairingCode = $state("");
  let qrCode = $state("");
  let connectionStatus = $state("");
  let connectedPhone = $state("");
  let isLoading = $state(false);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  // Poll for QR code and status
  async function pollStatus() {
    if (!selectedDevice) return;

    try {
      const res = await fetch(
        `${WA_API_URL}/devices/${selectedDevice.sessionId}/qr`,
      );
      const data = await res.json();

      qrCode = data.qrCode || "";
      pairingCode = data.pairingCode || "";
      connectionStatus = data.status || "disconnected";
      connectedPhone = data.phone || "";

      // If connected, stop polling and refresh
      if (data.status === "connected") {
        stopPolling();
        showPairingModal = false;
        await invalidateAll();
      }
    } catch (e) {
      console.error("Poll error:", e);
    }
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(pollStatus, 2000);
    pollStatus(); // Immediate first call
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function openPairingModal(device: any) {
    selectedDevice = device;
    pairingMode = "qr";
    qrCode = "";
    pairingCode = "";
    phoneNumber = "";
    connectionStatus = "";
    connectedPhone = "";
    showPairingModal = true;
    startPolling();
  }

  function closePairingModal() {
    showPairingModal = false;
    stopPolling();
    selectedDevice = null;
  }

  async function requestPairingCode() {
    if (!selectedDevice || !phoneNumber) return;

    isLoading = true;
    try {
      const res = await fetch(
        `${WA_API_URL}/devices/${selectedDevice.sessionId}/pairing-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        },
      );
      const data = await res.json();

      if (data.success) {
        pairingCode = data.pairingCode;
        connectionStatus = "waiting_pair";
      }
    } catch (e) {
      console.error("Pairing code error:", e);
    }
    isLoading = false;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "connected":
        return "bg-emerald-100 text-emerald-700";
      case "qr_pending":
      case "waiting_pair":
      case "initializing":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-red-100 text-red-700";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "connected":
        return "Terhubung";
      case "qr_pending":
        return "Menunggu QR";
      case "waiting_pair":
        return "Menunggu Pairing";
      case "initializing":
        return "Menginisialisasi";
      default:
        return "Terputus";
    }
  }

  onMount(() => {
    // Refresh data every 10 seconds
    const refreshInterval = setInterval(() => {
      invalidateAll();
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  });

  onDestroy(() => {
    stopPolling();
  });
</script>

<svelte:head>
  <title>WhatsApp Devices - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">WhatsApp Devices</h2>
      <p class="text-slate-500 mt-1">
        Kelola perangkat WhatsApp untuk notifikasi
      </p>
    </div>
    <button
      onclick={() => (showAddModal = true)}
      class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
    >
      <Plus size={18} />
      <span>Tambah Device</span>
    </button>
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

  <!-- Devices Grid -->
  {#if data.devices.length === 0}
    <div
      class="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center"
    >
      <Smartphone size={64} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Belum Ada Device</h3>
      <p class="text-sm text-slate-500 mb-6">
        Tambahkan device WhatsApp untuk mulai mengirim notifikasi
      </p>
      <button
        onclick={() => (showAddModal = true)}
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Plus size={16} />
        <span>Tambah Device Pertama</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.devices as device}
        <div
          class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center
                  {device.liveStatus === 'connected'
                  ? 'bg-emerald-100'
                  : 'bg-slate-100'}"
              >
                <Smartphone
                  size={24}
                  class={device.liveStatus === "connected"
                    ? "text-emerald-600"
                    : "text-slate-400"}
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{device.name}</h3>
                {#if device.livePhone || device.phone}
                  <p class="text-sm text-slate-500">
                    {device.livePhone || device.phone}
                  </p>
                {:else}
                  <p class="text-xs text-slate-400">Belum terhubung</p>
                {/if}
              </div>
            </div>
            <span
              class="text-xs px-2.5 py-1 rounded-full font-medium {getStatusColor(
                device.liveStatus,
              )}"
            >
              {getStatusLabel(device.liveStatus)}
            </span>
          </div>

          <div class="flex gap-2">
            {#if device.liveStatus === "connected"}
              <form
                action="?/disconnectDevice"
                method="POST"
                use:enhance
                class="flex-1"
              >
                <input type="hidden" name="deviceId" value={device.id} />
                <button
                  type="submit"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <PowerOff size={16} />
                  <span>Putuskan</span>
                </button>
              </form>
            {:else}
              <form
                action="?/connectDevice"
                method="POST"
                use:enhance={() => {
                  return async ({ result }) => {
                    if (result.type === "success") {
                      openPairingModal(device);
                    }
                  };
                }}
                class="flex-1"
              >
                <input type="hidden" name="deviceId" value={device.id} />
                <button
                  type="submit"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Power size={16} />
                  <span>Hubungkan</span>
                </button>
              </form>
            {/if}

            <form
              action="?/deleteDevice"
              method="POST"
              use:enhance
              class="shrink-0"
            >
              <input type="hidden" name="deviceId" value={device.id} />
              <button
                type="submit"
                class="flex items-center justify-center w-10 h-10 text-slate-400 bg-slate-50 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Hapus device"
              >
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add Device Modal -->
{#if showAddModal}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-2xl w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-900">Tambah Device</h3>
        <button
          onclick={() => (showAddModal = false)}
          class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <form
        action="?/addDevice"
        method="POST"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === "success") {
              showAddModal = false;
            }
            await update();
          };
        }}
      >
        <label class="block mb-4">
          <span class="text-sm font-medium text-slate-700">Nama Device</span>
          <input
            type="text"
            name="name"
            placeholder="contoh: HP Admin, WA Bisnis"
            class="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          />
        </label>

        <div class="flex gap-3">
          <button
            type="button"
            onclick={() => (showAddModal = false)}
            class="flex-1 px-4 py-2.5 text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            Tambah
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Pairing Modal -->
{#if showPairingModal && selectedDevice}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-2xl w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-900">
          Hubungkan {selectedDevice.name}
        </h3>
        <button
          onclick={closePairingModal}
          class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Status -->
      {#if connectionStatus}
        <div class="mb-4 p-3 rounded-xl bg-slate-50 flex items-center gap-3">
          {#if connectionStatus === "connected"}
            <CheckCircle size={20} class="text-emerald-500" />
            <span class="text-sm font-medium text-emerald-700">
              Terhubung dengan {connectedPhone}
            </span>
          {:else if connectionStatus === "initializing" || connectionStatus === "qr_pending" || connectionStatus === "waiting_pair"}
            <Loader2 size={20} class="text-blue-500 animate-spin" />
            <span class="text-sm font-medium text-slate-600">
              {getStatusLabel(connectionStatus)}...
            </span>
          {:else}
            <RefreshCw size={20} class="text-slate-400" />
            <span class="text-sm text-slate-500">Menunggu koneksi...</span>
          {/if}
        </div>
      {/if}

      <!-- Mode Toggle -->
      <div class="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
        <button
          onclick={() => (pairingMode = "qr")}
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            {pairingMode === 'qr'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}"
        >
          <QrCode size={16} />
          <span>QR Code</span>
        </button>
        <button
          onclick={() => (pairingMode = "code")}
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            {pairingMode === 'code'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}"
        >
          <Link size={16} />
          <span>Pairing Code</span>
        </button>
      </div>

      {#if pairingMode === "qr"}
        <!-- QR Code Mode -->
        <div class="text-center">
          {#if qrCode}
            <img
              src={qrCode}
              alt="QR Code"
              class="mx-auto w-64 h-64 rounded-xl border border-slate-200"
            />
            <p class="mt-4 text-sm text-slate-500">
              Scan QR code ini dengan aplikasi WhatsApp
            </p>
          {:else}
            <div
              class="w-64 h-64 mx-auto rounded-xl bg-slate-100 flex items-center justify-center"
            >
              <Loader2 size={32} class="text-slate-400 animate-spin" />
            </div>
            <p class="mt-4 text-sm text-slate-500">Menunggu QR code...</p>
          {/if}
        </div>
      {:else}
        <!-- Pairing Code Mode -->
        <div>
          {#if pairingCode}
            <div class="text-center mb-4">
              <p class="text-sm text-slate-500 mb-3">
                Masukkan kode ini di WhatsApp:
              </p>
              <div
                class="text-4xl font-mono font-bold tracking-widest text-blue-600 bg-blue-50 rounded-xl py-4"
              >
                {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
              </div>
              <p class="mt-4 text-xs text-slate-400">
                WhatsApp &gt; Linked Devices &gt; Link with phone number
              </p>
            </div>
          {:else}
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-2">
                Nomor WhatsApp
              </label>
              <div class="flex gap-2">
                <div
                  class="flex items-center px-3 bg-slate-100 rounded-l-xl border border-r-0 border-slate-300"
                >
                  <Phone size={16} class="text-slate-400" />
                  <span class="ml-2 text-sm text-slate-500">+62</span>
                </div>
                <input
                  type="tel"
                  bind:value={phoneNumber}
                  placeholder="8123456789"
                  class="flex-1 px-4 py-2.5 rounded-r-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <p class="mt-2 text-xs text-slate-400">
                Masukkan nomor HP yang terhubung dengan WhatsApp
              </p>
            </div>

            <button
              onclick={requestPairingCode}
              disabled={isLoading || !phoneNumber}
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isLoading}
                <Loader2 size={18} class="animate-spin" />
              {:else}
                <Link size={18} />
              {/if}
              <span>Dapatkan Kode</span>
            </button>
          {/if}
        </div>
      {/if}

      <div class="mt-6 pt-4 border-t border-slate-200">
        <button
          onclick={closePairingModal}
          class="w-full px-4 py-2.5 text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
