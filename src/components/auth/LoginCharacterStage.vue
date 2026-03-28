<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AuthEye from './AuthEye.vue'
import AuthPupil from './AuthPupil.vue'

interface Props {
  isTyping: boolean
  password: string
  showPassword: boolean
}

interface Position {
  faceX: number
  faceY: number
  bodySkew: number
}

const props = defineProps<Props>()

const mouseX = ref(0)
const mouseY = ref(0)
const isLookingAtEachOther = ref(false)
const isPurplePeeking = ref(false)
const purpleRef = ref<HTMLElement | null>(null)
const blackRef = ref<HTMLElement | null>(null)
const yellowRef = ref<HTMLElement | null>(null)
const orangeRef = ref<HTMLElement | null>(null)
let typingTimer: number | undefined
let peekTimer: number | undefined
let peekResetTimer: number | undefined

function useBlinking() {
  const blinking = ref(false)
  let blinkTimer: number | undefined
  let resetTimer: number | undefined

  const scheduleBlink = () => {
    blinkTimer = window.setTimeout(() => {
      blinking.value = true
      resetTimer = window.setTimeout(() => {
        blinking.value = false
        scheduleBlink()
      }, 150)
    }, Math.random() * 4000 + 3000)
  }

  onMounted(scheduleBlink)

  onUnmounted(() => {
    if (blinkTimer) {
      window.clearTimeout(blinkTimer)
    }
    if (resetTimer) {
      window.clearTimeout(resetTimer)
    }
  })

  return blinking
}

const isPurpleBlinking = useBlinking()
const isBlackBlinking = useBlinking()

function handleMouseMove(event: MouseEvent) {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

function calculatePosition(target: HTMLElement | null): Position {
  if (!target) {
    return { faceX: 0, faceY: 0, bodySkew: 0 }
  }

  const rect = target.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 3
  const deltaX = mouseX.value - centerX
  const deltaY = mouseY.value - centerY

  return {
    faceX: Math.max(-15, Math.min(15, deltaX / 20)),
    faceY: Math.max(-10, Math.min(10, deltaY / 30)),
    bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
  }
}

const purplePos = computed(() => calculatePosition(purpleRef.value))
const blackPos = computed(() => calculatePosition(blackRef.value))
const yellowPos = computed(() => calculatePosition(yellowRef.value))
const orangePos = computed(() => calculatePosition(orangeRef.value))
const passwordVisible = computed(() => props.password.length > 0 && props.showPassword)
const passwordHidden = computed(() => props.password.length > 0 && !props.showPassword)

watch(
  () => props.isTyping,
  (isTyping) => {
    if (typingTimer) {
      window.clearTimeout(typingTimer)
    }

    if (!isTyping) {
      isLookingAtEachOther.value = false
      return
    }

    isLookingAtEachOther.value = true
    typingTimer = window.setTimeout(() => {
      isLookingAtEachOther.value = false
    }, 800)
  },
  { immediate: true },
)

watch(
  () => [props.password, props.showPassword] as const,
  ([password, showPassword]) => {
    if (peekTimer) {
      window.clearTimeout(peekTimer)
    }
    if (peekResetTimer) {
      window.clearTimeout(peekResetTimer)
    }

    if (!(password.length > 0 && showPassword)) {
      isPurplePeeking.value = false
      return
    }

    const schedulePeek = () => {
      peekTimer = window.setTimeout(() => {
        isPurplePeeking.value = true
        peekResetTimer = window.setTimeout(() => {
          isPurplePeeking.value = false
          schedulePeek()
        }, 800)
      }, Math.random() * 3000 + 2000)
    }

    schedulePeek()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (typingTimer) {
    window.clearTimeout(typingTimer)
  }
  if (peekTimer) {
    window.clearTimeout(peekTimer)
  }
  if (peekResetTimer) {
    window.clearTimeout(peekResetTimer)
  }
})
</script>

<template>
  <div class="login-art" aria-hidden="true">
    <div class="login-art__brand">
      <div class="login-art__brand-mark">
        <span class="login-art__brand-glyph">✦</span>
      </div>
      <span>Incident Dispatch</span>
    </div>

    <div class="login-art__characters">
      <div class="login-art__character-stage">
        <div
          ref="purpleRef"
          class="login-character login-character--purple"
          :style="{
            left: '70px',
            width: '180px',
            height: props.isTyping || passwordHidden ? '440px' : '400px',
            transform: passwordVisible
              ? 'skewX(0deg)'
              : props.isTyping || passwordHidden
                ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
                : `skewX(${purplePos.bodySkew}deg)`,
          }"
        >
          <div
            class="login-character__eyes"
            :style="{
              left: passwordVisible ? '20px' : isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`,
              top: passwordVisible ? '35px' : isLookingAtEachOther ? '65px' : `${40 + purplePos.faceY}px`,
              gap: '32px',
            }"
          >
            <AuthEye
              :size="18"
              :pupil-size="7"
              :max-distance="5"
              :is-blinking="isPurpleBlinking"
              :force-look-x="
                passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
              "
              :force-look-y="
                passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
              "
            />
            <AuthEye
              :size="18"
              :pupil-size="7"
              :max-distance="5"
              :is-blinking="isPurpleBlinking"
              :force-look-x="
                passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
              "
              :force-look-y="
                passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
              "
            />
          </div>
        </div>

        <div
          ref="blackRef"
          class="login-character login-character--black"
          :style="{
            left: '240px',
            width: '120px',
            height: '310px',
            transform: passwordVisible
              ? 'skewX(0deg)'
              : isLookingAtEachOther
                ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
                : props.isTyping || passwordHidden
                  ? `skewX(${blackPos.bodySkew * 1.5}deg)`
                  : `skewX(${blackPos.bodySkew}deg)`,
          }"
        >
          <div
            class="login-character__eyes"
            :style="{
              left: passwordVisible ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
              top: passwordVisible ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`,
              gap: '24px',
            }"
          >
            <AuthEye
              :size="16"
              :pupil-size="6"
              :max-distance="4"
              :is-blinking="isBlackBlinking"
              :force-look-x="passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined"
              :force-look-y="passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined"
            />
            <AuthEye
              :size="16"
              :pupil-size="6"
              :max-distance="4"
              :is-blinking="isBlackBlinking"
              :force-look-x="passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined"
              :force-look-y="passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined"
            />
          </div>
        </div>

        <div
          ref="orangeRef"
          class="login-character login-character--orange"
          :style="{
            left: '0px',
            width: '240px',
            height: '200px',
            transform: passwordVisible ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew}deg)`,
          }"
        >
          <div
            class="login-character__eyes"
            :style="{
              left: passwordVisible ? '50px' : `${82 + orangePos.faceX}px`,
              top: passwordVisible ? '85px' : `${90 + orangePos.faceY}px`,
              gap: '32px',
            }"
          >
            <AuthPupil :size="12" :max-distance="5" :force-look-x="passwordVisible ? -5 : undefined" :force-look-y="passwordVisible ? -4 : undefined" />
            <AuthPupil :size="12" :max-distance="5" :force-look-x="passwordVisible ? -5 : undefined" :force-look-y="passwordVisible ? -4 : undefined" />
          </div>
        </div>

        <div
          ref="yellowRef"
          class="login-character login-character--yellow"
          :style="{
            left: '310px',
            width: '140px',
            height: '230px',
            transform: passwordVisible ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew}deg)`,
          }"
        >
          <div
            class="login-character__eyes"
            :style="{
              left: passwordVisible ? '20px' : `${52 + yellowPos.faceX}px`,
              top: passwordVisible ? '35px' : `${40 + yellowPos.faceY}px`,
              gap: '24px',
            }"
          >
            <AuthPupil :size="12" :max-distance="5" :force-look-x="passwordVisible ? -5 : undefined" :force-look-y="passwordVisible ? -4 : undefined" />
            <AuthPupil :size="12" :max-distance="5" :force-look-x="passwordVisible ? -5 : undefined" :force-look-y="passwordVisible ? -4 : undefined" />
          </div>
          <div
            class="login-character__mouth"
            :style="{
              left: passwordVisible ? '10px' : `${40 + yellowPos.faceX}px`,
              top: passwordVisible ? '88px' : `${88 + yellowPos.faceY}px`,
            }"
          />
        </div>
      </div>
    </div>

    <div class="login-art__links">
      <span>Private routing</span>
      <span>Bearer auth</span>
      <span>Incident timeline</span>
    </div>

    <div class="login-art__grid" />
    <div class="login-art__blur login-art__blur--one" />
    <div class="login-art__blur login-art__blur--two" />
  </div>
</template>
