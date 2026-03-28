<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import { fetchIncidents, fetchMyTasks, fetchNotifications, fetchTeams } from '../lib/api'
import { formatRelativeTime, humanizeIncidentStatus, incidentStatusTone, shortId } from '../lib/format'
import type { IncidentPublic, NotificationPublic, TaskPublic, TeamPublic } from '../types/api'

const loading = ref(true)
const error = ref('')
const incidents = ref<IncidentPublic[]>([])
const tasks = ref<TaskPublic[]>([])
const teams = ref<TeamPublic[]>([])
const notifications = ref<NotificationPublic[]>([])

const openIncidents = computed(() => incidents.value.filter((item) => item.status === 'OPEN').length)
const triagedIncidents = computed(() => incidents.value.filter((item) => item.status === 'TRIAGED').length)
const closedIncidents = computed(() => incidents.value.filter((item) => item.status === 'CLOSED').length)
const todoTasks = computed(() => tasks.value.filter((item) => item.status === 'TODO').length)
const unreadNotes = computed(() => notifications.value.filter((item) => item.unread).length)
const recentIncidents = computed(() => incidents.value.slice(0, 6))
const recentNotifications = computed(() => notifications.value.slice(0, 5))

async function loadOverview() {
  loading.value = true
  error.value = ''

  try {
    const [incidentData, taskData, teamData, notificationData] = await Promise.all([
      fetchIncidents(),
      fetchMyTasks(),
      fetchTeams(),
      fetchNotifications(),
    ])

    incidents.value = incidentData
    tasks.value = taskData
    teams.value = teamData
    notifications.value = notificationData
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load overview.'
  } finally {
    loading.value = false
  }
}

onMounted(loadOverview)
</script>

<template>
  <AppShell
    eyebrow="Command Center"
    title="Operational overview"
    description="A quick read on what is open, what is blocked, and where fresh activity landed."
  >
    <template #toolbar>
      <button type="button" class="button button--primary" @click="loadOverview">Refresh data</button>
    </template>

    <div v-if="error" class="workspace-alert workspace-alert--error">{{ error }}</div>

    <section class="signal-grid">
      <article class="signal-strip">
        <span class="signal-strip__label">Visible incidents</span>
        <strong>{{ incidents.length }}</strong>
      </article>
      <article class="signal-strip">
        <span class="signal-strip__label">Open now</span>
        <strong>{{ openIncidents }}</strong>
      </article>
      <article class="signal-strip">
        <span class="signal-strip__label">Triaged</span>
        <strong>{{ triagedIncidents }}</strong>
      </article>
      <article class="signal-strip">
        <span class="signal-strip__label">My tasks to do</span>
        <strong>{{ todoTasks }}</strong>
      </article>
      <article class="signal-strip">
        <span class="signal-strip__label">Unread notes</span>
        <strong>{{ unreadNotes }}</strong>
      </article>
      <article class="signal-strip">
        <span class="signal-strip__label">Teams online</span>
        <strong>{{ teams.length }}</strong>
      </article>
      <article class="signal-strip">
        <span class="signal-strip__label">Closed incidents</span>
        <strong>{{ closedIncidents }}</strong>
      </article>
    </section>

    <div class="workspace-grid">
      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Recent incidents</p>
            <h3>What needs attention</h3>
          </div>
        </header>

        <div v-if="loading" class="surface-empty">Loading incident activity...</div>
        <div v-else-if="recentIncidents.length === 0" class="surface-empty">No incidents are visible to this account yet.</div>

        <div v-else class="activity-list">
          <article v-for="incident in recentIncidents" :key="incident.id" class="activity-row">
            <div>
              <div class="activity-row__headline">
                <strong>{{ incident.title }}</strong>
                <span class="meta-chip">{{ shortId(incident.id) }}</span>
              </div>
              <p>{{ incident.description || 'No description supplied.' }}</p>
            </div>
            <div class="activity-row__meta">
              <span class="status-pill" :class="incidentStatusTone(incident.status)">
                {{ humanizeIncidentStatus(incident.status) }}
              </span>
              <small>Team {{ shortId(incident.team_id) }}</small>
            </div>
          </article>
        </div>
      </section>

      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Unread flow</p>
            <h3>Latest notification feed</h3>
          </div>
        </header>

        <div v-if="loading" class="surface-empty">Loading notifications...</div>
        <div v-else-if="recentNotifications.length === 0" class="surface-empty">No notification traffic has been generated yet.</div>

        <div v-else class="note-list">
          <article v-for="note in recentNotifications" :key="note.id" class="note-list__item">
            <div>
              <strong>{{ note.message }}</strong>
              <p>{{ note.event_type }} on {{ shortId(note.ref_id) }}</p>
            </div>
            <small>{{ formatRelativeTime(note.created_at) }}</small>
          </article>
        </div>
      </section>

      <section class="workspace-block workspace-block--wide">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Incident status map</p>
            <h3>Queue balance</h3>
          </div>
        </header>

        <div class="status-lane">
          <div class="status-lane__cell">
            <span>Open</span>
            <strong>{{ openIncidents }}</strong>
            <small>Fresh incidents waiting for assignment or triage.</small>
          </div>
          <div class="status-lane__cell">
            <span>Triaged</span>
            <strong>{{ triagedIncidents }}</strong>
            <small>Accepted incidents that still need execution and closure.</small>
          </div>
          <div class="status-lane__cell">
            <span>Closed</span>
            <strong>{{ closedIncidents }}</strong>
            <small>Completed investigations and resolved follow-through.</small>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>
