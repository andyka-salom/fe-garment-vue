<template>
    <section id="featured" class="featured-products">
      <div class="container">
        <h2 class="section-title">Produk Rumah Tangga Pilihan ✨</h2>
        <div class="product-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
            data-aos="fade-up"
            :data-aos-delay="product.id * 100"
          >
            <div class="product-image-wrapper">
                <img :src="product.imageUrl" :alt="product.name" class="product-image">
                <div class="product-overlay">
                    <button class="btn btn-primary btn-view">Lihat Detail</button>
                </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-price">{{ formatCurrency(product.price) }}</p>
            </div>
          </div>
        </div>
        <div class="view-all-cta" data-aos="fade-up" data-aos-delay="400">
            <a href="#" class="btn btn-secondary">Lihat Semua Produk Rumah</a>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  const products = ref([
    { id: 1, name: 'Kotak Penyimpanan Serbaguna (Set 3)', price: 129000, imageUrl: '/household1.jpg' },
    { id: 2, name: 'Set Alat Masak Anti Lengket (5 pcs)', price: 285000, imageUrl: '/household2.jpg' },
    { id: 3, name: 'Rak Dinding Minimalis Kayu Solid', price: 95000, imageUrl: '/household3.jpg' },
  ]);
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };
  
  </script>
