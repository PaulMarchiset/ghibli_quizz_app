<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  totalSeconds: number
}>()

const emit = defineEmits<{
  (e: 'timeout'): void
}>()

const timeLeft = ref(props.totalSeconds)
const interval = ref<number | null>(null)

const percentage = computed(() => (timeLeft.value / props.totalSeconds) * 100)
const circumference = 2 * Math.PI * 34 // radius = 34 (matching the circle)

const strokeDashoffset = computed(() => 
  circumference * (1 - percentage.value / 100)
)

// Color based on percentage remaining
const strokeColor = computed(() => {
  const p = percentage.value
  if (p > 75) return '#22c55e' // green
  if (p > 50) return '#eab308' // yellow
  if (p > 25) return '#f97316' // orange
  return '#ef4444' // red
})

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

onMounted(() => {
  interval.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      if (interval.value) {
        clearInterval(interval.value)
        interval.value = null
      }
      emit('timeout')
    }
  }, 1000)
})

onUnmounted(() => {
  if (interval.value) {
    clearInterval(interval.value)
    interval.value = null
  }
})
</script>

<template>
  <div class="timer-container">
    <div class="timer-circle">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <!-- Background circle -->
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="6"
        />
        
        <!-- Progress arc -->
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          :stroke="strokeColor"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 40 40) scale(1, -1) translate(0, -80)"
          class="progress-circle"
        />
      </svg>
      
      <!-- Time remaining in center -->
      <span class="time-text">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<style scoped>
.timer-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.timer-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.time-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.25rem;
  font-weight: 700;
  color: #000;
}

.progress-circle {
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}
</style>