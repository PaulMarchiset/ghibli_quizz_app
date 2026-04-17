<template>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-wrap items-end gap-4">
        <slot name="filters" />
      </div>
      <slot name="actions" />
    </div>
  </div>
</template>
