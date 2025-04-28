<script setup>
import { ref } from 'vue';

// Propertis untuk menampilkan notifikasi
const props = defineProps({
  message: String,
  type: String
});

// Status visibility modal
const showModal = ref(true);

const closeModal = () => {
  showModal.value = false;
};
</script>

<template>
  <div v-if="showModal" class="notification-modal" :class="['notification-modal--' + type]">
    <div class="notification-modal-content">
      <button class="close-btn" @click="closeModal">×</button>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.notification-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.4); z-index: 1000; }
.notification-modal-content { background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 100%; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); position: relative; text-align: center; }
.notification-modal--success { border-left: 6px solid green; }
.notification-modal--error { border-left: 6px solid red; }
.notification-modal .close-btn { position: absolute; top: 10px; right: 10px; font-size: 20px; border: none; background: none; cursor: pointer; }
</style>
