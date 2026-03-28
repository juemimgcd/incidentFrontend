<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginCharacterStage from '../components/auth/LoginCharacterStage.vue'
import { loginUser, registerUser } from '../lib/api'
import { establishSession, ensureAuthReady, useAuth } from '../stores/auth'

type AuthMode = 'signin' | 'register'

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()

const mode = ref<AuthMode>('signin')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const remember = ref(true)
const showPassword = ref(false)
const isTyping = ref(false)
const error = ref('')
const isLoading = ref(false)

const heading = computed(() => (mode.value === 'signin' ? 'Welcome back!' : 'Create your account'))
const subheading = computed(() =>
  mode.value === 'signin'
    ? 'Use your email and password to enter the dispatch workspace.'
    : 'Set up a new account to start creating incidents and coordinating tasks.',
)

const redirectTarget = computed(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : '/app/overview'
})

function validate() {
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
    return 'Please enter a valid email address.'
  }
  if (password.value.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    return 'Passwords do not match.'
  }
  return ''
}

async function handleSubmit() {
  const nextError = validate()
  if (nextError) {
    error.value = nextError
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    const auth = mode.value === 'signin'
      ? await loginUser(email.value.trim(), password.value)
      : await registerUser(email.value.trim(), password.value)

    await establishSession(auth.access_token, remember.value)
    await router.replace(redirectTarget.value)
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Unable to authenticate right now.'
  } finally {
    isLoading.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'register' : 'signin'
  error.value = ''
}

onMounted(async () => {
  await ensureAuthReady()
  if (isAuthenticated.value) {
    await router.replace(redirectTarget.value)
  }
})
</script>

<template>
  <main class="login-screen login-shell">
    <section class="login-screen__visual visual-panel">
      <LoginCharacterStage :is-typing="isTyping" :password="password" :show-password="showPassword" />
    </section>

    <section class="login-screen__form-panel auth-panel">
      <div class="login-form-shell">
        <div class="login-form-shell__mobile-brand">
          <div class="login-form-shell__mobile-brand-mark">ID</div>
          <span>Incident Dispatch</span>
        </div>

        <div class="login-form-shell__header">
          <h1>{{ heading }}</h1>
          <p>{{ subheading }}</p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <label class="login-field">
            <span>Email</span>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="operator@dispatch.local"
              required
              @focus="isTyping = true"
              @blur="isTyping = false"
            />
          </label>

          <label class="login-field">
            <span>Password</span>
            <div class="login-password-field">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                class="login-password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path
                    d="M10.6 5.2A11.9 11.9 0 0 1 12 5c6.4 0 10 7 10 7a20.9 20.9 0 0 1-3 3.8M6.6 6.6C4 8.4 2 12 2 12a20.8 20.8 0 0 0 6.2 6.1M14.1 14.1A3 3 0 0 1 9.9 9.9"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
                </svg>
              </button>
            </div>
          </label>

          <label v-if="mode === 'register'" class="login-field">
            <span>Confirm password</span>
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
              required
            />
          </label>

          <div class="login-form__row">
            <label class="login-checkbox">
              <input v-model="remember" type="checkbox" />
              <span>Remember this session</span>
            </label>
            <button
              type="button"
              class="login-inline-link"
              @click="error = 'Password recovery is not wired in this frontend yet.'"
            >
              Forgot password?
            </button>
          </div>

          <div v-if="error" class="login-error">{{ error }}</div>

          <button type="submit" class="login-submit" :disabled="isLoading">
            {{ isLoading ? 'Working...' : mode === 'signin' ? 'Log in' : 'Create account' }}
          </button>
        </form>

        <div class="login-footer-copy">
          {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
          <button type="button" class="login-inline-link login-inline-link--strong" @click="toggleMode">
            {{ mode === 'signin' ? 'Sign up' : 'Log in' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
