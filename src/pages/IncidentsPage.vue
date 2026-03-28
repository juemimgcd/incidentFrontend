<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import {
  addIncidentComment,
  assignIncident,
  createIncident,
  createTaskForIncident,
  fetchIncidentComments,
  fetchIncidentDetail,
  fetchIncidentTimeline,
  fetchIncidents,
  fetchMyIncidents,
  fetchTasksForIncident,
  fetchTeams,
  fetchUsers,
  searchIncidents,
  updateIncidentStatus,
  updateTaskStatus,
} from '../lib/api'
import {
  formatDateTime,
  humanizeIncidentStatus,
  humanizeTaskStatus,
  incidentStatusTone,
  shortId,
  taskStatusTone,
} from '../lib/format'
import { useAuth } from '../stores/auth'
import type {
  CommentPublic,
  IncidentEventPublic,
  IncidentPublic,
  IncidentStatus,
  TaskPublic,
  TaskStatus,
  TeamPublic,
  UserAdminPublic,
} from '../types/api'

const { state } = useAuth()

const loading = ref(true)
const detailLoading = ref(false)
const error = ref('')
const incidents = ref<IncidentPublic[]>([])
const teams = ref<TeamPublic[]>([])
const adminUsers = ref<UserAdminPublic[]>([])
const canManage = ref(false)
const selectedIncidentId = ref('')
const selectedIncident = ref<IncidentPublic | null>(null)
const comments = ref<CommentPublic[]>([])
const timeline = ref<IncidentEventPublic[]>([])
const relatedTasks = ref<TaskPublic[]>([])
const assignmentUserId = ref('')
const commentDraft = ref('')

const filters = reactive({
  scope: 'visible' as 'visible' | 'mine',
  q: '',
  status: '' as IncidentStatus | '',
  teamId: '',
})

const createForm = reactive({
  title: '',
  description: '',
  teamId: '',
})

const taskForm = reactive({
  title: '',
  description: '',
  assigneeId: '',
})

const statusOptions = computed<IncidentStatus[]>(() => {
  if (!selectedIncident.value) {
    return [] as IncidentStatus[]
  }

  switch (selectedIncident.value.status) {
    case 'OPEN':
      return ['TRIAGED']
    case 'TRIAGED':
      return ['CLOSED']
    default:
      return []
  }
})

const statusActions = computed<{ value: IncidentStatus; label: string }[]>(() => {
  return statusOptions.value.map((status) => ({
    value: status,
    label: humanizeIncidentStatus(status),
  }))
})

function clearSelection() {
  selectedIncidentId.value = ''
  selectedIncident.value = null
  comments.value = []
  timeline.value = []
  relatedTasks.value = []
  assignmentUserId.value = ''
}

function teamLabel(teamId: string) {
  return teams.value.find((team) => team.id === teamId)?.name ?? shortId(teamId)
}

function userLabel(userId: string | null) {
  if (!userId) {
    return 'Unassigned'
  }

  if (userId === state.profile?.id) {
    return state.profile.email
  }

  return adminUsers.value.find((user) => user.id === userId)?.email ?? shortId(userId)
}

function replaceIncident(updated: IncidentPublic) {
  incidents.value = incidents.value.map((item) => (item.id === updated.id ? updated : item))
  selectedIncident.value = updated
  assignmentUserId.value = updated.assignee_id ?? ''
}

function filterMineLocally(list: IncidentPublic[]) {
  const query = filters.q.trim().toLowerCase()

  return list.filter((incident) => {
    const matchesQuery =
      !query ||
      incident.title.toLowerCase().includes(query) ||
      incident.description?.toLowerCase().includes(query)
    const matchesStatus = !filters.status || incident.status === filters.status
    const matchesTeam = !filters.teamId || incident.team_id === filters.teamId

    return matchesQuery && matchesStatus && matchesTeam
  })
}

async function selectIncident(incidentId: string) {
  selectedIncidentId.value = incidentId
  detailLoading.value = true
  error.value = ''

  try {
    const [detailData, commentData, timelineData, taskData] = await Promise.all([
      fetchIncidentDetail(incidentId),
      fetchIncidentComments(incidentId),
      fetchIncidentTimeline(incidentId),
      fetchTasksForIncident(incidentId),
    ])

    selectedIncident.value = detailData
    comments.value = commentData
    timeline.value = timelineData
    relatedTasks.value = taskData
    assignmentUserId.value = detailData.assignee_id ?? ''
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load incident detail.'
  } finally {
    detailLoading.value = false
  }
}

async function loadBootstrap() {
  loading.value = true
  error.value = ''

  try {
    const [teamData, incidentData] = await Promise.all([fetchTeams(), fetchIncidents()])
    teams.value = teamData
    incidents.value = incidentData

    if (!createForm.teamId && teamData[0]) {
      createForm.teamId = teamData[0].id
    }

    try {
      adminUsers.value = await fetchUsers()
      canManage.value = true
      if (!taskForm.assigneeId && adminUsers.value[0]) {
        taskForm.assigneeId = adminUsers.value[0].id
      }
    } catch {
      adminUsers.value = []
      canManage.value = false
    }

    if (incidentData[0]) {
      await selectIncident(incidentData[0].id)
    } else {
      clearSelection()
    }
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load incidents.'
  } finally {
    loading.value = false
  }
}

async function runSearch() {
  loading.value = true
  error.value = ''

  try {
    let nextIncidents: IncidentPublic[] = []

    if (filters.scope === 'mine') {
      nextIncidents = filterMineLocally(await fetchMyIncidents())
    } else if (filters.q || filters.status || filters.teamId) {
      nextIncidents = await searchIncidents({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        team_id: filters.teamId || undefined,
        limit: 50,
        offset: 0,
      })
    } else {
      nextIncidents = await fetchIncidents()
    }

    incidents.value = nextIncidents

    if (!nextIncidents.length) {
      clearSelection()
      return
    }

    const stillSelected = nextIncidents.find((item) => item.id === selectedIncidentId.value)
    await selectIncident(stillSelected?.id ?? nextIncidents[0].id)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to run the current search.'
  } finally {
    loading.value = false
  }
}

async function handleCreateIncident() {
  if (!createForm.title.trim() || !createForm.teamId) {
    error.value = 'A title and team are required to create an incident.'
    return
  }

  try {
    const created = await createIncident({
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      team_id: createForm.teamId,
    })

    createForm.title = ''
    createForm.description = ''
    incidents.value = [created, ...incidents.value]
    await selectIncident(created.id)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to create the incident.'
  }
}

async function handleStatusUpdate(status: IncidentStatus) {
  if (!selectedIncident.value) {
    return
  }

  try {
    const updated = await updateIncidentStatus(selectedIncident.value.id, status)
    replaceIncident(updated)
    timeline.value = await fetchIncidentTimeline(updated.id)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to update incident status.'
  }
}

async function handleAssignIncident() {
  if (!selectedIncident.value || !assignmentUserId.value) {
    error.value = 'Choose a user before assigning the incident.'
    return
  }

  try {
    const updated = await assignIncident(selectedIncident.value.id, assignmentUserId.value)
    replaceIncident(updated)
    timeline.value = await fetchIncidentTimeline(updated.id)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to assign the incident.'
  }
}

async function handleAddComment() {
  if (!selectedIncident.value || !commentDraft.value.trim()) {
    error.value = 'Comment content is required.'
    return
  }

  try {
    const created = await addIncidentComment(selectedIncident.value.id, commentDraft.value.trim())
    comments.value = [created, ...comments.value]
    commentDraft.value = ''
    timeline.value = await fetchIncidentTimeline(selectedIncident.value.id)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to add the comment.'
  }
}

async function handleCreateTask() {
  if (!selectedIncident.value || !taskForm.title.trim()) {
    error.value = 'Task title is required.'
    return
  }

  try {
    const created = await createTaskForIncident(selectedIncident.value.id, {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assignee_id: canManage.value ? taskForm.assigneeId || null : null,
    })

    relatedTasks.value = [created, ...relatedTasks.value]
    taskForm.title = ''
    taskForm.description = ''
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to create the task.'
  }
}

async function handleTaskStatus(taskId: string, status: TaskStatus) {
  try {
    const updated = await updateTaskStatus(taskId, status)
    relatedTasks.value = relatedTasks.value.map((item) => (item.id === updated.id ? updated : item))
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to update task status.'
  }
}

onMounted(loadBootstrap)
</script>

<template>
  <AppShell
    eyebrow="Dispatch"
    title="Incident workspace"
    description="Search visible incidents, create new cases, and keep comments, tasks, and timelines aligned."
  >
    <template #toolbar>
      <button type="button" class="button button--ghost" @click="runSearch">Run search</button>
      <button type="button" class="button button--primary" @click="loadBootstrap">Refresh all</button>
    </template>

    <div v-if="error" class="workspace-alert workspace-alert--error">{{ error }}</div>

    <div class="workspace-grid workspace-grid--wide">
      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Search</p>
            <h3>Incident directory</h3>
          </div>
        </header>

        <div class="segmented-control">
          <button
            type="button"
            class="segmented-control__button"
            :class="{ 'segmented-control__button--active': filters.scope === 'visible' }"
            @click="filters.scope = 'visible'"
          >
            Visible to me
          </button>
          <button
            type="button"
            class="segmented-control__button"
            :class="{ 'segmented-control__button--active': filters.scope === 'mine' }"
            @click="filters.scope = 'mine'"
          >
            Created by me
          </button>
        </div>

        <form class="surface-form surface-form--row" @submit.prevent="runSearch">
          <label class="field">
            <span>Keyword</span>
            <input v-model="filters.q" type="text" placeholder="Search title or description" />
          </label>
          <label class="field">
            <span>Status</span>
            <select v-model="filters.status">
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="TRIAGED">Triaged</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label class="field">
            <span>Team</span>
            <select v-model="filters.teamId">
              <option value="">All teams</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
            </select>
          </label>
          <button type="submit" class="button button--primary">Apply</button>
        </form>

        <div v-if="loading" class="surface-empty">Loading incidents...</div>
        <div v-else-if="incidents.length === 0" class="surface-empty">No incidents match the current filter set.</div>

        <div v-else class="activity-list">
          <button
            v-for="incident in incidents"
            :key="incident.id"
            type="button"
            class="list-button list-button--stacked"
            :class="{ 'list-button--active': selectedIncidentId === incident.id }"
            @click="selectIncident(incident.id)"
          >
            <div class="activity-row__headline">
              <strong>{{ incident.title }}</strong>
              <span class="status-pill" :class="incidentStatusTone(incident.status)">
                {{ humanizeIncidentStatus(incident.status) }}
              </span>
            </div>
            <p>{{ incident.description || 'No description supplied.' }}</p>
            <div class="list-button__meta">
              <span>Team {{ teamLabel(incident.team_id) }}</span>
              <span>Reporter {{ userLabel(incident.reporter_id) }}</span>
              <span>Assignee {{ userLabel(incident.assignee_id) }}</span>
            </div>
          </button>
        </div>
      </section>

      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Create</p>
            <h3>Open a new incident</h3>
          </div>
        </header>

        <form class="surface-form" @submit.prevent="handleCreateIncident">
          <label class="field">
            <span>Title</span>
            <input v-model="createForm.title" type="text" placeholder="Email delivery failure in east region" />
          </label>
          <label class="field">
            <span>Team</span>
            <select v-model="createForm.teamId">
              <option disabled value="">Select a team</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
            </select>
          </label>
          <label class="field">
            <span>Description</span>
            <textarea v-model="createForm.description" rows="6" placeholder="Describe the incident, impact, and current observation." />
          </label>
          <button type="submit" class="button button--primary">Create incident</button>
        </form>
      </section>
    </div>

    <section class="workspace-block">
      <header class="workspace-block__header">
        <div>
          <p class="section-kicker">Detail</p>
          <h3>Selected incident workspace</h3>
        </div>
      </header>

      <div v-if="detailLoading" class="surface-empty">Loading incident detail...</div>
      <div v-else-if="!selectedIncident" class="surface-empty">Select an incident to open comments, tasks, and the timeline.</div>

      <div v-else class="detail-grid">
        <div class="detail-column">
          <section class="detail-panel">
            <div class="detail-panel__header">
              <div>
                <h4>{{ selectedIncident.title }}</h4>
                <p>{{ selectedIncident.description || 'No description supplied.' }}</p>
              </div>
              <span class="status-pill" :class="incidentStatusTone(selectedIncident.status)">
                {{ humanizeIncidentStatus(selectedIncident.status) }}
              </span>
            </div>

            <dl class="detail-facts">
              <div>
                <dt>Team</dt>
                <dd>{{ teamLabel(selectedIncident.team_id) }}</dd>
              </div>
              <div>
                <dt>Reporter</dt>
                <dd>{{ userLabel(selectedIncident.reporter_id) }}</dd>
              </div>
              <div>
                <dt>Assignee</dt>
                <dd>{{ userLabel(selectedIncident.assignee_id) }}</dd>
              </div>
              <div>
                <dt>Incident ID</dt>
                <dd>{{ shortId(selectedIncident.id) }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-panel">
            <header class="detail-panel__mini-header">
              <h4>Status transitions</h4>
            </header>

            <div v-if="statusActions.length === 0" class="surface-empty surface-empty--compact">
              No further status transitions are available.
            </div>
            <div v-else class="inline-actions">
              <button
                v-for="statusAction in statusActions"
                :key="statusAction.value"
                type="button"
                class="button button--soft"
                @click="handleStatusUpdate(statusAction.value)"
              >
                Move to {{ statusAction.label }}
              </button>
            </div>

            <div v-if="canManage" class="surface-form surface-form--row surface-form--tight">
              <label class="field">
                <span>Assign to</span>
                <select v-model="assignmentUserId">
                  <option disabled value="">Select a user</option>
                  <option v-for="user in adminUsers" :key="user.id" :value="user.id">{{ user.email }}</option>
                </select>
              </label>
              <button type="button" class="button button--primary" @click="handleAssignIncident">
                Assign incident
              </button>
            </div>
          </section>

          <section class="detail-panel">
            <header class="detail-panel__mini-header">
              <h4>Comments</h4>
            </header>

            <form class="surface-form" @submit.prevent="handleAddComment">
              <label class="field">
                <span>Add a comment</span>
                <textarea v-model="commentDraft" rows="4" placeholder="Post an update for the current incident." />
              </label>
              <button type="submit" class="button button--primary">Add comment</button>
            </form>

            <div v-if="comments.length === 0" class="surface-empty surface-empty--compact">No comments yet.</div>
            <div v-else class="note-list">
              <article v-for="comment in comments" :key="comment.id" class="note-list__item">
                <div>
                  <strong>{{ userLabel(comment.author_id) }}</strong>
                  <p>{{ comment.content }}</p>
                </div>
                <small>{{ formatDateTime(comment.created_at) }}</small>
              </article>
            </div>
          </section>
        </div>

        <div class="detail-column">
          <section class="detail-panel">
            <header class="detail-panel__mini-header">
              <h4>Create task</h4>
            </header>

            <form class="surface-form" @submit.prevent="handleCreateTask">
              <label class="field">
                <span>Task title</span>
                <input v-model="taskForm.title" type="text" placeholder="Collect logs from failing service" />
              </label>
              <label class="field">
                <span>Description</span>
                <textarea v-model="taskForm.description" rows="4" placeholder="Add implementation notes or operating constraints." />
              </label>
              <label v-if="canManage" class="field">
                <span>Assignee</span>
                <select v-model="taskForm.assigneeId">
                  <option value="">Leave unassigned</option>
                  <option v-for="user in adminUsers" :key="user.id" :value="user.id">{{ user.email }}</option>
                </select>
              </label>
              <button type="submit" class="button button--primary">Create task</button>
            </form>
          </section>

          <section class="detail-panel">
            <header class="detail-panel__mini-header">
              <h4>Tasks</h4>
            </header>

            <div v-if="relatedTasks.length === 0" class="surface-empty surface-empty--compact">No tasks linked to this incident yet.</div>
            <div v-else class="task-list">
              <article v-for="task in relatedTasks" :key="task.id" class="task-row">
                <div class="task-row__main">
                  <div class="activity-row__headline">
                    <strong>{{ task.title }}</strong>
                    <span class="status-pill" :class="taskStatusTone(task.status)">
                      {{ humanizeTaskStatus(task.status) }}
                    </span>
                  </div>
                  <p>{{ task.description || 'No task description supplied.' }}</p>
                  <small>Assignee {{ userLabel(task.assignee_id) }}</small>
                </div>
                <div v-if="task.status === 'TODO'" class="inline-actions">
                  <button type="button" class="button button--soft" @click="handleTaskStatus(task.id, 'DONE')">
                    Mark done
                  </button>
                  <button type="button" class="button button--ghost" @click="handleTaskStatus(task.id, 'CANCELED')">
                    Cancel
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section class="detail-panel">
            <header class="detail-panel__mini-header">
              <h4>Timeline</h4>
            </header>

            <div v-if="timeline.length === 0" class="surface-empty surface-empty--compact">No timeline entries yet.</div>
            <div v-else class="timeline-list">
              <article v-for="event in timeline" :key="event.id" class="timeline-list__item">
                <div>
                  <strong>{{ event.summary || event.type }}</strong>
                  <p>Actor {{ userLabel(event.actor_id) }}</p>
                </div>
                <small>{{ formatDateTime(event.created_at) }}</small>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  </AppShell>
</template>
