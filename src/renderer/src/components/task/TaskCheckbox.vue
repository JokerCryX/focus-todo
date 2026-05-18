<template>
  <button class="checkbox" :class="{ checked }" @click.stop="$emit('toggle')">
    <svg v-if="checked" width="14" height="14" viewBox="0 0 14 14">
      <path d="M2 7l3.5 3.5L12 4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps<{ checked: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<style scoped>
.checkbox {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 1.5px solid var(--border-primary);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.checkbox.checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: 0 0 8px var(--accent-glow);
}
</style>
