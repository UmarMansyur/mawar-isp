<script lang="ts">
  import { Plus, Edit, Trash2, Power, PowerOff, Search, Users, Phone, Loader2, Download, Filter, Wifi, Globe, Package, MapPin } from "lucide-svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { enhance } from "$app/forms";
  import { syncPPPSecrets, syncPPPProfiles } from "$lib/api/mikrotik";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  let showModal = $state(false);
  let editingCustomer = $state<any>(null);
  let isSubmitting = $state(false);
  let searchQuery = $state("");
  let connectionFilter = $state("all");
  let statusFilter = $state("all");
  let areaFilter = $state("all");
  let isSyncing = $state(false);

  let formData = $state({
    name: "",
    address: "",
    phone: "",
    connectionType: "PPPOE",
    username: "",
    password: "",
    mikrotikId: "",
    profileId: "",
    paketId: "",
    areaId: "",
    ipAddress: "",
    latitude: "",
    longitude: "",
    servicePrice: 100000,
    dueDate: 1,
  });

  // Get profiles for selected mikrotik
  let selectedMikrotikProfiles = $derived(() => {
    const mk = data.mikrotiks.find((m: any) => m.id === formData.mikrotikId);
    return mk?.pppProfiles || [];
  });

  // Auto-fill price when paket is selected
  $effect(() => {
    if (formData.paketId) {
      const paket = data.pakets.find((p: any) => p.id === formData.paketId);
      if (paket) {
        formData.servicePrice = paket.price;
      }
    }
  });

  let filteredPelanggan = $derived(() => {
    let result = data.pelanggan;
    if (searchQuery) {
      result = result.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.username.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (connectionFilter !== "all") {
      result = result.filter((p: any) => p.connectionType === connectionFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((p: any) => p.status === statusFilter);
    }
    if (areaFilter !== "all") {
      result = result.filter((p: any) => p.areaId === areaFilter);
    }
    return result;
  });

  function openAddModal() {
    editingCustomer = null;
    formData = {
      name: "", address: "", phone: "", connectionType: "PPPOE", username: "", password: "",
      mikrotikId: data.mikrotiks[0]?.id || "", profileId: "", paketId: "", areaId: "",
      ipAddress: "", latitude: "", longitude: "", servicePrice: 100000, dueDate: 1,
    };
    showModal = true;
  }

  function openEditModal(customer: any) {
    editingCustomer = customer;
    formData = {
      name: customer.name, address: customer.address || "", phone: customer.phone || "",
      connectionType: customer.connectionType, username: customer.username, password: "",
      mikrotikId: customer.mikrotikId, profileId: customer.profileId || "", paketId: customer.paketId || "",
      areaId: customer.areaId || "", ipAddress: customer.ipAddress || "",
      latitude: customer.latitude?.toString() || "", longitude: customer.longitude?.toString() || "",
      servicePrice: customer.servicePrice, dueDate: customer.dueDate,
    };
    showModal = true;
  }

  async function syncFromMikrotik() {
    if (!data.mikrotiks[0]) return;
    isSyncing = true;
    try {
      await syncPPPProfiles(data.mikrotiks[0].id);
      const result = await syncPPPSecrets(data.mikrotiks[0].id);
      if (result.success) {
        alert(`Berhasil sync ${result.data?.length || 0} PPP secrets. Refresh halaman.`);
      } else {
        alert(`Gagal sync: ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      isSyncing = false;
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE": return { label: "Aktif", class: "bg-emerald-100 text-emerald-700" };
      case "ISOLIR": return { label: "Isolir", class: "bg-red-100 text-red-700" };
      default: return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  }
</script>

<svelte:head>
  <title>Pelanggan - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-bold text-blue-600">Pelanggan</h2>
      <p class="text-slate-500 mt-1">Kelola data pelanggan WISP Anda</p>
    </div>
    <div class="flex items-center gap-3">
      <button onclick={syncFromMikrotik} disabled={isSyncing || !data.mikrotiks.length} class="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50">
        {#if isSyncing}<Loader2 size={18} class="animate-spin" />{:else}<Download size={18} />{/if}
        <span>Sync dari Mikrotik</span>
      </button>
      <button class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30" onclick={openAddModal}>
        <Plus size={18} />
        <span>Tambah Pelanggan</span>
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-4 mb-6">
    <div class="relative flex-1 max-w-md">
      <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="text" placeholder="Cari nama atau username..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" bind:value={searchQuery} />
    </div>
    <select class="px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" bind:value={connectionFilter}>
      <option value="all">Semua Tipe</option>
      <option value="PPPOE">PPPoE</option>
      <option value="STATIC">Static IP</option>
    </select>
    <select class="px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" bind:value={areaFilter}>
      <option value="all">Semua Area</option>
      {#each data.areas as area}
        <option value={area.id}>{area.name}</option>
      {/each}
    </select>
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}" onclick={() => (statusFilter = "all")}>Semua</button>
      <button class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}" onclick={() => (statusFilter = "ACTIVE")}>Aktif</button>
      <button class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {statusFilter === 'ISOLIR' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}" onclick={() => (statusFilter = "ISOLIR")}>Isolir</button>
    </div>
  </div>

  {#if filteredPelanggan().length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
      <Users size={48} class="mx-auto text-slate-300 mb-4" />
      <h3 class="text-lg font-medium text-slate-700 mb-2">{searchQuery ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}</h3>
      <p class="text-sm text-slate-500">{searchQuery ? "Tidak ada pelanggan dengan kriteria tersebut" : "Tambahkan pelanggan atau sync dari Mikrotik."}</p>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <p class="text-sm text-slate-600">Total: <span class="font-semibold text-slate-900">{filteredPelanggan().length}</span> pelanggan</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="px-6 py-4 text-left font-semibold text-slate-700">Pelanggan</th>
              <th class="px-6 py-4 text-left font-semibold text-slate-700">Username</th>
              <th class="px-6 py-4 text-left font-semibold text-slate-700">Paket</th>
              <th class="px-6 py-4 text-left font-semibold text-slate-700">Area</th>
              <th class="px-6 py-4 text-left font-semibold text-slate-700">Tarif</th>
              <th class="px-6 py-4 text-center font-semibold text-slate-700">Status</th>
              <th class="px-6 py-4 text-center font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPelanggan() as customer}
              {@const statusBadge = getStatusBadge(customer.status)}
              <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full {customer.status === 'ACTIVE' ? 'bg-blue-100' : 'bg-slate-200'} flex items-center justify-center text-sm font-medium {customer.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-500'}">
                      {customer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p class="font-medium text-slate-900">{customer.name}</p>
                      {#if customer.phone}<p class="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} />{customer.phone}</p>{/if}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="font-mono text-slate-700">{customer.username}</span>
                  <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    {#if customer.connectionType === 'PPPOE'}<Wifi size={10} /> PPPoE{:else}<Globe size={10} /> {customer.connectionType}{/if}
                  </p>
                </td>
                <td class="px-6 py-4">
                  {#if customer.paket}
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                      <Package size={12} /> {customer.paket.name}
                    </span>
                  {:else}
                    <span class="text-slate-400">-</span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  {#if customer.area}
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                      <MapPin size={12} /> {customer.area.name}
                    </span>
                  {:else}
                    <span class="text-slate-400">-</span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <span class="font-semibold text-slate-900">{formatCurrency(customer.servicePrice)}</span>
                  <p class="text-xs text-slate-500">Tgl {customer.dueDate}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {statusBadge.class}">{statusBadge.label}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-1">
                    {#if customer.status === "ACTIVE"}
                      <form action="?/isolir" method="POST" use:enhance><input type="hidden" name="id" value={customer.id} /><button class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Isolir"><PowerOff size={16} /></button></form>
                    {:else}
                      <form action="?/activate" method="POST" use:enhance><input type="hidden" name="id" value={customer.id} /><button class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Aktifkan"><Power size={16} /></button></form>
                    {/if}
                    <button class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onclick={() => openEditModal(customer)} title="Edit"><Edit size={16} /></button>
                    <form action="?/delete" method="POST" use:enhance><input type="hidden" name="id" value={customer.id} /><button class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus" onclick={(e) => !confirm("Yakin hapus pelanggan ini?") && e.preventDefault()}><Trash2 size={16} /></button></form>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<Modal bind:open={showModal} title={editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"} onClose={() => (showModal = false)}>
  {#snippet children()}
    <form action={editingCustomer ? "?/update" : "?/create"} method="POST" use:enhance={() => { isSubmitting = true; return async ({ update }) => { await update(); isSubmitting = false; showModal = false; }; }} class="flex flex-col gap-4">
      {#if editingCustomer}
        <input type="hidden" name="id" value={editingCustomer.id} />
        <input type="hidden" name="status" value={editingCustomer.status} />
      {/if}

      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-slate-700">Nama Pelanggan</label>
        <input id="name" type="text" name="name" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Nama lengkap" bind:value={formData.name} required />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="phone" class="text-sm font-medium text-slate-700">No. HP</label>
          <input id="phone" type="text" name="phone" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="08xxxxxxxx" bind:value={formData.phone} />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="connectionType" class="text-sm font-medium text-slate-700">Tipe Koneksi</label>
          <select id="connectionType" name="connectionType" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" bind:value={formData.connectionType}>
            <option value="PPPOE">PPPoE</option>
            <option value="STATIC">Static IP</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="address" class="text-sm font-medium text-slate-700">Alamat</label>
        <textarea id="address" name="address" rows="2" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none" placeholder="Alamat lengkap" bind:value={formData.address}></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="mikrotikId" class="text-sm font-medium text-slate-700">Mikrotik</label>
          <select id="mikrotikId" name="mikrotikId" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" bind:value={formData.mikrotikId} required>
            {#each data.mikrotiks as mk}
              <option value={mk.id}>{mk.name} ({mk.ip})</option>
            {/each}
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="areaId" class="text-sm font-medium text-slate-700">Area/Wilayah</label>
          <select id="areaId" name="areaId" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" bind:value={formData.areaId}>
            <option value="">-- Pilih Area --</option>
            {#each data.areas as area}
              <option value={area.id}>{area.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Paket Selection -->
      <div class="flex flex-col gap-1.5">
        <label for="paketId" class="text-sm font-medium text-slate-700">Paket WiFi</label>
        <select id="paketId" name="paketId" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" bind:value={formData.paketId}>
          <option value="">-- Pilih Paket --</option>
          {#each data.pakets as paket}
            <option value={paket.id}>{paket.name} - {formatCurrency(paket.price)}</option>
          {/each}
        </select>
      </div>

      {#if formData.connectionType === "PPPOE"}
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="username" class="text-sm font-medium text-slate-700">Username PPPoE</label>
            <input id="username" type="text" name="username" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="pppoe_user" bind:value={formData.username} required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-sm font-medium text-slate-700">Password</label>
            <input id="password" type="password" name="password" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder={editingCustomer ? "(tidak diubah)" : "Password"} bind:value={formData.password} />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="profileId" class="text-sm font-medium text-slate-700">PPP Profile (Mikrotik)</label>
          <select id="profileId" name="profileId" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white" bind:value={formData.profileId}>
            <option value="">-- Pilih Profile --</option>
            {#each selectedMikrotikProfiles() as profile}
              <option value={profile.id}>{profile.name} {profile.rateLimit ? `(${profile.rateLimit})` : ''}</option>
            {/each}
          </select>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="username" class="text-sm font-medium text-slate-700">Username/ID</label>
            <input id="username" type="text" name="username" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="customer_id" bind:value={formData.username} required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="ipAddress" class="text-sm font-medium text-slate-700">IP Address</label>
            <input id="ipAddress" type="text" name="ipAddress" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="192.168.x.x" bind:value={formData.ipAddress} />
          </div>
        </div>
        <input type="hidden" name="profileId" value="" />
      {/if}

      <!-- Location -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="latitude" class="text-sm font-medium text-slate-700">Latitude</label>
          <input id="latitude" type="text" name="latitude" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="-6.12345" bind:value={formData.latitude} />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="longitude" class="text-sm font-medium text-slate-700">Longitude</label>
          <input id="longitude" type="text" name="longitude" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="106.12345" bind:value={formData.longitude} />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="servicePrice" class="text-sm font-medium text-slate-700">Tarif Bulanan (Rp)</label>
          <input id="servicePrice" type="number" name="servicePrice" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" bind:value={formData.servicePrice} required />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="dueDate" class="text-sm font-medium text-slate-700">Tanggal Jatuh Tempo</label>
          <input id="dueDate" type="number" name="dueDate" min="1" max="31" class="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" bind:value={formData.dueDate} required />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onclick={() => (showModal = false)}>Batal</button>
        <button type="submit" disabled={isSubmitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2">
          {#if isSubmitting}<Loader2 size={16} class="animate-spin" /><span>Menyimpan...</span>{:else}<span>{editingCustomer ? "Simpan Perubahan" : "Tambah Pelanggan"}</span>{/if}
        </button>
      </div>
    </form>
  {/snippet}
</Modal>
