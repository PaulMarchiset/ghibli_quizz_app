<template>
  <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
    <div class="flex-1 space-y-4">
      <slot name="main" />
    </div>
    <aside class="hidden lg:flex lg:w-72 lg:flex-col lg:gap-6">
      <slot name="sidebar" />
    </aside>
  </div>
</template>
