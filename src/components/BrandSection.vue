<template>
    <section id="brand" class="brand-section">
      <div class="container">
        <!-- Judul Section Diperbarui -->
        <h2 class="section-title">Kualitas & Desain untuk Rumah Impian Anda</h2>
        <div class="brand-content">
          <div class="brand-image" data-aos="fade-right">
            <!-- GANTI GAMBAR & ALT TEXT sesuai brand/produk rumah tangga Anda -->
            <img src="/logo.png" alt="Produk rumah tangga berkualitas dari [Nama Brand Anda]">
          </div>
          <div class="brand-text" data-aos="fade-left" data-aos-delay="200">
            <!-- Judul Teks Diperbarui -->
            <h3>Fungsionalitas, Durabilitas, dan Sentuhan Estetika</h3>
            <!-- Paragraf Narasi Diperbarui -->
            <p>
              Kami percaya setiap rumah layak mendapatkan produk terbaik. Di GarmenKeren, kami memilih dan menyediakan barang rumah tangga yang tidak hanya fungsional tapi juga tahan lama dan menambah keindahan ruangan Anda.
            </p>
            <p>
              Setiap item dipilih dengan cermat, mempertimbangkan kemudahan penggunaan, kualitas bahan, dan desain yang sesuai dengan gaya hidup modern. Kami berkomitmen untuk memberikan nilai terbaik dan kepuasan jangka panjang bagi pelanggan kami.
            </p>
            <!-- Poin Keunggulan Diperbarui -->
            <ul>
              <li><i class="fas fa-check-circle"></i> Desain Fungsional & Menarik</li>
              <li><i class="fas fa-check-circle"></i> Material Berkualitas & Tahan Lama</li>
              <li><i class="fas fa-check-circle"></i> Teruji Kualitas & Keamanannya</li>
              <li><i class="fas fa-check-circle"></i> Nilai Terbaik & Harga Kompetitif</li>
            </ul>
            <!-- Tombol bisa tetap sama -->
            <a href="#" class="btn btn-primary">Pelajari Lebih Lanjut</a>
          </div>
        </div>
      </div>
    </section>
  </template>
  
  <script setup>
  // Script setup tidak perlu diubah
  // import { onMounted } from 'vue';
  // import AOS from 'aos';
  // onMounted(() => { AOS.init({ duration: 800, once: true }); });
  </script>
  
  <style scoped>
  /* --- Style CSS (umumnya tidak perlu diubah, kecuali ingin menyesuaikan estetika) --- */
  .brand-section {
      background-color: var(--white);
  }
  
  .brand-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      align-items: center;
  }
  
  .brand-image img {
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      width: 100%;
      height: auto;
      /* Sesuaikan aspect-ratio jika perlu untuk gambar produk rumah tangga */
      /* aspect-ratio: 1 / 1; */
      object-fit: cover; /* Pastikan gambar terpotong rapi jika aspect ratio diatur */
  }
  
  .brand-text h3 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      color: var(--primary-color);
  }
  
  .brand-text p {
      margin-bottom: 1.5rem;
      color: var(--text-color);
      line-height: 1.7;
  }
  
  .brand-text ul {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
  }
  
  .brand-text li {
      margin-bottom: 10px;
      display: flex;
      align-items: center; /* Pastikan ikon dan teks sejajar */
      color: var(--text-color);
      font-size: 0.95rem; /* Sedikit disesuaikan jika perlu */
  }
  
  .brand-text li i {
      color: var(--secondary-color); /* Warna ikon bisa disesuaikan */
      margin-right: 12px; /* Sedikit lebih jauh */
      font-size: 1.1rem;
      flex-shrink: 0; /* Pastikan ikon tidak mengecil */
  }
  
  /* Responsive (tetap sama) */
  @media (max-width: 992px) {
      .brand-content {
          grid-template-columns: 1fr;
          gap: 40px;
      }
      .brand-image {
          order: 1;
          margin-bottom: 20px; /* Beri jarak bawah gambar di mobile */
      }
      .brand-text {
          order: 2;
          text-align: center;
      }
       .brand-text h3 {
          font-size: 1.6rem;
       }
       .brand-text ul {
           display: inline-block;
           text-align: left;
           max-width: 400px; /* Batasi lebar list agar rapi di tengah */
           width: 100%;
       }
       .brand-text .btn {
           margin: 0 auto;
       }
  }
  </style>