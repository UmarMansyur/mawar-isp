<script lang="ts">
  import {
    Users,
    UserCheck,
    UserX,
    Trash2,
    Search,
    Mail,
    Phone,
    Calendar,
  } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();
  let searchQuery = $state("");
  let statusFilter = $state("all");

  let filteredUsers = $derived(() => {
    let result = data.users;
    if (searchQuery) {
      result = result.filter(
        (u: any) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((u: any) => u.status === statusFilter);
    }
    return result;
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return { label: "Aktif", class: "bg-emerald-100 text-emerald-700" };
      case "PENDING":
        return { label: "Pending", class: "bg-amber-100 text-amber-700" };
      case "SUSPENDED":
        return { label: "Suspended", class: "bg-red-100 text-red-700" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  }
</script>

<svelte:head>
  <title>Kelola Mitra - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Kelola Mitra</h2>
      <p class="text-slate-500 mt-1">
        Approve, suspend, atau kelola akun mitra
      </p>
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
        placeholder="Cari nama atau email..."
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
        'PENDING'
          ? 'bg-amber-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "PENDING")}>Pending</button
      >
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter ===
        'ACTIVE'
          ? 'bg-emerald-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "ACTIVE")}>Aktif</button
      >
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter ===
        'SUSPENDED'
          ? 'bg-red-500 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        onclick={() => (statusFilter = "SUSPENDED")}>Suspended</button
      >
    </div>
  </div>

  {#if filteredUsers().length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Users size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">Tidak ada mitra</h3>
      <p class="text-sm text-slate-500">Belum ada mitra yang terdaftar.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredUsers() as user}
        {@const badge = getStatusBadge(user.status)}
        <div
          class="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold"
              >
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">{user.name}</h3>
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full {badge.class}"
                  >{badge.label}</span
                >
              </div>
            </div>
          </div>

          <div class="space-y-2 text-sm text-slate-500 mb-4">
            <div class="flex items-center gap-2">
              <Mail size={14} /><span>{user.email}</span>
            </div>
            {#if user.phone}<div class="flex items-center gap-2">
                <Phone size={14} /><span>{user.phone}</span>
              </div>{/if}
            <div class="flex items-center gap-2">
              <Calendar size={14} /><span
                >Bergabung {formatDate(user.createdAt)}</span
              >
            </div>
          </div>

          {#if user.subscription}
            <div class="mb-4 p-3 rounded-xl bg-blue-50">
              <p class="text-xs text-blue-600 font-medium">Paket Aktif</p>
              <p class="text-sm font-semibold text-blue-700">
                {user.subscription.package?.name || "N/A"}
              </p>
            </div>
          {/if}

          <div class="flex gap-2">
            {#if user.status === "PENDING"}
              <form action="?/approve" method="POST" use:enhance class="flex-1">
                <input type="hidden" name="id" value={user.id} />
                <button
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  <UserCheck size={16} /><span>Approve</span>
                </button>
              </form>
            {:else if user.status === "ACTIVE"}
              <form action="?/suspend" method="POST" use:enhance class="flex-1">
                <input type="hidden" name="id" value={user.id} />
                <button
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <UserX size={16} /><span>Suspend</span>
                </button>
              </form>
            {:else}
              <form action="?/approve" method="POST" use:enhance class="flex-1">
                <input type="hidden" name="id" value={user.id} />
                <button
                  class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  <UserCheck size={16} /><span>Activate</span>
                </button>
              </form>
            {/if}
            <form action="?/delete" method="POST" use:enhance>
              <input type="hidden" name="id" value={user.id} />
              <button
                class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onclick={(e) =>
                  !confirm("Yakin hapus mitra ini?") && e.preventDefault()}
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
