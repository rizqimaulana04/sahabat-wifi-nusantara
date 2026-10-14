/** Interaksi website tanpa framework atau dependensi eksternal. */
(() => {
  'use strict';
  const config = window.SWN_CONFIG;
  const whatsappUrl = message => `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;

  function connectWhatsAppLinks(root = document) {
    root.querySelectorAll('[data-wa]').forEach(link => {
      link.href = whatsappUrl(link.dataset.wa);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  function renderPackages() {
    const grid = document.querySelector('#needs-grid');
    grid.replaceChildren();
    config.packages.forEach(plan => {
      const card = document.createElement('article');
      card.className = `need-card${plan.featured ? ' featured' : ''}`;
      // Teks berasal dari konfigurasi lokal, bukan input pengguna.
      const price = new Intl.NumberFormat('id-ID').format(plan.price);
      card.innerHTML = `${plan.featured ? '<span class="featured-label">UNTUK RUMAH AKTIF</span>' : ''}
        <div class="need-top"><span class="plan-tier">${plan.name}</span><span>${plan.tag}</span></div>
        <h3 class="plan-speed">${plan.speed}<span>Mbps</span></h3><p>${plan.description}</p>
        <div class="plan-price"><span>Rp</span>${price}<small>/ bulan</small></div>
        <ul><li><span aria-hidden="true">✓</span>Rekomendasi ${plan.devices}</li>
          ${plan.items.map(item => `<li><span aria-hidden="true">✓</span>${item}</li>`).join('')}
          <li><span aria-hidden="true">✓</span>Unlimited tanpa batas kuota</li></ul>
        <a class="button ${plan.featured ? '' : 'button-outline'}" data-wa="Halo Sahabat Wifi Nusantara, saya tertarik paket ${plan.speed} Mbps seharga Rp${price}/bulan. Mohon informasi ketersediaan area, biaya, dan syarat pemasangan.">Pilih ${plan.speed} Mbps <span aria-hidden="true">↗</span></a>`;
      grid.append(card);
    });
    connectWhatsAppLinks(grid);
  }

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigasi');
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Buka menu');
    navigation.classList.remove('is-open');
  }
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Tutup menu' : 'Buka menu');
    navigation.classList.toggle('is-open', expanded);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-wrap')) closeMenu(); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);

  document.querySelectorAll('[data-promo]').forEach(element => {
    element.hidden = Date.now() >= new Date(config.promo.endsAt).getTime();
  });

  document.querySelector('#coverage-form').addEventListener('submit', event => {
    event.preventDefault();
    const areaInput = document.querySelector('#area-input');
    const area = areaInput.value.trim();
    if (area.length < 2) {
      areaInput.setCustomValidity('Masukkan kecamatan atau kota Anda.');
      areaInput.reportValidity();
      return;
    }
    areaInput.setCustomValidity('');
    window.open(whatsappUrl(`Halo Sahabat Wifi Nusantara, apakah layanan tersedia di ${area}? Saya ingin mengetahui pilihan paket dan pemasangannya.`), '_blank', 'noopener,noreferrer');
  });
  document.querySelector('#area-input').addEventListener('input', event => event.target.setCustomValidity(''));
  document.querySelector('#year').textContent = new Date().getFullYear();
  renderPackages();
  connectWhatsAppLinks();
})();
