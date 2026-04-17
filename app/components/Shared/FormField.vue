<script setup lang="ts">
const props = defineProps<{
  label: string
  forId?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="props.forId" class="text-xs font-semibold text-gray-600">{{ props.label }}</label>
    <slot />
  </div>
</template>
