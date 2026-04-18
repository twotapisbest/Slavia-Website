<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

await navigateTo('/admin/zawodnicy', { replace: true })
</script>

<template>
  <UContainer class="py-20 text-center text-muted">
    Przekierowanie…
  </UContainer>
</template>
