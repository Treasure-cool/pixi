// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import CanvasEditor from './components/CanvasEditor.vue';

const app = createApp(App);
app.component('CanvasEditor', CanvasEditor);
app.mount('#app');