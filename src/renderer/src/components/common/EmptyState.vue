<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <p class="empty-text">{{ text }}</p>
    <p class="empty-sub" v-if="subText">{{ subText }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string; text: string; subText?: string }>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 24px;
  color: var(--text-tertiary);
  animation: fadeIn 0.3s var(--ease-out);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 14px;
  opacity: 0.35;
}

.empty-text {
  font-size: var(--font-sm);
  margin-bottom: 4px;
  letter-spacing: 0.01em;
}

.empty-sub {
  font-size: var(--font-xs);
  color: var(--text-placeholder);
}
</style>
