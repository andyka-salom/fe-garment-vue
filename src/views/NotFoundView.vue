<template>
    <div class="container not-found">
      <h1>404 - Halaman Tidak Ditemukan</h1>
      <p>Maaf, halaman yang Anda cari tidak ada.</p>
      <router-link to="/">Kembali ke Halaman Utama</router-link>
    </div>
  </template>
  
  <style scoped>
  .not-found {
    text-align: center;
    padding: 50px 20px;
    min-height: 300px; /* Agar tidak terlalu pendek */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .not-found h1 {
    color: var(--error-color);
    margin-bottom: 15px;
  }
  .not-found p {
    margin-bottom: 25px;
  }
  .not-found a {
    color: var(--primary-color);
    text-decoration: underline;
  }
  </style>