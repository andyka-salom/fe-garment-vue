<script setup>
import { ref } from 'vue';

const props = defineProps({
  message: String,
  type: String
});

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

