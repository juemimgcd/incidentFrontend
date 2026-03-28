<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  forceLookX?: number
  forceLookY?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 48,
  pupilSize: 16,
  maxDistance: 10,
  eyeColor: '#ffffff',
  pupilColor: '#101828',
  isBlinking: false,
  forceLookX: undefined,
  forceLookY: undefined,
})

const eyeRef = ref<HTMLElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)

function handleMouseMove(event: MouseEvent) {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})

const pupilPosition = computed(() => {
  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY }
  }

  if (!eyeRef.value) {
    return { x: 0, y: 0 }
  }

  const rect = eyeRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const deltaX = mouseX.value - centerX
  const deltaY = mouseY.value - centerY
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), props.maxDistance)
  const angle = Math.atan2(deltaY, deltaX)

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  }
})
</script>

<template>
  <div
    ref="eyeRef"
    class="login-character-eye"
    :style="{
      width: `${props.size}px`,
      height: props.isBlinking ? '2px' : `${props.size}px`,
      backgroundColor: props.eyeColor,
    }"
  >
    <div
      v-if="!props.isBlinking"
      class="login-character-eye__inner"
      :style="{
        width: `${props.pupilSize}px`,
        height: `${props.pupilSize}px`,
        backgroundColor: props.pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
      }"
    />
  </div>
</template>
