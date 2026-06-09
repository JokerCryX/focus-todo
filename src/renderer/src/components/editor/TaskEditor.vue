<template>
  <div class="editor-panel">
    <div class="editor-header">
      <span class="editor-title">{{ $t('task.editTask') }}</span>
      <button class="close-btn" @click="uiStore.closeEditor">✕</button>
    </div>

    <div class="editor-body" v-if="task">
      <!-- 标题 -->
      <div class="field field-title">
        <input
          class="title-input"
          v-model="form.title"
          :placeholder="$t('task.titlePlaceholder')"
          @blur="saveField('title')"
        />
      </div>

      <!-- 描述 -->
      <div class="field field-desc">
        <label class="field-label">{{ $t('task.descLabel') }}</label>
        <textarea
          v-model="form.description"
          :placeholder="$t('task.descPlaceholder')"
          rows="3"
          @blur="saveField('description')"
        />
      </div>

      <!-- 提醒时间 + 分类 -->
      <div class="field-row">
        <div class="field-time">
          <div class="time-label-row">
            <label class="field-label">{{ isDuration ? $t('task.durationLabel') : $t('task.reminderLabel') }}</label>
            <label class="duration-toggle" :title="$t('task.durationToggle')">
              <input type="checkbox" v-model="isDuration" @change="onDurationToggle" />
              <span class="toggle-icon">⏱</span>
            </label>
          </div>
          <!-- 提醒模式：单个日期时间 -->
          <el-date-picker
            v-if="!isDuration"
            v-model="form.due_date"
            type="datetime"
            :placeholder="$t('task.reminderPlaceholder')"
            format="YYYY-MM-DD HH:mm"
            value-format="x"
            clearable
            @change="saveField('due_date')"
            style="width: 100%"
          />
          <!-- 持续时间模式：日期时间区间（输入框只显示时间区间） -->
          <el-date-picker
            v-else
            v-model="durationRange"
            type="datetimerange"
            :start-placeholder="$t('task.durationStart')"
            :end-placeholder="$t('task.durationEnd')"
            format="HH:mm"
            value-format="x"
            clearable
            @change="onDurationRangeChange"
            style="width: 100%"
          />
        </div>
        <div class="field-category">
          <label class="field-label">{{ $t('task.categoryLabel') }}</label>
          <select v-model="form.category_id" @change="saveField('category_id')">
            <option :value="null">{{ $t('task.noCategory') }}</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 优先级 -->
      <div class="field">
        <label class="field-label">{{ $t('task.priorityLabel') }}</label>
        <div class="priority-selector">
          <button
            v-for="p in priorityOptions"
            :key="p.value"
            class="priority-opt"
            :class="{ active: form.priority === p.value, [`p${p.value}`]: true }"
            @click="form.priority = p.value; saveField('priority')"
          >
            <span class="priority-dot"></span>
            <span>{{ p.label }}</span>
          </button>
        </div>
      </div>

      <!-- 标签 -->
      <div class="field">
        <label class="field-label">{{ $t('task.tagLabel') }}</label>
        <div class="tags-area">
          <span v-for="(tag, i) in form.tags" :key="i" class="tag-item">
            {{ tag }}
            <span class="tag-remove" @click="removeTag(i)">✕</span>
          </span>
          <input
            class="tag-input"
            v-model="tagInput"
            :placeholder="$t('task.tagPlaceholder')"
            @keydown.enter.prevent="addTag"
          />
        </div>
        <div class="tag-suggestions" v-if="suggestions.length">
          <span
            v-for="s in suggestions"
            :key="s"
            class="tag-suggest"
            @click="selectSuggestion(s)"
          >{{ s }}</span>
        </div>
      </div>

      <!-- 重复规则 -->
      <div class="field">
        <RepeatRuleEditor
          v-model="form.repeat_rule"
          :visible="true"
          @update:model-value="onRepeatRuleChange"
        />
      </div>

      <!-- 附件 -->
      <div class="field" v-if="task">
        <label class="field-label">{{ $t('task.attachmentLabel') }}</label>
        <AttachmentList
          :files="form.files"
          :task-id="task.task_id"
          @update="onFilesUpdate"
        />
      </div>

      <!-- 创建时间 -->
      <div class="field-created" v-if="task?.created_at">
        <span class="field-label">{{ $t('task.createdAt') }}</span>
        <span class="created-time">{{ formatCreated(task.created_at) }}</span>
      </div>

      <!-- 删除任务 -->
      <div class="field-delete">
        <button class="delete-link" @click="onDeleteTask">{{ $t('task.deleteTask') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUIStore } from '@/stores/ui'
import { useTaskStore } from '@/stores/task'
import { useCategoryStore } from '@/stores/category'
import { useTagStore } from '@/stores/tag'
import RepeatRuleEditor from './RepeatRuleEditor.vue'
import AttachmentList from './AttachmentList.vue'

const { t } = useI18n()
const uiStore = useUIStore()
const taskStore = useTaskStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const task = computed(() => uiStore.editingTask)
const categories = computed(() => categoryStore.categories)

const form = reactive({
  title: '',
  description: '',
  due_date: null as number | null,
  category_id: null as number | null,
  priority: 0,
  tags: [] as string[],
  repeat_rule: null as any,
  files: [] as any[],
  duration_end: null as number | null
})

const isDuration = ref(false)
const durationRange = ref<[number, number] | null>(null)

const tagInput = ref('')

const priorityOptions = computed(() => [
  { value: 0, label: t('task.priorityNone') },
  { value: 1, label: t('task.priorityDaily') },
  { value: 2, label: t('task.priorityImportant') },
  { value: 3, label: t('task.priorityUrgent') }
])

watch(task, (t) => {
  if (t) {
    form.title = t.title
    form.description = t.description
    form.due_date = t.due_date
    form.category_id = t.category_id
    form.priority = t.priority
    form.tags = [...(t.tags || [])]
    form.repeat_rule = t.repeat_rule ? (typeof t.repeat_rule === 'string' ? JSON.parse(t.repeat_rule) : t.repeat_rule) : null
    form.files = t.files ? [...t.files] : []
    form.duration_end = (t as any).duration_end ?? null
    isDuration.value = !!(form.due_date && form.duration_end)
    durationRange.value = (form.due_date && form.duration_end) ? [form.due_date, form.duration_end] : null
  }
}, { immediate: true })

const suggestions = computed(() => {
  if (!tagInput.value.trim()) return []
  const input = tagInput.value.toLowerCase()
  return tagStore.tags
    .filter(t => t.name.toLowerCase().includes(input) && !form.tags.includes(t.name))
    .slice(0, 5)
    .map(t => t.name)
})

function addTag() {
  const val = tagInput.value.trim()
  if (val && !form.tags.includes(val)) {
    form.tags.push(val)
    saveField('tags')
  }
  tagInput.value = ''
}

function removeTag(i: number) {
  form.tags.splice(i, 1)
  saveField('tags')
}

function selectSuggestion(name: string) {
  if (!form.tags.includes(name)) {
    form.tags.push(name)
    saveField('tags')
  }
  tagInput.value = ''
}

function onRepeatRuleChange(rule: any) {
  form.repeat_rule = rule
  saveField('repeat_rule')
}

function onFilesUpdate(files: any[]) {
  form.files = files
  saveField('files')
}

function onDurationToggle() {
  if (isDuration.value) {
    // 切到持续时间模式：默认今天 00:00 - 23:59
    const now = new Date()
    const dayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    durationRange.value = [dayMs, dayMs + 23 * 3600000 + 59 * 60000]
    form.due_date = durationRange.value[0]
    form.duration_end = durationRange.value[1]
    saveField('due_date')
    saveField('duration_end')
  } else {
    // 切回提醒时间模式：保留 due_date，清除 duration_end
    durationRange.value = null
    form.duration_end = null
    saveField('duration_end')
  }
}

function onDurationRangeChange(val: [number, number] | null) {
  if (val) {
    form.due_date = val[0]
    form.duration_end = val[1]
  } else {
    form.due_date = null
    form.duration_end = null
  }
  saveField('due_date')
  saveField('duration_end')
}

async function saveField(field: string) {
  if (!task.value) return
  const input: any = { task_id: task.value.task_id }
  if (field === 'due_date') {
    input.due_date = form.due_date ? Number(form.due_date) : null
  } else if (field === 'duration_end') {
    (input as any).duration_end = form.duration_end ?? null
  } else if (field === 'category_id') {
    input.category_id = form.category_id
  } else if (field === 'tags') {
    input.tags = [...form.tags]
  } else {
    (input as any)[field] = (form as any)[field]
  }
  const updated = await taskStore.updateTask(input)
  uiStore.editingTask = updated
}

async function onDeleteTask() {
  if (!task.value) return
  await taskStore.removeTask(task.value.task_id)
  uiStore.closeEditor()
}

function formatCreated(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.editor-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--editor-width);
  min-width: var(--editor-width);
  border-left: 1px solid var(--border-secondary);
  background: var(--bg-editor);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 50;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 var(--spacing-lg);
  border-bottom: 1px solid var(--border-secondary);
}

.editor-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.close-btn {
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 13px;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

/* --- Fields --- */

.field {
  margin-bottom: 10px;
}

.field-title {
  margin-bottom: 12px;
}

.field-desc {
  margin-bottom: 14px;
}

.field-label {
  display: block;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.title-input {
  width: 100%;
  border: none;
  font-size: var(--font-xl);
  font-weight: 600;
  background: transparent;
  color: var(--text-primary);
  padding: 4px 0;
  letter-spacing: 0.01em;
}

.title-input:focus {
  outline: none;
}

textarea {
  width: 100%;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  padding: var(--spacing-sm);
  resize: vertical;
  min-height: 60px;
  color: var(--text-primary);
  font-size: var(--font-sm);
  transition: border-color var(--transition-fast);
}

textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}

/* --- Reminder + Category row --- */

.field-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.field-time {
  flex: 1;
  min-width: 0;
}

.field-category {
  flex: none;
  width: 110px;
  max-width: 110px;
  overflow: hidden;
}

.field-category select {
  width: 100%;
  font-size: var(--font-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-time .field-label,
.field-category .field-label {
  display: block;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

/* Element Plus 日期选择器样式覆盖 */
.field-time :deep(.el-date-editor) {
  --el-font-size-base: 12px;
  --el-border-radius-base: var(--radius-sm);
}

.field-time :deep(.el-input__wrapper) {
  background: var(--bg-input);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: none;
  padding: 2px 8px;
  transition: border-color var(--transition-fast);
}

.field-time :deep(.el-input__wrapper:hover) {
  border-color: var(--text-tertiary);
}

.field-time :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}

.field-time :deep(.el-input__inner) {
  font-size: 12px;
  color: var(--text-primary);
}

.field-time :deep(.el-range-input) {
  font-size: 12px;
  color: var(--text-primary);
}

.field-time :deep(.el-range-separator) {
  font-size: 11px;
  color: var(--text-tertiary);
}

.field-time :deep(.el-input__prefix),
.field-time :deep(.el-input__suffix) {
  color: var(--text-tertiary);
}

.time-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.time-label-row .field-label {
  margin-bottom: 0;
}

.duration-toggle {
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  font-size: 10px;
  color: var(--text-tertiary);
  user-select: none;
  transition: color var(--transition-fast);
}

.duration-toggle:hover {
  color: var(--accent-primary);
}

.duration-toggle input {
  display: none;
}

.duration-toggle .toggle-icon {
  font-size: 12px;
  line-height: 1;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}

.duration-toggle input:checked + .toggle-icon {
  opacity: 1;
  color: var(--accent-primary);
}

select {
  width: 100%;
  padding: 6px var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-xs);
  transition: border-color var(--transition-fast);
}

select:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}

/* --- Priority --- */

.priority-selector {
  display: flex;
  gap: 5px;
}

.priority-opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 4px;
  border: 1.5px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 10px;
  text-align: center;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.priority-opt:hover {
  border-color: var(--text-tertiary);
}

.priority-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.priority-opt.p0 .priority-dot { background: #D1D5DB; }
.priority-opt.p1 .priority-dot { background: #FBBF24; }
.priority-opt.p2 .priority-dot { background: #34D399; }
.priority-opt.p3 .priority-dot { background: #F87171; }

.priority-opt.p0.active { border-color: #D1D5DB; background: rgba(209, 213, 219, 0.1); }
.priority-opt.p1.active { border-color: #FBBF24; background: rgba(251, 191, 36, 0.08); }
.priority-opt.p2.active { border-color: #34D399; background: rgba(52, 211, 153, 0.08); }
.priority-opt.p3.active { border-color: #F87171; background: rgba(248, 113, 113, 0.08); }

/* --- Tags --- */

.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 6px var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  transition: border-color var(--transition-fast);
}

.tags-area:focus-within {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-accent);
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 7px;
  background: var(--accent-light);
  color: var(--accent-primary);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
}

.tag-remove {
  cursor: pointer;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
  font-size: 9px;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-input {
  border: none;
  background: transparent;
  flex: 1;
  min-width: 60px;
  font-size: var(--font-xs);
  color: var(--text-primary);
}

.tag-suggestions {
  display: flex;
  gap: 4px;
  margin-top: 3px;
}

.tag-suggest {
  padding: 1px 7px;
  font-size: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.tag-suggest:hover {
  background: var(--accent-light);
  color: var(--accent-primary);
}

/* --- Delete --- */

.field-created {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  margin-top: 14px;
  border-top: 1px solid var(--border-secondary);
}

.created-time {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.field-delete {
  margin-top: 8px;
}

.delete-link {
  background: var(--danger);
  border: none;
  color: white;
  cursor: pointer;
  font-size: var(--font-xs);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  width: 100%;
  transition: all var(--transition-fast);
}

.delete-link:hover {
  opacity: 0.85;
}
</style>
