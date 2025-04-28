<template>
    <section id="featured" class="featured-products">
      <div class="container">
        <!-- Judul Section Diperbarui -->
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
                <!-- Pastikan path gambar sesuai dengan produk rumah tangga -->
                <img :src="product.imageUrl" :alt="product.name" class="product-image">
                <div class="product-overlay">
                    <button class="btn btn-primary btn-view">Lihat Detail</button>
                </div>
            </div>
            <div class="product-info">
              <!-- Nama Produk Diperbarui -->
              <h3 class="product-name">{{ product.name }}</h3>
              <!-- Harga Produk Diperbarui -->
              <p class="product-price">{{ formatCurrency(product.price) }}</p>
            </div>
          </div>
        </div>
        <div class="view-all-cta" data-aos="fade-up" data-aos-delay="400">
            <!-- Teks Tombol CTA Diperbarui -->
            <a href="#" class="btn btn-secondary">Lihat Semua Produk Rumah</a>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  // import AOS from 'aos'; // Jika pakai AOS
  
  // --- Data Produk Diperbarui untuk Barang Rumah Tangga ---
  // Ganti imageUrl dengan path gambar Anda yang sebenarnya di folder /public
  const products = ref([
    { id: 1, name: 'Kotak Penyimpanan Serbaguna (Set 3)', price: 129000, imageUrl: '/household1.jpg' }, // Ganti gambar
    { id: 2, name: 'Set Alat Masak Anti Lengket (5 pcs)', price: 285000, imageUrl: '/household2.jpg' }, // Ganti gambar
    { id: 3, name: 'Rak Dinding Minimalis Kayu Solid', price: 95000, imageUrl: '/household3.jpg' }, // Ganti gambar
    // Anda bisa menambahkan lebih banyak produk di sini
    // { id: 4, name: 'Lampu Meja Baca LED Fleksibel', price: 150000, imageUrl: '/household4.jpg' },
  ]);
  
  // Fungsi format mata uang (tetap sama)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };
  
  // Jika pakai AOS
  // import { onMounted } from 'vue'; // Jangan lupa import jika menggunakan onMounted
  // onMounted(() => { AOS.init({ duration: 800, once: true }); });
  </script>
  
  <style scoped>
  /* --- Style CSS (umumnya tidak perlu diubah signifikan, tapi bisa disesuaikan) --- */
  .featured-products { background-color: var(--light-gray); }
  .section-title { /* Style judul tetap sama */
      text-align: center;
      font-size: 2.2rem;
      margin-bottom: 50px;
      position: relative;
      padding-bottom: 15px;
  }
  h2.section-title::after { /* Style garis bawah judul tetap sama */
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      border-radius: 2px;
  }
  .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
  .product-card { background-color: var(--white); border-radius: 10px; overflow: hidden; box-shadow: 0 5px 20px rgba(0, 0, 0, 0.07); transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; }
  .product-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1); }
  .product-image-wrapper {
      position: relative;
      overflow: hidden;
      /* Anda mungkin ingin menyesuaikan aspect-ratio jika gambar produk rumah tangga berbeda */
      aspect-ratio: 1 / 1; /* Contoh: rasio 1:1 (persegi), atau biarkan 3/4 */
  }
  .product-image { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
  .product-card:hover .product-image { transform: scale(1.08); }
  .product-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.2); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.4s ease; padding: 15px; }
  .product-card:hover .product-overlay { opacity: 1; }
  .btn-view { padding: 10px 25px; font-size: 0.9rem; transform: translateY(15px); opacity: 0; transition: transform 0.4s 0.1s ease, opacity 0.4s 0.1s ease; }
  .product-card:hover .btn-view { transform: translateY(0); opacity: 1; }
  .product-info { padding: 20px; text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .product-name { font-size: 1.05rem; margin-bottom: 8px; font-weight: 600; color: var(--text-color); line-height: 1.4; }
  .product-price { font-size: 1.1rem; color: var(--primary-color); font-weight: 700; margin-bottom: 0; }
  .view-all-cta { text-align: center; margin-top: 60px; }
  </style>