<script lang="ts">
  import { X } from "lucide-svelte";

  let { open = $bindable(false), title, onClose, children } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      onclick={onClose}
      aria-hidden="true"
    ></div>

    <!-- Modal Panel -->
    <div
      class="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col"
      role="document"
    >
      <div class="flex items-center justify-between p-6 border-b border-slate-100">
        <h3 class="text-xl font-semibold leading-6 text-slate-900">
          {title}
        </h3>
        <button
          type="button"
          class="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onclick={onClose}
        >
          <span class="sr-only">Close</span>
          <X size={20} />
        </button>
      </div>

      <div class="p-6 overflow-y-auto">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
