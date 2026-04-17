<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="space-y-1">
    <p class="text-gray-700">{{ title }}</p>
    <p v-if="description" class="text-sm text-gray-600">{{ description }}</p>
  </div>
</template>
