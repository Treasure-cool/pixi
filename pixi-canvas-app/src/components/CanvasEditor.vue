<!-- src/components/CanvasEditor.vue -->
<template>
  <div id="canvas-container" style="width: 100vw; height: 100vh; overflow: hidden;"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { CanvasApp } from '../canvas/CanvasApp';

onMounted(() => {
  new CanvasApp('canvas-container');
});
</script>