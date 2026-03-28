<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import { fetchIncidents, fetchMyTasks, updateTaskStatus } from '../lib/api'
import { formatDateTime, humanizeTaskStatus, shortId, taskStatusTone } from '../lib/format'
import type { IncidentPublic, TaskPublic, TaskStatus } from '../types/api'

const loading = ref(true)
const error = ref('')
const tasks = ref<TaskPublic[]>([])
const incidents = ref<IncidentPublic[]>([])

const todoTasks = computed(() => tasks.value.filter((item) => item.status === 'TODO'))
const completedTasks = computed(() => tasks.value.filter((item) => item.status !== 'TODO'))

async function loadTasks() {
  loading.value = true
  error.value = ''

  try {
    const [taskData, incidentData] = await Promise.all([fetchMyTasks(), fetchIncidents()])
    tasks.value = taskData
    incidents.value = incidentData
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load tasks.'
  } finally {
    loading.value = false
  }
}

function incidentTitle(incidentId: string) {
  return incidents.value.find((item) => item.id === incidentId)?.title ?? shortId(incidentId)
}

async function handleStatusChange(taskId: string, status: TaskStatus) {
  try {
    const updated = await updateTaskStatus(taskId, status)
    tasks.value = tasks.value.map((item) => (item.id === updated.id ? updated : item))
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to update task status.'
  }
}

onMounted(loadTasks)
</script>

<template>
  <AppShell
    eyebrow="Execution"
    title="My task queue"
    description="Focus on items assigned to the current operator and move them out of TODO as work lands."
  >
    <template #toolbar>
      <button type="button" class="button button--primary" @click="loadTasks">Refresh queue</button>
    </template>

    <div v-if="error" class="workspace-alert workspace-alert--error">{{ error }}</div>

    <section class="workspace-block">
      <header class="workspace-block__header">
        <div>
          <p class="section-kicker">Active</p>
          <h3>Tasks still in flight</h3>
        </div>
      </header>

      <div v-if="loading" class="surface-empty">Loading assigned tasks...</div>
      <div v-else-if="todoTasks.length === 0" class="surface-empty">No TODO tasks are assigned to you right now.</div>

      <div v-else class="task-list">
        <article v-for="task in todoTasks" :key="task.id" class="task-row">
          <div class="task-row__main">
            <div class="activity-row__headline">
              <strong>{{ task.title }}</strong>
              <span class="meta-chip">{{ shortId(task.id) }}</span>
            </div>
            <p>{{ task.description || 'No task description supplied.' }}</p>
            <small>Incident: {{ incidentTitle(task.incident_id) }}</small>
          </div>
          <div class="task-row__actions">
            <span class="status-pill" :class="taskStatusTone(task.status)">
              {{ humanizeTaskStatus(task.status) }}
            </span>
            <div class="inline-actions">
              <button type="button" class="button button--soft" @click="handleStatusChange(task.id, 'DONE')">
                Mark done
              </button>
              <button type="button" class="button button--ghost" @click="handleStatusChange(task.id, 'CANCELED')">
                Cancel
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="workspace-block">
      <header class="workspace-block__header">
        <div>
          <p class="section-kicker">History</p>
          <h3>Resolved or canceled items</h3>
        </div>
      </header>

      <div v-if="loading" class="surface-empty">Loading task history...</div>
      <div v-else-if="completedTasks.length === 0" class="surface-empty">No completed task history yet.</div>

      <div v-else class="note-list">
        <article v-for="task in completedTasks" :key="task.id" class="note-list__item">
          <div>
            <strong>{{ task.title }}</strong>
            <p>{{ incidentTitle(task.incident_id) }}</p>
          </div>
          <div class="note-list__meta">
            <span class="status-pill" :class="taskStatusTone(task.status)">
              {{ humanizeTaskStatus(task.status) }}
            </span>
            <small>{{ formatDateTime(task.updated_at) }}</small>
          </div>
        </article>
      </div>
    </section>
  </AppShell>
</template>
