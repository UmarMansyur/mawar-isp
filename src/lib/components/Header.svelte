<script lang="ts">
  import {
    ChevronDown,
    Wifi,
    Package,
    Bell,
    User,
    LogOut,
    Settings,
    Check,
    AlertCircle,
  } from "lucide-svelte";

  let {
    user,
    mikrotiks = [],
    subscription = null,
    selectedMikrotik = $bindable(null),
  } = $props<{
    user: { name: string; role: string } | null;
    mikrotiks?: any[];
    subscription?: any;
    selectedMikrotik?: any;
  }>();

  let showUserDropdown = $state(false);

  function selectMikrotik(mk: any) {
    selectedMikrotik = mk;
  }

  // Calculate days remaining
  let daysRemaining = $derived(() => {
    if (!subscription?.endDate) return 0;
    const end = new Date(subscription.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  });

  let subscriptionStatus = $derived(() => {
    if (!subscription) return { type: 'none', label: 'Belum Langganan' };
    const days = daysRemaining();
    if (days <= 0) return { type: 'expired', label: 'Kedaluwarsa' };
    if (days <= 7) return { type: 'warning', label: `${days} hari lagi` };
    return { type: 'active', label: `${days} hari lagi` };
  });
</script>

<header class="sticky top-0 z-40 bg-white border-b border-slate-200">
  <div class="flex items-center justify-between h-16 px-6">
    <!-- Left: Page Title or Empty -->
    <div class="flex items-center gap-4">
      <!-- Can add breadcrumb or page title here -->
    </div>

    <!-- Right: User Info & Actions -->
    <div class="flex items-center gap-4">
      <!-- Package Info (for Mitra) -->
      {#if user?.role !== "SUPER_ADMIN"}
        {@const status = subscriptionStatus()}
        <div
          class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
            {status.type === 'expired' ? 'bg-red-50 text-red-700' : 
             status.type === 'warning' ? 'bg-amber-50 text-amber-700' : 
             status.type === 'none' ? 'bg-slate-100 text-slate-600' :
             'bg-blue-50 text-blue-700'}"
        >
          {#if status.type === 'expired' || status.type === 'none'}
            <AlertCircle size={16} />
          {:else}
            <Package size={16} />
          {/if}
          <span class="text-xs font-medium">
            {subscription?.package?.name || 'Belum Langganan'}
          </span>
          {#if subscription}
            <span class="text-xs opacity-75">• {status.label}</span>
          {/if}
        </div>
      {/if}

      <!-- Notifications -->
      <button
        class="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} class="text-slate-600" />
        <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
        ></span>
      </button>

      <!-- User Dropdown with Mikrotik Switcher -->
      <div class="relative">
        <button
          onclick={() => (showUserDropdown = !showUserDropdown)}
          class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div
            class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-md"
          >
            {user?.name?.substring(0, 2).toUpperCase() || "U"}
          </div>
          <div class="hidden sm:block text-left">
            <p class="text-sm font-semibold text-slate-900">
              {user?.name || "User"}
            </p>
            <p class="text-xs text-slate-500">
              {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Mitra"}
            </p>
          </div>
          <ChevronDown size={16} class="text-slate-400" />
        </button>

        {#if showUserDropdown}
          <div
            class="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
          >
            <!-- User Info Header -->
            <div class="px-4 py-3 border-b border-slate-100">
              <p class="text-sm font-semibold text-slate-900">
                {user?.name || "User"}
              </p>
              <p class="text-xs text-slate-500">
                {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Mitra"}
              </p>
            </div>

            <!-- Mikrotik Switcher (for Mitra only) -->
            {#if user?.role !== "SUPER_ADMIN" && mikrotiks.length > 0}
              <div class="px-2 py-2 border-b border-slate-100">
                <p
                  class="px-2 py-1 text-xs font-semibold text-slate-400 uppercase"
                >
                  Mikrotik Aktif
                </p>
                <div class="mt-1 space-y-0.5 max-h-48 overflow-y-auto">
                  {#each mikrotiks as mk}
                    <button
                      onclick={() => selectMikrotik(mk)}
                      class="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors {selectedMikrotik?.id ===
                      mk.id
                        ? 'bg-blue-50'
                        : ''}"
                    >
                      <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0"
                      >
                        <Wifi size={14} class="text-white" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-900 truncate">
                          {mk.name}
                        </p>
                        <p class="text-xs text-slate-500 truncate">{mk.ip}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        {#if mk.status === "online"}
                          <span class="w-2 h-2 rounded-full bg-emerald-500"
                          ></span>
                        {:else}
                          <span class="w-2 h-2 rounded-full bg-slate-300"
                          ></span>
                        {/if}
                        {#if selectedMikrotik?.id === mk.id}
                          <Check size={16} class="text-blue-600" />
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Menu Items -->
            <div class="py-1">
              <a
                href="/settings"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={16} />
                <span>Pengaturan</span>
              </a>
            </div>

            <hr class="border-slate-100" />

            <div class="py-1">
              <form action="/logout" method="POST">
                <button
                  type="submit"
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </form>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>
