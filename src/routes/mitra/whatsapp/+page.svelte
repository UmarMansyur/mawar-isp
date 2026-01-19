<script lang="ts">
  import {
    Plus,
    Trash2,
    Smartphone,
    QrCode,
    Loader2,
    Link,
    Unlink,
    MessageCircle,
    RefreshCw,
    Check,
    X,
    Phone,
  } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showAddModal = $state(false);
  let showQRModal = $state(false);
  let showPhoneModal = $state(false);
  let isSubmitting = $state(false);
  let pairingDevice = $state<any>(null);
  let pollingQR = $state(false);
  let currentQR = $state<string | null>(null);
  let pairingCode = $state<string | null>(null);
  let phoneNumber = $state("");
  let connectionSuccess = $state(false);
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  let formData = $state({
    name: "",
  });

  function openAddModal() {
    formData = { name: "" };
    showAddModal = true;
  }

  // ===== QR Code Pairing =====
  async function startQRPairing(device: any) {
    pairingDevice = device;
    currentQR = null;
    showQRModal = true;
    pollingQR = true;

    const formDataObj = new FormData();
    formDataObj.append("deviceId", device.id);

    try {
      await fetch("?/startPairing", {
        method: "POST",
        body: formDataObj,
      });
      startQRPolling(device.id);
    } catch (err) {
      console.error("Failed to start pairing:", err);
      pollingQR = false;
    }
  }

  function startQRPolling(deviceId: string) {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const pollQR = async () => {
      try {
        const response = await fetch(`/mitra/whatsapp/qr?deviceId=${deviceId}`);

        if (response.ok) {
          const data = await response.json();
          
          console.log("QR Poll response:", data);

          if (data.qrCode) {
            currentQR = data.qrCode;
          }

          if (data.status === "connected" || data.liveStatus === "connected") {
            pollingQR = false;
            showQRModal = false;
            showPhoneModal = false;
            connectionSuccess = true;
            stopPolling();
            await invalidateAll();
            setTimeout(() => (connectionSuccess = false), 5000);
          }
        }
      } catch (err) {
        console.error("Failed to poll QR:", err);
      }
    };

    pollQR();
    pollingInterval = setInterval(pollQR, 2000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function closeQRModal() {
    showQRModal = false;
    pollingQR = false;
    currentQR = null;
    pairingDevice = null;
    stopPolling();
  }

  // ===== Phone Number Pairing =====
  function openPhonePairing(device: any) {
    pairingDevice = device;
    phoneNumber = "";
    pairingCode = null;
    showPhoneModal = true;
  }

  async function startPhonePairing() {
    if (!phoneNumber || !pairingDevice) return;

    isSubmitting = true;
    const formDataObj = new FormData();
    formDataObj.append("deviceId", pairingDevice.id);
    formDataObj.append("phoneNumber", phoneNumber);

    try {
      const response = await fetch("?/startPhonePairing", {
        method: "POST",
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.pairingCode) {
          pairingCode = result.data.pairingCode;
          // Start polling for connection
          startQRPolling(pairingDevice.id);
        }
      }
    } catch (err) {
      console.error("Failed to start phone pairing:", err);
    } finally {
      isSubmitting = false;
    }
  }

  function closePhoneModal() {
    showPhoneModal = false;
    pairingCode = null;
    phoneNumber = "";
    pairingDevice = null;
    stopPolling();
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "connected":
        return {
          bg: "bg-emerald-100 text-emerald-700",
          dot: "bg-emerald-500",
          text: "Terhubung",
        };
      case "qr_pending":
      case "pairing":
        return {
          bg: "bg-amber-100 text-amber-700",
          dot: "bg-amber-500",
          text: "Menunggu...",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-600",
          dot: "bg-slate-400",
          text: "Terputus",
        };
    }
  }

  $effect(() => {
    return () => stopPolling();
  });
</script>

<svelte:head>
  <title>WhatsApp Devices - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Success Banner -->
  {#if connectionSuccess}
    <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check size={20} class="text-emerald-600" />
      </div>
      <div>
        <p class="font-semibold text-emerald-800">WhatsApp Berhasil Terhubung!</p>
        <p class="text-sm text-emerald-600">Device siap digunakan untuk mengirim notifikasi.</p>
      </div>
    </div>
  {/if}

  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-emerald-600 flex items-center gap-3">
        <MessageCircle size={32} />
        WhatsApp Devices
      </h2>
      <p class="text-slate-500 mt-1">
        Kelola perangkat WhatsApp untuk notifikasi pelanggan
      </p>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        onclick={() => invalidateAll()}
      >
        <RefreshCw size={18} />
        <span>Refresh</span>
      </button>
      <button
        class="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
        onclick={openAddModal}
      >
        <Plus size={18} />
        <span>Tambah Device</span>
      </button>
    </div>
  </div>

  <!-- Empty State -->
  {#if data.devices.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Smartphone size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">
        Belum ada WhatsApp Device
      </h3>
      <p class="text-sm text-slate-500 mb-6">
        Tambahkan perangkat WhatsApp untuk mengirim notifikasi ke pelanggan.
      </p>
      <button
        class="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        onclick={openAddModal}
      >
        <Plus size={18} />
        <span>Tambah Device</span>
      </button>
    </div>
  {:else}
    <!-- Devices Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.devices as device}
        {@const statusBadge = getStatusBadge(device.status)}
        <div
          class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center
                {device.status === 'connected' ? 'bg-emerald-100' : 'bg-slate-100'}"
              >
                {#if device.status === "connected"}
                  <Link size={24} class="text-emerald-600" />
                {:else}
                  <Unlink size={24} class="text-slate-400" />
                {/if}
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{device.name}</h3>
                <p class="text-xs text-slate-500">{device.phone || "Belum terhubung"}</p>
              </div>
            </div>
            <span
              class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {statusBadge.bg}"
            >
              <span class="w-1.5 h-1.5 rounded-full {statusBadge.dot}"></span>
              {statusBadge.text}
            </span>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500">Notifikasi Terkirim</p>
              <p class="text-lg font-semibold text-slate-900">{device._count?.notifications || 0}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3">
              <p class="text-xs text-slate-500">Terakhir Aktif</p>
              <p class="text-sm font-medium text-slate-700">
                {device.lastActive ? new Date(device.lastActive).toLocaleDateString("id-ID") : "-"}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 pt-4 border-t border-slate-100">
            {#if device.status === "disconnected"}
              <!-- Pairing Options -->
              <div class="flex gap-2">
                <button
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                  onclick={() => startQRPairing(device)}
                >
                  <QrCode size={14} />
                  <span>Scan QR</span>
                </button>
                <button
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                  onclick={() => openPhonePairing(device)}
                >
                  <Phone size={14} />
                  <span>Pairing Code</span>
                </button>
              </div>
            {:else if device.status === "connected"}
              <form action="?/disconnect" method="POST" use:enhance>
                <input type="hidden" name="deviceId" value={device.id} />
                <button
                  type="submit"
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Unlink size={14} />
                  <span>Putuskan Koneksi</span>
                </button>
              </form>
            {:else}
              <button
                class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg cursor-wait"
                disabled
              >
                <Loader2 size={14} class="animate-spin" />
                <span>Menunggu Koneksi...</span>
              </button>
            {/if}

            <form action="?/deleteDevice" method="POST" use:enhance>
              <input type="hidden" name="deviceId" value={device.id} />
              <button
                type="submit"
                class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onclick={(e) => !confirm("Yakin ingin menghapus device ini?") && e.preventDefault()}
              >
                <Trash2 size={14} />
                <span>Hapus Device</span>
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Add Device Modal -->
<Modal bind:open={showAddModal} title="Tambah WhatsApp Device" onClose={() => (showAddModal = false)}>
  {#snippet children()}
    <form
      action="?/addDevice"
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
          showAddModal = false;
        };
      }}
      class="flex flex-col gap-4"
    >
      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-slate-700">Nama Device</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="Contoh: WhatsApp Kantor"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          bind:value={formData.name}
          required
        />
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          onclick={() => (showAddModal = false)}
        >Batal</button>
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}<Loader2 size={16} class="animate-spin" />{/if}
          <span>Tambah Device</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>

<!-- QR Code Modal -->
<Modal bind:open={showQRModal} title="Scan QR Code" onClose={closeQRModal}>
  {#snippet children()}
    <div class="flex flex-col items-center gap-4">
      {#if pollingQR && !currentQR}
        <div class="w-64 h-64 flex flex-col items-center justify-center bg-slate-100 rounded-xl">
          <Loader2 size={48} class="text-emerald-500 animate-spin mb-4" />
          <p class="text-sm text-slate-600">Generating QR Code...</p>
        </div>
      {:else if currentQR}
        <div class="p-4 bg-white border-2 border-emerald-200 rounded-2xl">
          <img src={currentQR} alt="QR Code" class="w-64 h-64" />
        </div>
        <div class="flex items-center gap-2 text-emerald-600">
          <RefreshCw size={16} class="animate-spin" />
          <span class="text-sm">Menunggu scan...</span>
        </div>
      {:else}
        <div class="w-64 h-64 flex flex-col items-center justify-center bg-red-50 rounded-xl">
          <X size={48} class="text-red-400 mb-4" />
          <p class="text-sm text-red-600">Gagal generate QR Code</p>
        </div>
      {/if}

      <div class="bg-slate-50 rounded-lg p-4 w-full text-sm text-slate-600">
        <p class="font-medium mb-2">Langkah-langkah:</p>
        <ol class="list-decimal list-inside space-y-1">
          <li>Buka WhatsApp di HP</li>
          <li>Ketuk Menu ⋮ → Linked Devices</li>
          <li>Ketuk "Link a Device"</li>
          <li>Arahkan kamera ke QR Code</li>
        </ol>
      </div>

      <button
        class="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
        onclick={closeQRModal}
      >Tutup</button>
    </div>
  {/snippet}
</Modal>

<!-- Phone Pairing Modal -->
<Modal bind:open={showPhoneModal} title="Pairing via Nomor Telepon" onClose={closePhoneModal}>
  {#snippet children()}
    <div class="flex flex-col gap-4">
      {#if !pairingCode}
        <div class="flex flex-col gap-1.5">
          <label for="phone" class="text-sm font-medium text-slate-700">Nomor WhatsApp</label>
          <input
            id="phone"
            type="tel"
            placeholder="628123456789"
            class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={phoneNumber}
          />
          <p class="text-xs text-slate-500">Masukkan nomor dengan kode negara (62 untuk Indonesia)</p>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            onclick={closePhoneModal}
          >Batal</button>
          <button
            type="button"
            disabled={isSubmitting || !phoneNumber}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
            onclick={startPhonePairing}
          >
            {#if isSubmitting}<Loader2 size={16} class="animate-spin" />{/if}
            <span>Dapatkan Kode</span>
          </button>
        </div>
      {:else}
        <div class="text-center">
          <p class="text-sm text-slate-600 mb-4">Masukkan kode ini di WhatsApp:</p>
          <div class="text-4xl font-mono font-bold text-blue-600 tracking-widest mb-4">
            {pairingCode}
          </div>
          <div class="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 size={16} class="animate-spin" />
            <span class="text-sm">Menunggu konfirmasi...</span>
          </div>
        </div>

        <div class="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p class="font-medium mb-2">Langkah-langkah:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>Buka WhatsApp di HP</li>
            <li>Ketuk Menu ⋮ → Linked Devices</li>
            <li>Ketuk "Link a Device"</li>
            <li>Ketuk "Link with phone number instead"</li>
            <li>Masukkan kode di atas</li>
          </ol>
        </div>

        <button
          class="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          onclick={closePhoneModal}
        >Tutup</button>
      {/if}
    </div>
  {/snippet}
</Modal>
