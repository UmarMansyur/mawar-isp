<script lang="ts">
  import {
    Plus,
    Edit,
    Trash2,
    Wifi,
    WifiOff,
    Server,
    Loader2,
    TestTube,
    Users,
    FileText,
  } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import { testMikrotikConnection } from "$lib/api/mikrotik";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let editingDevice = $state<any>(null);
  let isSubmitting = $state(false);
  let testingConnection = $state<string | null>(null);
  let testResult = $state<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  let formData = $state({
    name: "",
    ip: "",
    port: 8728,
    username: "admin",
    password: "",
  });

  function openAddModal() {
    editingDevice = null;
    formData = {
      name: "",
      ip: "",
      port: 8728,
      username: "admin",
      password: "",
    };
    showModal = true;
  }

  function openEditModal(device: any) {
    editingDevice = device;
    formData = {
      name: device.name,
      ip: device.ip,
      port: device.port,
      username: device.username,
      password: "",
    };
    showModal = true;
  }

  async function handleTestConnection(deviceId: string) {
    testingConnection = deviceId;
    testResult = null;

    try {
      const result = await testMikrotikConnection(deviceId);
      testResult = {
        id: deviceId,
        success: result.success,
        message: result.success
          ? `Connected: ${result.data?.identity || "OK"}`
          : result.error || "Connection failed",
      };
    } catch (err) {
      testResult = { id: deviceId, success: false, message: String(err) };
    } finally {
      testingConnection = null;
    }
  }
</script>

<svelte:head>
  <title>Mikrotik Saya - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Mikrotik Saya</h2>
      <p class="text-slate-500 mt-1">Kelola perangkat Mikrotik Anda</p>
    </div>
    <button
      class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
      onclick={openAddModal}
    >
      <Plus size={18} />
      <span>Tambah Mikrotik</span>
    </button>
  </div>

  {#if data.mikrotiks.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Server size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">
        Belum ada Mikrotik
      </h3>
      <p class="text-sm text-slate-500 mb-6">
        Tambahkan perangkat Mikrotik pertama Anda.
      </p>
      <button
        class="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        onclick={openAddModal}
      >
        <Plus size={18} />
        <span>Tambah Mikrotik</span>
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.mikrotiks as device}
        <div
          class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"
              >
                {#if device.status === "online"}
                  <Wifi size={24} class="text-blue-600" />
                {:else}
                  <WifiOff size={24} class="text-slate-400" />
                {/if}
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{device.name}</h3>
                <p class="text-sm text-slate-500">{device.ip}:{device.port}</p>
              </div>
            </div>
            <span
              class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              {device.status === 'online'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'}"
            >
              <span
                class="w-1.5 h-1.5 rounded-full {device.status === 'online'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'}"
              ></span>
              {device.status === "online" ? "Online" : "Offline"}
            </span>
          </div>

          {#if testResult?.id === device.id}
            <div
              class="mb-4 p-3 rounded-lg text-sm {testResult.success
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'}"
            >
              {testResult.message}
            </div>
          {/if}

          <div class="flex flex-wrap gap-2 mb-4">
            <button
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              onclick={() => handleTestConnection(device.id)}
              disabled={testingConnection === device.id}
            >
              {#if testingConnection === device.id}
                <Loader2 size={14} class="animate-spin" />
              {:else}
                <TestTube size={14} />
              {/if}
              <span>Test</span>
            </button>
            <a
              href="/mitra/mikrotik/{device.id}/secrets"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Users size={14} />
              <span>Secrets</span>
            </a>
            <a
              href="/mitra/mikrotik/{device.id}/profiles"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <FileText size={14} />
              <span>Profiles</span>
            </a>
          </div>

          <div class="flex gap-2 pt-4 border-t border-slate-100">
            <button
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onclick={() => openEditModal(device)}
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>
            <form action="?/delete" method="POST" use:enhance class="flex-1">
              <input type="hidden" name="id" value={device.id} />
              <button
                type="submit"
                class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onclick={(e) => !confirm("Yakin hapus?") && e.preventDefault()}
              >
                <Trash2 size={14} />
                <span>Hapus</span>
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
  title={editingDevice ? "Edit Mikrotik" : "Tambah Mikrotik"}
  onClose={() => (showModal = false)}
>
  {#snippet children()}
    <form
      action={editingDevice ? "?/update" : "?/create"}
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
      {#if editingDevice}
        <input type="hidden" name="id" value={editingDevice.id} />
      {/if}

      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-slate-700">Nama</label
        >
        <input
          id="name"
          type="text"
          name="name"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          bind:value={formData.name}
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="ip" class="text-sm font-medium text-slate-700"
            >IP Address</label
          >
          <input
            id="ip"
            type="text"
            name="ip"
            class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.ip}
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="port" class="text-sm font-medium text-slate-700"
            >Port</label
          >
          <input
            id="port"
            type="number"
            name="port"
            class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.port}
            required
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="username" class="text-sm font-medium text-slate-700"
            >Username</label
          >
          <input
            id="username"
            type="text"
            name="username"
            class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.username}
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-medium text-slate-700"
            >Password</label
          >
          <input
            id="password"
            type="password"
            name="password"
            class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            bind:value={formData.password}
          />
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          onclick={() => (showModal = false)}>Batal</button
        >
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
          {/if}
          <span>{editingDevice ? "Simpan" : "Tambah"}</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
