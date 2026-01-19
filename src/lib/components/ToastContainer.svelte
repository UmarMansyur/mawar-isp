<script lang="ts">
  import { getToasts, removeToast } from '$lib/utils/toast.svelte.js';
  import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-svelte';

  let toasts = $derived(getToasts());

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };
</script>

{#if toasts.length > 0}
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <div
        class="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm {colors[toast.type]}"
        role="alert"
      >
        <svelte:component this={icons[toast.type]} size={20} class={iconColors[toast.type]} />
        <p class="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onclick={() => removeToast(toast.id)}
          class="p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    {/each}
  </div>
{/if}
