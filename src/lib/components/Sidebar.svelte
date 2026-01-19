<script lang="ts">
  import { page } from "$app/stores";
  import {
    LayoutDashboard,
    Package,
    Wifi,
    Users,
    FileText,
    LogOut,
    Settings,
    Bell,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    CreditCard,
    MapPin,
    Receipt,
    MessageSquareShare
  } from "lucide-svelte";

  interface MenuItem {
    label: string;
    href: string;
    icon: any;
  }

  // Admin menu items
  const adminMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Paket SaaS", href: "/admin/paket", icon: Package },
    { label: "Kelola Mitra", href: "/admin/users", icon: UserCheck },
    { label: "Langganan", href: "/admin/subscriptions", icon: Receipt },
    { label: "Mikrotik", href: "/admin/mikrotik", icon: Wifi },
    { label: "Bank", href: "/admin/bank", icon: CreditCard },
    { label: "Notifikasi", href: "/admin/notifications", icon: Bell },
  ];

  // Mitra menu items
  const mitraMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/mitra/dashboard", icon: LayoutDashboard },
    { label: "Mikrotik", href: "/mitra/mikrotik", icon: Wifi },
    { label: "Data Paket", href: "/mitra/paket", icon: Package },
    { label: "Data Area", href: "/mitra/area", icon: MapPin },
    { label: "Pelanggan", href: "/mitra/pelanggan", icon: Users },
    { label: "Tagihan", href: "/mitra/tagihan", icon: FileText },
    { label: "WhatsApp", href: "/mitra/whatsapp", icon: Wifi },
    { label: "Kirim Pesan", href: "/mitra/send", icon: MessageSquareShare },
    { label: "Notifikasi", href: "/mitra/notifications", icon: Bell },
    { label: "Helpdesk", href: "/mitra/helpdesk", icon: HelpCircle },
  ];

  let { user, isCollapsed = $bindable(false) } = $props<{
    user: { role: string; name: string } | null;
    isCollapsed?: boolean;
  }>();

  let menuItems = $derived(
    user?.role === "SUPER_ADMIN" ? adminMenuItems : mitraMenuItems,
  );

  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }
</script>

<aside
  class="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-50 transition-all duration-300 {isCollapsed
    ? 'w-20'
    : 'w-64'}"
>
  <!-- Logo -->
  <div class="p-4 border-b border-slate-200">
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0"
      >
        <Wifi size={20} class="text-white" />
      </div>
      {#if !isCollapsed}
        <div class="overflow-hidden">
          <span class="text-xl font-bold text-blue-600">MawarISP</span>
          <p class="text-xs text-slate-500 truncate">
            {user?.role === "SUPER_ADMIN" ? "Admin Panel" : "Mitra Panel"}
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Collapse Button -->
  <button
    onclick={toggleSidebar}
    class="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
  >
    {#if isCollapsed}
      <ChevronRight size={14} class="text-slate-600" />
    {:else}
      <ChevronLeft size={14} class="text-slate-600" />
    {/if}
  </button>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto py-4 px-3">
    <ul class="space-y-1">
      {#each menuItems as item}
        {@const isActive = $page.url.pathname.startsWith(item.href)}
        <li>
          <a
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
              {isActive
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
              {isCollapsed ? 'justify-center' : ''}"
          >
            <item.icon size={20} class="flex-shrink-0" />
            {#if !isCollapsed}
              <span class="truncate">{item.label}</span>
            {/if}
            {#if isActive && !isCollapsed}
              <div
                class="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
              ></div>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Bottom Actions -->
  <div class="p-3 border-t border-slate-200 space-y-1">
    <a
      href="/settings"
      title={isCollapsed ? "Pengaturan" : undefined}
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all {isCollapsed
        ? 'justify-center'
        : ''}"
    >
      <Settings size={20} />
      {#if !isCollapsed}<span>Pengaturan</span>{/if}
    </a>
    <form action="/logout" method="POST">
      <button
        type="submit"
        title={isCollapsed ? "Keluar" : undefined}
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all {isCollapsed
          ? 'justify-center'
          : ''}"
      >
        <LogOut size={20} />
        {#if !isCollapsed}<span>Keluar</span>{/if}
      </button>
    </form>
  </div>
</aside>
