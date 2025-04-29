<template>
    <section id="cta" class="cta-section">
      <div class="container cta-container">
        <div class="cta-content" data-aos="zoom-in">
          <h2 class="cta-title">Jangan Ketinggalan Info!</h2>
          <p class="cta-text">
            Daftar newsletter kami sekarang dan dapatkan diskon 15% untuk pembelian pertamamu, plus info eksklusif tentang koleksi baru & promo spesial!
          </p>
          <form @submit.prevent="subscribeNewsletter" class="newsletter-form">
            <div class="form-group">
              <input type="email" v-model="email" placeholder="Masukkan email kamu..." required>
              <button type="submit" class="btn btn-primary">Daftar Sekarang!</button>
            </div>
            <p v-if="message" class="subscribe-message" :class="{ 'success': isSuccess }">{{ message }}</p>
          </form>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const email = ref('');
  const message = ref('');
  const isSuccess = ref(false);
  
  const subscribeNewsletter = () => {
    console.log('Subscribing email:', email.value);
    isSuccess.value = true;
    message.value = 'Terima kasih! Kamu berhasil terdaftar.';
  
    // Reset setelah beberapa detik
    setTimeout(() => {
        message.value = '';
        email.value = '';
    }, 5000);
  
    // Jika gagal:
    isSuccess.value = false;
    message.value = 'Oops! Terjadi kesalahan. Coba lagi nanti.';
  };
  </script>