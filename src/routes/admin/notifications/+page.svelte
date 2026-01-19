<script lang="ts">
  import {
    Bell,
    MessageSquare,
    Clock,
    Calendar,
    Send,
    Save,
    Loader2,
  } from "lucide-svelte";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types.js";

  let { data } = $props<{ data: PageData }>();

  // Create local state from server data
  let templates = $state(data.templates.map((t: any) => ({ ...t })));
  let isSaving = $state(false);
</script>

<svelte:head>
  <title>Notifikasi - MawarISP</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2
        class="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
      >
        Pengaturan Notifikasi
      </h2>
      <p class="text-zinc-500 mt-1">Konfigurasi template pesan WhatsApp</p>
    </div>
    <form
      action="?/updateAll"
      method="POST"
      use:enhance={() => {
        isSaving = true;
        return async ({ update }) => {
          await update();
          isSaving = false;
        };
      }}
    >
      <input
        type="hidden"
        name="templates"
        value={JSON.stringify(templates)}
      />
      <button
        type="submit"
        disabled={isSaving}
        class="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20 disabled:opacity-50"
      >
        {#if isSaving}
          <Loader2 size={18} class="animate-spin" />
          <span>Menyimpan...</span>
        {:else}
          <Save size={18} />
          <span>Simpan Pengaturan</span>
        {/if}
      </button>
    </form>
  </div>

  <!-- Notification Flow -->
  <div
    class="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 mb-8"
  >
    <h3
      class="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"
    >
      <Clock size={20} class="text-violet-600" />
      Alur Notifikasi Otomatis
    </h3>
    <div class="flex flex-wrap items-center gap-4">
      <div
        class="flex-1 min-w-[200px] p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800"
      >
        <div
          class="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-1"
        >
          <Calendar size={16} />
          <span>H-3</span>
        </div>
        <p class="text-sm text-amber-600 dark:text-amber-300">
          Pengingat halus
        </p>
      </div>
      <div class="text-zinc-300 dark:text-zinc-600">→</div>
      <div
        class="flex-1 min-w-[200px] p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800"
      >
        <div
          class="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium mb-1"
        >
          <Calendar size={16} />
          <span>Hari H</span>
        </div>
        <p class="text-sm text-orange-600 dark:text-orange-300">
          Link pembayaran
        </p>
      </div>
      <div class="text-zinc-300 dark:text-zinc-600">→</div>
      <div
        class="flex-1 min-w-[200px] p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
      >
        <div
          class="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-1"
        >
          <Calendar size={16} />
          <span>H+1</span>
        </div>
        <p class="text-sm text-red-600 dark:text-red-300">
          Isolir + notifikasi
        </p>
      </div>
    </div>
  </div>

  <!-- Template Editor -->
  <div class="space-y-6">
    {#each templates as template, index}
      <div
        class="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br
              {template.trigger === 'H-3'
                ? 'from-amber-500 to-orange-600'
                : template.trigger === 'H-0'
                  ? 'from-orange-500 to-red-600'
                  : 'from-red-500 to-rose-600'} 
              flex items-center justify-center text-white"
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 class="font-semibold text-zinc-900 dark:text-white">
                {template.name}
              </h3>
              <span class="text-xs text-zinc-500"
                >Trigger: {template.trigger}</span
              >
            </div>
          </div>
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
          >
            <Send size={14} />
            <span>Test Kirim</span>
          </button>
        </div>

        <div class="mb-4">
          <label
            class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >Template Pesan</label
          >
          <textarea
            rows="4"
            class="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
            bind:value={templates[index].message}
          ></textarea>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            class="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg"
            >{"{nama}"}</span
          >
          <span
            class="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg"
            >{"{nominal}"}</span
          >
          <span
            class="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg"
            >{"{tanggal}"}</span
          >
          <span
            class="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg"
            >{"{link_bayar}"}</span
          >
        </div>
      </div>
    {/each}
  </div>
</div>
