<script lang="ts">
  import {
    Plus,
    Check,
    Trash2,
    FileText,
    Search,
    Loader2,
    DollarSign,
    Clock,
    CheckCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    User,
    Download,
    MessageCircle,
  } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let isGenerating = $state(false);
  let isSendingWA = $state(false);
  let sendingInvoiceId = $state<string | null>(null);

  // Month/Year selector
  const now = new Date();
  let selectedMonth = $state(now.getMonth() + 1);
  let selectedYear = $state(now.getFullYear());

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PAID":
        return { label: "Lunas", class: "bg-emerald-100 text-emerald-700" };
      case "UNPAID":
        return { label: "Belum Bayar", class: "bg-amber-100 text-amber-700" };
      case "EXPIRED":
        return { label: "Expired", class: "bg-red-100 text-red-700" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  }

  // Server-side search and filter
  let searchInput = $state("");
  let searchTimeout: any = null;

  function handleSearch() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateUrl({ search: searchInput, page: "1" });
    }, 500);
  }

  function updateUrl(params: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }
    goto(url.toString(), { replaceState: true });
  }

  function setStatusFilter(status: string) {
    updateUrl({ status: status === "all" ? "" : status, page: "1" });
  }

  function goToPage(pageNum: number) {
    updateUrl({ page: pageNum.toString() });
  }

  async function sendNotaViaWA(invoice: any) {
    if (!invoice.customer?.phone) {
      alert("Pelanggan tidak punya nomor telepon");
      return;
    }

    sendingInvoiceId = invoice.id;
    isSendingWA = true;

    try {
      const formData = new FormData();
      formData.append("invoiceId", invoice.id);
      formData.append("customerId", invoice.customer.id);
      formData.append("phone", invoice.customer.phone);

      const response = await fetch("?/sendNotaWA", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Nota berhasil dikirim via WhatsApp!");
      } else {
        alert("Gagal mengirim nota. Pastikan WhatsApp sudah terhubung.");
      }
    } catch (err) {
      console.error("Error sending nota:", err);
      alert("Terjadi kesalahan saat mengirim nota");
    } finally {
      isSendingWA = false;
      sendingInvoiceId = null;
    }
  }

  // Get current filter from URL
  let currentStatus = $derived(page.url.searchParams.get("status") || "");
</script>

<svelte:head>
  <title>Tagihan - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div
    class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
  >
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Tagihan</h2>
      <p class="text-slate-500 mt-1">
        Kelola tagihan pelanggan ({data.totalCount || 0} total)
      </p>
    </div>

    <!-- Generate Form with Month/Year Selector -->
    <form
      action="?/generate"
      method="POST"
      use:enhance={() => {
        isGenerating = true;
        return async ({ update }) => {
          await update();
          isGenerating = false;
        };
      }}
      class="flex items-center gap-3"
    >
      <div
        class="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5"
      >
        <Calendar size={16} class="text-slate-400" />
        <select
          name="month"
          bind:value={selectedMonth}
          class="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer"
        >
          {#each months as m}
            <option value={m.value}>{m.label}</option>
          {/each}
        </select>
        <select
          name="year"
          bind:value={selectedYear}
          class="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer"
        >
          {#each years as y}
            <option value={y}>{y}</option>
          {/each}
        </select>
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
      >
        {#if isGenerating}
          <Loader2 size={18} class="animate-spin" />
          <span>Generating...</span>
        {:else}
          <Plus size={18} />
          <span>Generate Tagihan</span>
        {/if}
      </button>
    </form>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Belum Dibayar</p>
          <p class="text-2xl font-bold text-slate-900">
            {data.stats.totalUnpaid}
          </p>
        </div>
        <div
          class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"
        >
          <Clock size={20} class="text-amber-600" />
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Sudah Dibayar</p>
          <p class="text-2xl font-bold text-slate-900">
            {data.stats.totalPaid}
          </p>
        </div>
        <div
          class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"
        >
          <CheckCircle size={20} class="text-emerald-600" />
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">Total Outstanding</p>
          <p class="text-2xl font-bold text-slate-900">
            {formatCurrency(data.stats.totalAmount)}
          </p>
        </div>
        <div
          class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"
        >
          <DollarSign size={20} class="text-blue-600" />
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-4 mb-6">
    <div class="relative flex-1 max-w-md">
      <Search
        size={18}
        class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        placeholder="Cari invoice atau pelanggan..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        bind:value={searchInput}
        oninput={handleSearch}
      />
    </div>
    <div class="flex gap-2">
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {!currentStatus
          ? 'bg-blue-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => setStatusFilter("all")}
      >
        Semua
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {currentStatus ===
        'UNPAID'
          ? 'bg-amber-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => setStatusFilter("UNPAID")}
      >
        Belum Bayar
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {currentStatus ===
        'PAID'
          ? 'bg-emerald-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => setStatusFilter("PAID")}
      >
        Lunas
      </button>
    </div>
  </div>

  {#if data.invoices.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <FileText size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Tidak ada tagihan</h3>
      <p class="text-sm text-slate-500">
        Generate tagihan dengan tombol di atas.
      </p>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th class="px-6 py-4 text-left font-semibold text-slate-700"
                >No. Invoice</th
              >
              <th class="px-6 py-4 text-left font-semibold text-slate-700"
                >Pelanggan</th
              >
              <th class="px-6 py-4 text-left font-semibold text-slate-700"
                >Jumlah</th
              >
              <th class="px-6 py-4 text-left font-semibold text-slate-700"
                >Jatuh Tempo</th
              >
              <th class="px-6 py-4 text-center font-semibold text-slate-700"
                >Status</th
              >
              <th class="px-6 py-4 text-center font-semibold text-slate-700"
                >Aksi</th
              >
            </tr>
          </thead>
          <tbody>
            {#each data.invoices as invoice}
              {@const statusBadge = getStatusBadge(invoice.status)}
              <tr
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="font-mono font-medium text-slate-900"
                    >{invoice.invoiceNo}</span
                  >
                </td>
                <td class="px-6 py-4">
                  {#if invoice.customer}
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
                      >
                        <User size={14} class="text-blue-600" />
                      </div>
                      <div>
                        <p class="font-medium text-slate-900">
                          {invoice.customer.name}
                        </p>
                        <p class="text-xs text-slate-500">
                          {invoice.customer.phone || "-"}
                        </p>
                      </div>
                    </div>
                  {:else}
                    <span class="text-slate-400 text-xs italic"
                      >Tidak terhubung</span
                    >
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <span class="font-semibold text-slate-900"
                    >{formatCurrency(invoice.amount)}</span
                  >
                </td>
                <td class="px-6 py-4 text-slate-600"
                  >{formatDate(invoice.dueDate)}</td
                >
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {statusBadge.class}"
                  >
                    {statusBadge.label}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-1">
                    {#if invoice.status === "UNPAID"}
                      <form action="?/markPaid" method="POST" use:enhance>
                        <input type="hidden" name="id" value={invoice.id} />
                        <button
                          class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Tandai Lunas"
                        >
                          <Check size={16} />
                        </button>
                      </form>
                    {:else if invoice.status === "PAID"}
                      <!-- Download Nota PDF -->
                      <a
                        href="/api/nota/{invoice.id}"
                        target="_blank"
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Nota"
                      >
                        <Download size={16} />
                      </a>
                      <!-- Send via WhatsApp -->
                      {#if invoice.customer?.phone}
                        <button
                          onclick={() => sendNotaViaWA(invoice)}
                          class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Kirim Nota via WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                      {/if}
                    {/if}
                    <form action="?/delete" method="POST" use:enhance>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                        onclick={(e) =>
                          !confirm("Yakin hapus tagihan ini?") &&
                          e.preventDefault()}
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if data.totalPages > 1}
        <div
          class="flex items-center justify-between px-6 py-4 border-t border-slate-200"
        >
          <p class="text-sm text-slate-600">
            Halaman {data.currentPage} dari {data.totalPages}
          </p>
          <div class="flex items-center gap-2">
            <button
              class="p-2 rounded-lg text-black border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={data.currentPage <= 1}
              onclick={() => goToPage(data.currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            {#each Array.from( { length: Math.min(5, data.totalPages) }, (_, i) => {
                const start = Math.max(1, data.currentPage - 2);
                return start + i;
              }, ).filter((p) => p <= data.totalPages) as pageNum}
              <button
                class="w-9 h-9 rounded-lg text-sm font-medium {pageNum ===
                data.currentPage
                  ? 'bg-blue-500 text-white'
                  : 'border border-slate-300 hover:bg-slate-100 text-black'}"
                onclick={() => goToPage(pageNum)}
              >
                {pageNum}
              </button>
            {/each}

            <button
              class="p-2 text-black rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={data.currentPage >= data.totalPages}
              onclick={() => goToPage(data.currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
