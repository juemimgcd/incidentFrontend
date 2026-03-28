import { computed, reactive } from 'vue'
import { fetchCurrentUser } from '../lib/api'
import { clearStoredToken, getStoredToken, storeToken } from '../lib/session'
import type { UserPublic } from '../types/api'

type AuthStatus = 'idle' | 'loading' | 'ready'

const state = reactive({
  token: getStoredToken() as string | null,
  profile: null as UserPublic | null,
  status: 'idle' as AuthStatus,
})

let initPromise: Promise<void> | null = null

function resetAuth() {
  clearStoredToken()
  state.token = null
  state.profile = null
  state.status = 'ready'
}

export async function refreshProfile() {
  if (!state.token) {
    state.profile = null
    return null
  }

  try {
    const profile = await fetchCurrentUser(state.token)
    state.profile = profile
    return profile
  } catch (error) {
    resetAuth()
    throw error
  }
}

export async function ensureAuthReady() {
  if (state.status === 'ready') {
    return
  }

  if (!initPromise) {
    initPromise = (async () => {
      state.status = 'loading'

      if (!state.token) {
        state.status = 'ready'
        return
      }

      try {
        await refreshProfile()
      } catch {
        state.profile = null
      } finally {
        state.status = 'ready'
      }
    })().finally(() => {
      initPromise = null
    })
  }

  await initPromise
}

export async function establishSession(token: string, remember: boolean) {
  state.token = token
  storeToken(token, remember)
  state.status = 'loading'

  try {
    await refreshProfile()
  } finally {
    state.status = 'ready'
  }
}

export function logout() {
  resetAuth()
}

export function useAuth() {
  return {
    state,
    isAuthenticated: computed(() => Boolean(state.token && state.profile)),
  }
}
