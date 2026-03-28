<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import { addTeamMember, createTeam, fetchTeamMembers, fetchTeams, fetchUsers } from '../lib/api'
import { formatDateTime, shortId } from '../lib/format'
import type { TeamMembershipPublic, TeamPublic, UserAdminPublic } from '../types/api'

const loading = ref(true)
const membersLoading = ref(false)
const error = ref('')
const teams = ref<TeamPublic[]>([])
const members = ref<TeamMembershipPublic[]>([])
const adminUsers = ref<UserAdminPublic[]>([])
const canManage = ref(false)
const selectedTeamId = ref('')

const teamForm = reactive({
  name: '',
})

const memberForm = reactive({
  userId: '',
  role: 'MEMBER' as 'OWNER' | 'MEMBER',
})

function userLabel(userId: string) {
  return adminUsers.value.find((item) => item.id === userId)?.email ?? shortId(userId)
}

async function loadTeamMembers(teamId: string) {
  selectedTeamId.value = teamId
  membersLoading.value = true
  error.value = ''

  try {
    members.value = await fetchTeamMembers(teamId)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load team members.'
  } finally {
    membersLoading.value = false
  }
}

async function loadTeamsPage() {
  loading.value = true
  error.value = ''

  try {
    teams.value = await fetchTeams()

    try {
      adminUsers.value = await fetchUsers()
      canManage.value = true
      if (!memberForm.userId && adminUsers.value[0]) {
        memberForm.userId = adminUsers.value[0].id
      }
    } catch {
      adminUsers.value = []
      canManage.value = false
    }

    if (teams.value[0]) {
      await loadTeamMembers(teams.value[0].id)
    } else {
      members.value = []
      selectedTeamId.value = ''
    }
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to load teams.'
  } finally {
    loading.value = false
  }
}

async function handleCreateTeam() {
  if (!teamForm.name.trim()) {
    error.value = 'Team name is required.'
    return
  }

  try {
    const created = await createTeam(teamForm.name.trim())
    teams.value = [created, ...teams.value]
    teamForm.name = ''
    await loadTeamMembers(created.id)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to create team.'
  }
}

async function handleAddMember() {
  if (!selectedTeamId.value || !memberForm.userId) {
    error.value = 'Select a team and a user first.'
    return
  }

  try {
    await addTeamMember(selectedTeamId.value, memberForm.userId, memberForm.role)
    await loadTeamMembers(selectedTeamId.value)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to add the selected user.'
  }
}

onMounted(loadTeamsPage)
</script>

<template>
  <AppShell
    eyebrow="Ownership"
    title="Teams"
    description="Review available teams, inspect membership, and use admin controls to create or extend ownership."
  >
    <template #toolbar>
      <button type="button" class="button button--primary" @click="loadTeamsPage">Refresh teams</button>
    </template>

    <div v-if="error" class="workspace-alert workspace-alert--error">{{ error }}</div>

    <div class="workspace-grid workspace-grid--balanced">
      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Directory</p>
            <h3>Available teams</h3>
          </div>
        </header>

        <div v-if="loading" class="surface-empty">Loading teams...</div>
        <div v-else-if="teams.length === 0" class="surface-empty">No teams exist yet.</div>

        <div v-else class="activity-list">
          <button
            v-for="team in teams"
            :key="team.id"
            type="button"
            class="list-button"
            :class="{ 'list-button--active': selectedTeamId === team.id }"
            @click="loadTeamMembers(team.id)"
          >
            <div>
              <strong>{{ team.name }}</strong>
              <p>{{ shortId(team.id) }}</p>
            </div>
            <small>{{ formatDateTime(team.created_at) }}</small>
          </button>
        </div>
      </section>

      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Membership</p>
            <h3>Selected team roster</h3>
          </div>
        </header>

        <div v-if="membersLoading" class="surface-empty">Loading members...</div>
        <div v-else-if="!selectedTeamId" class="surface-empty">Select a team to inspect its members.</div>
        <div v-else-if="members.length === 0" class="surface-empty">This team does not have visible members yet.</div>

        <div v-else class="note-list">
          <article v-for="member in members" :key="member.id" class="note-list__item">
            <div>
              <strong>{{ userLabel(member.user_id) }}</strong>
              <p>{{ shortId(member.user_id) }}</p>
            </div>
            <div class="note-list__meta">
              <span class="meta-chip">{{ member.role }}</span>
              <small>{{ formatDateTime(member.created_at) }}</small>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div v-if="canManage" class="workspace-grid workspace-grid--balanced">
      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Admin</p>
            <h3>Create a new team</h3>
          </div>
        </header>

        <form class="surface-form" @submit.prevent="handleCreateTeam">
          <label class="field">
            <span>Team name</span>
            <input v-model="teamForm.name" type="text" placeholder="North response desk" />
          </label>
          <button type="submit" class="button button--primary">Create team</button>
        </form>
      </section>

      <section class="workspace-block">
        <header class="workspace-block__header">
          <div>
            <p class="section-kicker">Admin</p>
            <h3>Add a team member</h3>
          </div>
        </header>

        <form class="surface-form" @submit.prevent="handleAddMember">
          <label class="field">
            <span>User</span>
            <select v-model="memberForm.userId">
              <option disabled value="">Select a user</option>
              <option v-for="user in adminUsers" :key="user.id" :value="user.id">{{ user.email }}</option>
            </select>
          </label>
          <label class="field">
            <span>Role</span>
            <select v-model="memberForm.role">
              <option value="MEMBER">Member</option>
              <option value="OWNER">Owner</option>
            </select>
          </label>
          <button type="submit" class="button button--primary">Add member</button>
        </form>
      </section>
    </div>
  </AppShell>
</template>
