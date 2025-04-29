<template>
  <footer class="site-footer">
    <div class="container footer-container">
      <div class="footer-about">
        <a href="#" class="footer-logo">
          <img src="/logo.png" alt="Logo GarmenKeren" class="footer-logo-img">
          <span>GarmenKeren</span>
        </a>
        <p>Menyediakan produk rumah tangga berkualitas untuk membantu Anda menciptakan rumah yang nyaman dan fungsional.</p>
        <div class="social-links">
          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="#" aria-label="Pinterest"><i class="fab fa-pinterest"></i></a>
          <a href="#" aria-label="Whatsapp"><i class="fab fa-whatsapp"></i></a>
        </div>
      </div>

      <div class="footer-links">
        <h4>Tautan Cepat</h4>
        <ul>
          <li><a href="#featured">Produk Terbaru</a></li>
          <li><a href="#brand">Tentang Kami</a></li>
          <li><a href="#">FAQ</a></li>
          <li><a href="#">Kontak</a></li>
          <li><a href="#">Blog/Tips</a></li>
        </ul>
      </div>

      <div class="footer-links">
        <h4>Bantuan</h4>
        <ul>
          <li><a href="#">Cara Pemesanan</a></li>
          <li><a href="#">Kebijakan Pengembalian</a></li>
          <li><a href="#">Panduan Perawatan Produk</a></li>
          <li><a href="#">Syarat & Ketentuan</a></li>
          <li><a href="#">Kebijakan Privasi</a></li>
        </ul>
      </div>

      <div class="footer-subscribe">
         <h4>Tetap Terhubung</h4>
         <p>Dapatkan info promo & produk baru langsung ke emailmu.</p>
         <form @submit.prevent class="footer-newsletter">
             <input type="email" placeholder="Email kamu...">
             <button type="submit"><i class="fas fa-paper-plane"></i></button>
         </form>
      </div>

    </div>
    <div class="footer-bottom">
      <p>© {{ new Date().getFullYear() }} GarmenKeren. All Rights Reserved.</p>
    </div>
  </footer>
</template>