<template>
  <n-message-provider>
    <n-dialog-provider>
      <RouterView />
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped></style>
