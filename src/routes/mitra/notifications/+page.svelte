<script lang="ts">
  import {
    Bell,
    MessageSquare,
    Calendar,
    AlertCircle,
    Check,
    Loader2,
    Send,
    Settings,
  } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showSettingsModal = $state(false);
  let isSaving = $state(false);
  let statusFilter = $state("all");
  let typeFilter = $state("all");

  // Editable template state (copy from server data)
  let templateH3 = $state({ enabled: false, message: "" });
  let templateH0 = $state({ enabled: false, message: "" });
  let templateH1 = $state({ enabled: false, message: "" });

  // Initialize template state from server data
  $effect(() => {
    for (const t of data.templates || []) {
      if (t.trigger === "H-3") {
        templateH3 = { enabled: t.isActive, message: t.message };
      } else if (t.trigger === "H-0") {
        templateH0 = { enabled: t.isActive, message: t.message };
      } else if (t.trigger === "H+1") {
        templateH1 = { enabled: t.isActive, message: t.message };
      }
    }
  });

  // Filtered notifications
  let notifications = $derived(() => {
    let result = data.notifications || [];
    
    if (statusFilter !== "all") {
      result = result.filter((n: any) => n.status === statusFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((n: any) => n.type === typeFilter);
    }
    
    return result;
  });

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTypeBadgeClass(type: string) {
    switch (type) {
      case "H-3":
        return "bg-blue-100 text-blue-700";
      case "H-0":
        return "bg-amber-100 text-amber-700";
      case "H+1":
        return "bg-red-100 text-red-700";
      case "BLAST":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }
</script>

<svelte:head>
  <title>Notifikasi - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Notifikasi</h2>
      <p class="text-slate-500 mt-1">Pengaturan notifikasi otomatis WhatsApp</p>
    </div>
    <button
      onclick={() => (showSettingsModal = true)}
      class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
    >
      <Settings size={18} />
      <span>Pengaturan Template</span>
    </button>
  </div>

  <!-- Flow Visualization -->
  <div class="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
    <h3 class="text-lg font-semibold text-slate-900 mb-6">
      Alur Notifikasi Otomatis
    </h3>
    <div class="flex items-center justify-between">
      <div class="flex-1 text-center">
        <div
          class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2"
        >
          <Calendar size={24} class="text-blue-600" />
        </div>
        <p class="font-semibold text-slate-900">H-3</p>
        <p class="text-xs text-slate-500">Pengingat</p>
        <span
          class="inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium {templateH3.enabled
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'}"
        >
          {templateH3.enabled ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      <div class="w-16 h-0.5 bg-slate-200"></div>
      <div class="flex-1 text-center">
        <div
          class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2"
        >
          <AlertCircle size={24} class="text-amber-600" />
        </div>
        <p class="font-semibold text-slate-900">H-0</p>
        <p class="text-xs text-slate-500">Jatuh Tempo</p>
        <span
          class="inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium {templateH0.enabled
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'}"
        >
          {templateH0.enabled ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      <div class="w-16 h-0.5 bg-slate-200"></div>
      <div class="flex-1 text-center">
        <div
          class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2"
        >
          <Bell size={24} class="text-red-600" />
        </div>
        <p class="font-semibold text-slate-900">H+1</p>
        <p class="text-xs text-slate-500">Peringatan Isolir</p>
        <span
          class="inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium {templateH1.enabled
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'}"
        >
          {templateH1.enabled ? "Aktif" : "Nonaktif"}
        </span>
      </div>
    </div>
  </div>

  <!-- Recent Notifications -->
  <div class="bg-white rounded-2xl p-6 border border-slate-200">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-900">Riwayat Notifikasi</h3>
      <span class="text-sm text-slate-500">7 hari terakhir</span>
    </div>

    {#if notifications().length === 0}
      <div class="text-center py-8 text-slate-500">
        <MessageSquare size={32} class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">Belum ada notifikasi terkirim</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each notifications() as notif}
          <div
            class="flex items-center justify-between p-4 rounded-xl bg-slate-50"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full {notif.status === 'sent'
                  ? 'bg-emerald-100'
                  : 'bg-red-100'} flex items-center justify-center"
              >
                {#if notif.status === "sent"}
                  <Check size={18} class="text-emerald-600" />
                {:else}
                  <AlertCircle size={18} class="text-red-600" />
                {/if}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium {getTypeBadgeClass(notif.type)}"
                    >{notif.type}</span
                  >
                  <p class="font-medium text-slate-900">{notif.recipientName || 'Unknown'}</p>
                </div>
                <p class="text-xs text-slate-500">{notif.recipient}</p>
              </div>
            </div>
            <div class="text-right">
              <span
                class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full {notif.status ===
                'sent'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'}"
              >
                {notif.status === "sent" ? "Terkirim" : "Gagal"}
              </span>
              <p class="text-xs text-slate-400 mt-1">
                {formatDate(notif.sentAt || notif.createdAt)}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Modal
  bind:open={showSettingsModal}
  title="Pengaturan Template Notifikasi"
  onClose={() => (showSettingsModal = false)}
>
  {#snippet children()}
    <form
      action="?/saveTemplates"
      method="POST"
      use:enhance={() => {
        isSaving = true;
        return async ({ update }) => {
          await update();
          isSaving = false;
          showSettingsModal = false;
        };
      }}
      class="flex flex-col gap-6"
    >
      <!-- H-3 -->
      <div class="p-4 rounded-xl bg-slate-50">
        <label class="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            name="h3_enabled"
            class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            bind:checked={templateH3.enabled}
          />
          <span class="font-medium text-slate-900"
            >H-3 (Pengingat 3 hari sebelum)</span
          >
        </label>
        <textarea
          rows="2"
          name="h3_message"
          class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          bind:value={templateH3.message}
          disabled={!templateH3.enabled}
        ></textarea>
      </div>

      <!-- H-0 -->
      <div class="p-4 rounded-xl bg-slate-50">
        <label class="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            name="h0_enabled"
            class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            bind:checked={templateH0.enabled}
          />
          <span class="font-medium text-slate-900">H-0 (Jatuh Tempo)</span>
        </label>
        <textarea
          rows="2"
          name="h0_message"
          class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          bind:value={templateH0.message}
          disabled={!templateH0.enabled}
        ></textarea>
      </div>

      <!-- H+1 -->
      <div class="p-4 rounded-xl bg-slate-50">
        <label class="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            name="h1_enabled"
            class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            bind:checked={templateH1.enabled}
          />
          <span class="font-medium text-slate-900">H+1 (Peringatan Isolir)</span
          >
        </label>
        <textarea
          rows="2"
          name="h1_message"
          class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          bind:value={templateH1.message}
          disabled={!templateH1.enabled}
        ></textarea>
      </div>

      <p class="text-xs text-slate-500">
        Variabel: {`{nama}`}, {`{nominal}`}, {`{tanggal}`}
      </p>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          onclick={() => (showSettingsModal = false)}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSaving}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSaving}
            <Loader2 size={16} class="animate-spin" />
          {/if}
          <span>Simpan</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
