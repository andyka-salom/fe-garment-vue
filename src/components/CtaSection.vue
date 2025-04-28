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
  
  <style scoped>
  .cta-section {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--white);
    padding: 100px 20px; 
  }
  
  .cta-container {
      max-width: 700px;
      text-align: center;
  }
  
  .cta-title {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
  }
  
  .cta-text {
      font-size: 1.1rem;
      margin-bottom: 2.5rem;
      opacity: 0.9;
      color: var(--white);
      line-height: 1.7;
  }
  
  .newsletter-form .form-group {
      display: flex;
      justify-content: center;
      align-items: center;
      max-width: 500px;
      margin: 0 auto 1rem auto;
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      padding: 5px;
      overflow: hidden;
  }
  
  .newsletter-form input[type="email"] {
      flex-grow: 1;
      padding: 15px 20px;
      border: none;
      background: transparent;
      color: var(--white);
      font-size: 1rem;
      outline: none;
  }
  
  .newsletter-form input[type="email"]::placeholder {
      color: rgba(255, 255, 255, 0.7);
  }
  
  .newsletter-form button {
      border-radius: 25px;
      padding: 12px 25px;
      white-space: nowrap;
      background: var(--accent-color);
      color: var(--white);
      box-shadow: none;
      transition: background-color 0.3s ease;
  }
  .newsletter-form button:hover {
      background: #ff8a8a;
      transform: none;
      box-shadow: none;
  }
  
  .subscribe-message {
      margin-top: 15px;
      font-weight: 600;
      font-size: 0.9rem;
  }
  .subscribe-message.success {
      color: #a7ffa7;
  }
  .subscribe-message:not(.success) {
      color: #ffcaca;
  }
  
  /* Responsive */
  @media (max-width: 576px) {
      .cta-title {
          font-size: 2rem;
      }
      .cta-text {
          font-size: 1rem;
      }
      .newsletter-form .form-group {
          flex-direction: column;
          background: none;
          padding: 0;
          gap: 15px;
      }
      .newsletter-form input[type="email"] {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 30px;
          text-align: center;
      }
      .newsletter-form button {
          width: 100%;
      }
  }
  
  </style>