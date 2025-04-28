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

<style scoped>
.site-footer {
  background-color: #222;
  color: #ccc;
  padding: 60px 0 0 0;
}

.footer-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 40px;
  padding-bottom: 40px;
}

.footer-about .footer-logo {
    display: inline-flex;
    align-items: center;
    margin-bottom: 15px;
    text-decoration: none;
    color: var(--white);
    font-size: 1.5rem;
    font-weight: 700;
}
.footer-logo-img {
    height: 35px;
    margin-right: 10px;
    filter: brightness(0) invert(1);
}

.footer-about p {
    font-size: 0.9rem;
    line-height: 1.7;
    margin-bottom: 20px;
    color: #aaa;
}

.social-links a {
    color: #aaa;
    font-size: 1.3rem;
    margin-right: 15px;
    transition: color 0.3s ease;
}
.social-links a:last-child {
    margin-right: 0;
}
.social-links a:hover {
    color: var(--accent-color);
}

.footer-links h4,
.footer-subscribe h4 {
    color: var(--white);
    font-size: 1.1rem;
    margin-bottom: 20px;
    font-weight: 600;
    position: relative;
    padding-bottom: 10px;
}
.footer-links h4::after,
.footer-subscribe h4::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 2px;
    background: var(--accent-color);
}

.footer-links ul {
    list-style: none;
    padding: 0;
}

.footer-links li {
    margin-bottom: 10px;
}

.footer-links a {
    color: #aaa;
    font-size: 0.95rem;
    transition: color 0.3s ease, padding-left 0.3s ease;
}

.footer-links a:hover {
    color: var(--white);
    padding-left: 5px;
}

.footer-subscribe p {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 15px;
}
.footer-newsletter {
    display: flex;
    background-color: #333;
    border-radius: 5px;
    overflow: hidden;
    max-width: 300px;
}
.footer-newsletter input {
    flex-grow: 1;
    padding: 10px 15px;
    border: none;
    background: none;
    color: var(--white);
    outline: none;
}
.footer-newsletter input::placeholder {
    color: #888;
}
.footer-newsletter button {
    background: var(--accent-color);
    border: none;
    color: var(--white);
    padding: 0 15px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.footer-newsletter button:hover {
    background: #ff8a8a;
}

.footer-bottom {
  border-top: 1px solid #444;
  padding: 20px 0;
  text-align: center;
  margin-top: 20px;
}

.footer-bottom p {
  font-size: 0.85rem;
  color: #888;
  margin: 0;
}

/* Responsive Footer */
@media (max-width: 768px) {
    .footer-container {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 30px;
    }
     .footer-about, .footer-links, .footer-subscribe {
        text-align: center;
     }
     .footer-about .footer-logo {
         justify-content: center;
     }
     .social-links {
         justify-content: center;
     }
      .footer-links h4::after,
      .footer-subscribe h4::after {
        left: 50%;
        transform: translateX(-50%);
      }
       .footer-links ul {
           padding-left: 0;
       }
       .footer-newsletter {
           margin-left: auto;
           margin-right: auto;
       }
}
</style>