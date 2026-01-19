<script lang="ts">
  import {
    CreditCard,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Package,
    Plus,
    RefreshCw,
    Search,
    AlertCircle,
    Loader2,
    ChevronDown,
  } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types.js";

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  let searchQuery = $state("");
  let statusFilter = $state("all");
  let showAssignModal = $state(false);
  let showExtendModal = $state(false);
  let showChangeModal = $state(false);
  let selectedUser = $state<any>(null);
  let isSubmitting = $state(false);

  let assignFormData = $state({
    packageId: "",
    durationMonths: 1,
  });

  let extendFormData = $state({
    durationMonths: 1,
  });

  let filteredUsers = $derived(() => {
    let result = data.users;

    if (searchQuery) {
      result = result.filter(
        (u: any) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter === "active") {
      result = result.filter((u: any) => u.subscription?.isActive);
    } else if (statusFilter === "expired") {
      result = result.filter(
        (u: any) => u.subscription && !u.subscription.isActive
      );
    } else if (statusFilter === "none") {
      result = result.filter((u: any) => !u.subscription);
    }

    return result;
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getDaysRemaining(endDate: string | Date) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function getSubscriptionStatus(user: any) {
    if (!user.subscription) {
      return { label: "Belum Langganan", class: "bg-slate-100 text-slate-600", icon: XCircle };
    }
    if (!user.subscription.isActive) {
      return { label: "Nonaktif", class: "bg-red-100 text-red-700", icon: XCircle };
    }
    const days = getDaysRemaining(user.subscription.endDate);
    if (days < 0) {
      return { label: "Kadaluarsa", class: "bg-red-100 text-red-700", icon: AlertCircle };
    }
    if (days <= 7) {
      return { label: `${days} hari lagi`, class: "bg-amber-100 text-amber-700", icon: Clock };
    }
    return { label: "Aktif", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
  }

  function openAssignModal(user: any) {
    selectedUser = user;
    assignFormData = { packageId: "", durationMonths: 1 };
    showAssignModal = true;
  }

  function openExtendModal(user: any) {
    selectedUser = user;
    extendFormData = { durationMonths: 1 };
    showExtendModal = true;
  }

  function openChangeModal(user: any) {
    selectedUser = user;
    assignFormData = {
      packageId: String(user.subscription?.packageId || ""),
      durationMonths: 1,
    };
    showChangeModal = true;
  }
</script>

<svelte:head>
  <title>Manajemen Langganan - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Manajemen Langganan</h2>
      <p class="text-slate-500 mt-1">
        Kelola paket langganan untuk mitra
      </p>
    </div>
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

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Users size={20} class="text-blue-600" />
        </div>
        <span class="text-sm text-slate-500">Total Mitra</span>
      </div>
      <p class="text-2xl font-bold text-slate-900">{data.stats.totalMitra}</p>
    </div>

    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={20} class="text-emerald-600" />
        </div>
        <span class="text-sm text-slate-500">Aktif</span>
      </div>
      <p class="text-2xl font-bold text-emerald-600">
        {data.stats.activeSubscriptions}
      </p>
    </div>

    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <XCircle size={20} class="text-red-600" />
        </div>
        <span class="text-sm text-slate-500">Kadaluarsa</span>
      </div>
      <p class="text-2xl font-bold text-red-600">
        {data.stats.expiredSubscriptions}
      </p>
    </div>

    <div class="bg-white rounded-2xl p-5 border border-slate-200">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Clock size={20} class="text-slate-600" />
        </div>
        <span class="text-sm text-slate-500">Belum Langganan</span>
      </div>
      <p class="text-2xl font-bold text-slate-600">{data.stats.noSubscription}</p>
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
        placeholder="Cari nama atau email mitra..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        bind:value={searchQuery}
      />
    </div>
    <div class="flex gap-2">
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter ===
        'all'
          ? 'bg-blue-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "all")}>Semua</button
      >
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter ===
        'active'
          ? 'bg-emerald-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "active")}>Aktif</button
      >
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter ===
        'expired'
          ? 'bg-red-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "expired")}>Kadaluarsa</button
      >
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter ===
        'none'
          ? 'bg-slate-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "none")}>Belum Langganan</button
      >
    </div>
  </div>

  <!-- Users Table -->
  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Mitra
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Paket
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Periode
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Mikrotik
            </th>
            <th class="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each filteredUsers() as user}
            {@const status = getSubscriptionStatus(user)}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium"
                  >
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p class="font-medium text-slate-900">{user.name}</p>
                    <p class="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                {#if user.subscription?.package}
                  <div>
                    <p class="font-medium text-slate-900">
                      {user.subscription.package.name}
                    </p>
                    <p class="text-xs text-slate-500">
                      {formatCurrency(user.subscription.package.price)}/bulan
                    </p>
                  </div>
                {:else}
                  <span class="text-slate-400">-</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                {#if user.subscription}
                  <div class="text-sm">
                    <p class="text-slate-700">
                      {formatDate(user.subscription.startDate)}
                    </p>
                    <p class="text-slate-500">
                      s/d {formatDate(user.subscription.endDate)}
                    </p>
                  </div>
                {:else}
                  <span class="text-slate-400">-</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full {status.class}"
                >
                  <svelte:component this={status.icon} size={12} />
                  {status.label}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700">
                  {user._count.mikrotiks} device
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  {#if !user.subscription}
                    <button
                      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      onclick={() => openAssignModal(user)}
                    >
                      <Plus size={14} />
                      <span>Assign Paket</span>
                    </button>
                  {:else}
                    <button
                      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                      onclick={() => openExtendModal(user)}
                    >
                      <RefreshCw size={14} />
                      <span>Perpanjang</span>
                    </button>
                    <button
                      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      onclick={() => openChangeModal(user)}
                    >
                      <Package size={14} />
                      <span>Ubah Paket</span>
                    </button>
                    {#if user.subscription.isActive}
                      <form action="?/cancelSubscription" method="POST" use:enhance>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          class="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onclick={(e) =>
                            !confirm("Yakin batalkan langganan?") &&
                            e.preventDefault()}
                        >
                          Batalkan
                        </button>
                      </form>
                    {:else}
                      <form action="?/toggleStatus" method="POST" use:enhance>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isActive" value="true" />
                        <button
                          type="submit"
                          class="px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          Aktifkan
                        </button>
                      </form>
                    {/if}
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center">
                <Users size={48} class="mx-auto text-slate-300 mb-4" />
                <p class="text-slate-500">Tidak ada mitra ditemukan</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Assign Package Modal -->
<Modal
  bind:open={showAssignModal}
  title="Assign Paket Langganan"
  onClose={() => (showAssignModal = false)}
>
  {#snippet children()}
    <form
      action="?/assignPackage"
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
          showAssignModal = false;
        };
      }}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="userId" value={selectedUser?.id} />

      <div class="p-4 rounded-xl bg-slate-50">
        <p class="text-sm text-slate-500">Mitra</p>
        <p class="font-semibold text-slate-900">{selectedUser?.name}</p>
        <p class="text-xs text-slate-500">{selectedUser?.email}</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="packageId" class="text-sm font-medium text-slate-700"
          >Pilih Paket</label
        >
        <select
          id="packageId"
          name="packageId"
          class="px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          bind:value={assignFormData.packageId}
          required
        >
          <option value="">Pilih paket...</option>
          {#each data.packages as pkg}
            <option value={pkg.id}>
              {pkg.name} - {formatCurrency(pkg.price)}/bulan
            </option>
          {/each}
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="durationMonths" class="text-sm font-medium text-slate-700"
          >Durasi (bulan)</label
        >
        <select
          id="durationMonths"
          name="durationMonths"
          class="px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          bind:value={assignFormData.durationMonths}
        >
          <option value={1}>1 bulan</option>
          <option value={3}>3 bulan</option>
          <option value={6}>6 bulan</option>
          <option value={12}>12 bulan</option>
        </select>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onclick={() => (showAssignModal = false)}>Batal</button
        >
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
          {/if}
          <span>Assign Paket</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>

<!-- Extend Subscription Modal -->
<Modal
  bind:open={showExtendModal}
  title="Perpanjang Langganan"
  onClose={() => (showExtendModal = false)}
>
  {#snippet children()}
    <form
      action="?/extendSubscription"
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
          showExtendModal = false;
        };
      }}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="userId" value={selectedUser?.id} />

      <div class="p-4 rounded-xl bg-slate-50">
        <p class="text-sm text-slate-500">Mitra</p>
        <p class="font-semibold text-slate-900">{selectedUser?.name}</p>
        <p class="text-xs text-slate-500">
          Paket: {selectedUser?.subscription?.package?.name}
        </p>
        <p class="text-xs text-slate-500 mt-1">
          Berakhir: {selectedUser?.subscription
            ? formatDate(selectedUser.subscription.endDate)
            : "-"}
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="extendDuration" class="text-sm font-medium text-slate-700"
          >Tambah Durasi</label
        >
        <select
          id="extendDuration"
          name="durationMonths"
          class="px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          bind:value={extendFormData.durationMonths}
        >
          <option value={1}>1 bulan</option>
          <option value={3}>3 bulan</option>
          <option value={6}>6 bulan</option>
          <option value={12}>12 bulan</option>
        </select>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onclick={() => (showExtendModal = false)}>Batal</button
        >
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
          {/if}
          <span>Perpanjang</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>

<!-- Change Package Modal -->
<Modal
  bind:open={showChangeModal}
  title="Ubah Paket Langganan"
  onClose={() => (showChangeModal = false)}
>
  {#snippet children()}
    <form
      action="?/changePackage"
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
          showChangeModal = false;
        };
      }}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="userId" value={selectedUser?.id} />

      <div class="p-4 rounded-xl bg-slate-50">
        <p class="text-sm text-slate-500">Mitra</p>
        <p class="font-semibold text-slate-900">{selectedUser?.name}</p>
        <p class="text-xs text-slate-500">
          Paket saat ini: {selectedUser?.subscription?.package?.name}
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="newPackageId" class="text-sm font-medium text-slate-700"
          >Paket Baru</label
        >
        <select
          id="newPackageId"
          name="packageId"
          class="px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          bind:value={assignFormData.packageId}
          required
        >
          {#each data.packages as pkg}
            <option value={pkg.id}>
              {pkg.name} - {formatCurrency(pkg.price)}/bulan
            </option>
          {/each}
        </select>
      </div>

      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onclick={() => (showChangeModal = false)}>Batal</button
        >
        <button
          type="submit"
          disabled={isSubmitting}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
        >
          {#if isSubmitting}
            <Loader2 size={16} class="animate-spin" />
          {/if}
          <span>Ubah Paket</span>
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
