<script lang="ts">
  import "../app.css";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Header from "$lib/components/Header.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";
  import { page } from "$app/stores";
  import type { LayoutData } from "./$types.js";

  let { children, data } = $props<{ children: any; data: LayoutData }>();

  // Routes that should not show sidebar (public routes)
  const publicRoutes = ["/login", "/register", "/", "/subscription-expired"];

  let showSidebar = $derived(!publicRoutes.includes($page.url.pathname));

  // State for sidebar collapse
  let sidebarCollapsed = $state(false);
</script>

<div class="min-h-screen bg-slate-50">
  {#if showSidebar && data.user}
    <Sidebar user={data.user} bind:isCollapsed={sidebarCollapsed} />
    <div
      class="transition-all duration-300 {sidebarCollapsed ? 'ml-20' : 'ml-64'}"
    >
      <Header user={data.user} mikrotiks={data.mikrotiks || []} subscription={data.subscription} />
      <main class="min-h-[calc(100vh-64px)]">
        {@render children()}
      </main>
    </div>
  {:else}
    {@render children()}
  {/if}
</div>

<!-- Toast Notifications -->
<ToastContainer />
