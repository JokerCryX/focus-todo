<template>
  <div class="titlebar">
    <div class="titlebar-left">
      <button class="titlebar-btn pin-btn" :class="{ active: isPinned }" @click="togglePin" :title="isPinned ? $t('titlebar.unpin') : $t('titlebar.pin')">
        <span class="pin-icon">{{ isPinned ? '📌' : '📍' }}</span>
      </button>
      <img :src="logoUrl" class="titlebar-logo" />
    </div>
    <div class="titlebar-controls">
      <button class="titlebar-btn" @click="minimize" :title="$t('titlebar.minimize')">
        <svg width="10" height="1" viewBox="0 0 10 1"><rect fill="currentColor" width="10" height="1"/></svg>
      </button>
      <button class="titlebar-btn" @click="maximize" :title="$t('titlebar.maximize')">
        <svg width="10" height="10" viewBox="0 0 10 10"><rect fill="none" stroke="currentColor" stroke-width="1" x="0.5" y="0.5" width="9" height="9"/></svg>
      </button>
      <button class="titlebar-btn close" @click="close" :title="$t('titlebar.close')">
        <svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import '@/styles/titlebar.css'
import logoUrl from '@/assets/logo-data'

const isPinned = ref(false)

onMounted(async () => {
  isPinned.value = await window.api.window.isAlwaysOnTop()
})

function togglePin() {
  isPinned.value = !isPinned.value
  window.api.window.setAlwaysOnTop(isPinned.value)
}

function minimize() {
  window.api.window.minimize()
}

function maximize() {
  window.api.window.maximize()
}

function close() {
  window.api.window.close()
}
</script>
