<!-- src/App.vue -->
<template>
  <div id="app">
    <CanvasEditor />
  </div>
</template>

<script setup lang="ts">
import CanvasEditor from './components/CanvasEditor.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  height: 100%;
}
</style>