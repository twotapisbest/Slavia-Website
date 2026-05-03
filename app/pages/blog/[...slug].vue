<script setup lang="ts">
const route = useRoute()
const raw = route.params.slug
const path = Array.isArray(raw) ? raw.filter(Boolean).join('/') : String(raw ?? '').replace(/^\/+|\/+$/g, '')
if (path) {
  await navigateTo(`/aktualnosci/${path}`, { replace: true })
} else {
  await navigateTo('/aktualnosci', { replace: true })
}
</script>

<template>
  <div class="min-h-[20vh]" />
</template>
