<script lang="ts">
  import {
    Plus,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Send,
  } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let isSubmitting = $state(false);

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "OPEN":
        return {
          label: "Open",
          class: "bg-blue-100 text-blue-700",
          icon: AlertCircle,
        };
      case "IN_PROGRESS":
        return {
          label: "Diproses",
          class: "bg-amber-100 text-amber-700",
          icon: Clock,
        };
      case "RESOLVED":
        return {
          label: "Selesai",
          class: "bg-emerald-100 text-emerald-700",
          icon: CheckCircle,
        };
      default:
        return {
          label: status,
          class: "bg-slate-100 text-slate-700",
          icon: AlertCircle,
        };
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case "HIGH":
        return { label: "Urgent", class: "text-red-600" };
      case "MEDIUM":
        return { label: "Medium", class: "text-amber-600" };
      case "LOW":
        return { label: "Low", class: "text-slate-500" };
      default:
        return { label: priority, class: "text-slate-500" };
    }
  }

  // Computed stats from real data
  let openCount = $derived(data.tickets?.filter((t: any) => t.status === "OPEN").length || 0);
  let inProgressCount = $derived(data.tickets?.filter((t: any) => t.status === "IN_PROGRESS").length || 0);
  let resolvedCount = $derived(data.tickets?.filter((t: any) => t.status === "RESOLVED").length || 0);
</script>

<svelte:head>
  <title>Helpdesk - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Helpdesk</h2>
      <p class="text-slate-500 mt-1">Ajukan pertanyaan atau keluhan ke Admin</p>
    </div>
    <button
      class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
      onclick={() => (showModal = true)}
    >
      <Plus size={18} />
      <span>Buat Tiket</span>
    </button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"
        >
          <AlertCircle size={20} class="text-blue-600" />
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-900">{openCount}</p>
          <p class="text-sm text-slate-500">Open</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"
        >
          <Clock size={20} class="text-amber-600" />
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-900">{inProgressCount}</p>
          <p class="text-sm text-slate-500">Diproses</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"
        >
          <CheckCircle size={20} class="text-emerald-600" />
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-900">{resolvedCount}</p>
          <p class="text-sm text-slate-500">Selesai</p>
        </div>
      </div>
    </div>
  </div>

  {#if !data.tickets || data.tickets.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <MessageSquare size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Belum ada tiket</h3>
      <p class="text-sm text-slate-500">
        Buat tiket baru jika ada pertanyaan atau masalah.
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.tickets as ticket}
        {@const statusBadge = getStatusBadge(ticket.status)}
        {@const priorityBadge = getPriorityBadge(ticket.priority)}
        <div
          class="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-10 h-10 rounded-xl {statusBadge.class} flex items-center justify-center flex-shrink-0"
            >
              <svelte:component this={statusBadge.icon} size={20} />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono text-slate-500">{ticket.ticketNo}</span>
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {statusBadge.class}"
                >
                  {statusBadge.label}
                </span>
                <span class="text-xs {priorityBadge.class}"
                  >• {priorityBadge.label}</span
                >
              </div>
              <h3 class="font-semibold text-slate-900 mb-1">
                {ticket.subject}
              </h3>
              <p class="text-sm text-slate-600 line-clamp-2">
                {ticket.message}
              </p>
              <p class="text-xs text-slate-400 mt-2">
                {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal
  bind:open={showModal}
  title="Buat Tiket Baru"
  onClose={() => (showModal = false)}
>
  {#snippet children()}
    <form
      action="?/createTicket"
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
      <div class="flex flex-col gap-1.5">
        <label for="subject" class="text-sm font-medium text-slate-700"
          >Subjek</label
        >
        <input
          id="subject"
          type="text"
          name="subject"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Ringkasan masalah"
          required
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="priority" class="text-sm font-medium text-slate-700"
          >Prioritas</label
        >
        <select
          id="priority"
          name="priority"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="LOW">Low - Tidak mendesak</option>
          <option value="MEDIUM" selected>Medium - Masih bisa ditoleransi</option>
          <option value="HIGH">High - Mendesak/Urgent</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="message" class="text-sm font-medium text-slate-700"
          >Pesan</label
        >
        <textarea
          id="message"
          name="message"
          rows="4"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="Jelaskan masalah atau pertanyaan Anda secara detail"
          required
        ></textarea>
      </div>

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
          {:else}
            <Send size={16} />
          {/if}
          <span>Kirim Tiket</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
