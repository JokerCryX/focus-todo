<template>
  <div class="attachment-section">
    <div class="attach-header">
      <span class="attach-count">{{ files.length }} / 20</span>
      <div class="attach-actions">
        <button class="attach-btn" @click="pasteFromClipboard" :title="$t('attachment.pasteTitle')">
          <svg width="12" height="12" viewBox="0 0 16 16"><rect x="4" y="3" width="8" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="5" width="8" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
          {{ $t('attachment.paste') }}
        </button>
        <button class="attach-btn" @click="selectFiles">
          <svg width="12" height="12" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ $t('attachment.upload') }}
        </button>
      </div>
    </div>
    <div v-if="files.length" class="attach-list">
      <div v-for="(file, i) in files" :key="i" class="attach-item">
        <div v-if="file.isImage" class="attach-thumb" @click="previewImage(file)">
          <img v-if="imageSrcs[file.path]" :src="imageSrcs[file.path]" />
          <svg v-else class="thumb-loading" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 16" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/></circle></svg>
        </div>
        <div v-else class="attach-file-icon">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 2h5l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9 2v4h4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
        </div>
        <div class="attach-info">
          <span class="attach-name">{{ file.name }}</span>
          <span class="attach-size">{{ formatSize(file.size) }}</span>
        </div>
        <button class="attach-del" @click="removeFile(i)">✕</button>
      </div>
    </div>
    <div v-if="previewSrc" class="preview-overlay" @click="previewSrc = null">
      <img :src="previewSrc" class="preview-img" @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  files: any[]
  taskId: string
}>()

const emit = defineEmits<{
  (e: 'update', files: any[]): void
}>()

const { t } = useI18n()

const previewSrc = ref<string | null>(null)
const imageSrcs = ref<Record<string, string>>({})

function getExtname(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getMimeType(name: string): string {
  const ext = getExtname(name)
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.bmp') return 'image/bmp'
  return 'image/png'
}

function getImageSrc(file: any): string {
  if (imageSrcs.value[file.path]) return imageSrcs.value[file.path]
  loadImagesrc(file)
  return ''
}

async function loadImagesrc(file: any) {
  const base64 = await window.api.attachment.read(file.path)
  if (base64) {
    const mime = getMimeType(file.name)
    imageSrcs.value[file.path] = `data:${mime};base64,${base64}`
  }
}

function loadAllImages() {
  for (const file of props.files) {
    if (file.isImage && !imageSrcs.value[file.path]) {
      loadImagesrc(file)
    }
  }
}

function previewImage(file: any) {
  if (imageSrcs.value[file.path]) {
    previewSrc.value = imageSrcs.value[file.path]
  } else {
    window.api.attachment.read(file.path).then(base64 => {
      if (base64) {
        const mime = getMimeType(file.name)
        const src = `data:${mime};base64,${base64}`
        imageSrcs.value[file.path] = src
        previewSrc.value = src
      }
    })
  }
}

async function selectFiles() {
  if (props.files.length >= 20) {
    alert(t('attachment.limitReached'))
    return
  }
  const paths = await window.api.attachment.select()
  const newFiles = [...props.files]
  for (const p of paths) {
    if (newFiles.length >= 20) break
    const result = await window.api.attachment.copy(props.taskId, p)
    if (result.error) {
      alert(result.error)
      continue
    }
    newFiles.push(result)
  }
  emit('update', newFiles)
}

async function pasteFromClipboard() {
  if (props.files.length >= 20) {
    alert(t('attachment.limitReached'))
    return
  }
  const result = await window.api.attachment.saveClipboard(props.taskId)
  if (result) {
    emit('update', [...props.files, result])
  }
}

async function removeFile(index: number) {
  const file = props.files[index]
  await window.api.attachment.delete(file.path)
  const newFiles = [...props.files]
  newFiles.splice(index, 1)
  emit('update', newFiles)
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    e.preventDefault()
    pasteFromClipboard()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  loadAllImages()
})

onUnmounted(() => document.removeEventListener('keydown', onKeydown))

watch(() => props.files, () => {
  loadAllImages()
}, { deep: true })
</script>

<style scoped>
.attachment-section {
  margin-top: 4px;
}

.attach-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.attach-count {
  font-size: 10px;
  color: var(--text-tertiary);
}

.attach-actions {
  display: flex;
  gap: 4px;
}

.attach-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.attach-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.attach-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.attach-item:hover {
  background: var(--bg-hover);
}

.attach-thumb {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--bg-tertiary);
}

.attach-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-loading {
  color: var(--text-tertiary);
  opacity: 0.4;
}

.attach-file-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.attach-info {
  flex: 1;
  min-width: 0;
}

.attach-name {
  display: block;
  font-size: var(--font-xs);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attach-size {
  font-size: 10px;
  color: var(--text-tertiary);
}

.attach-del {
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 10px;
  opacity: 0;
  transition: opacity var(--transition-fast);
  padding: 4px;
}

.attach-item:hover .attach-del {
  opacity: 1;
}

.attach-del:hover {
  color: var(--danger);
}

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.preview-img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}
</style>
