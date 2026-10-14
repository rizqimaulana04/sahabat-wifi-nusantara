/** Direction-aware holographic reveals; progressively enhanced and reduced-motion safe. */
(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const targets = [...document.querySelectorAll(
    '.partner-section, .certification-section, .section-heading, .benefit-card, ' +
    '.needs-section .center-heading, .package-pills, .need-card, .promo-strip, ' +
    '.speed-intro, .speed-panel, .steps-intro, .steps li, .coverage, ' +
    '.faq-section>div, .contact-band .container, .footer-top, .footer-bottom'
  )];
  let observer;
  let previousY = window.scrollY;
  let direction = 'down';
  let frame = 0;

  function trackDirection() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const currentY = window.scrollY;
      if (Math.abs(currentY - previousY) > 2) {
        direction = currentY > previousY ? 'down' : 'up';
        previousY = currentY;
      }
      frame = 0;
    });
  }

  function configure() {
    observer?.disconnect();
    if (preference.matches) {
      targets.forEach(element => element.classList.remove('scroll-reveal', 'is-revealed'));
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target;
        // Exit direction follows the viewport edge, so upward/downward reversals are natural.
        const above = entry.boundingClientRect.bottom < entry.rootBounds.top;
        const below = entry.boundingClientRect.top > entry.rootBounds.bottom;
        element.dataset.revealDirection = entry.isIntersecting
          ? direction
          : (above ? 'up' : below ? 'down' : direction);
        element.classList.toggle('is-revealed', entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    targets.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.dataset.revealDirection = 'down';
      const grouped = element.matches('.benefit-card, .need-card, .steps li');
      element.style.setProperty('--reveal-delay', grouped ? `${index % 3 * 55}ms` : '0ms');
      const bounds = element.getBoundingClientRect();
      // Immediately retain already-visible content and direct fragment navigation.
      element.classList.toggle('is-revealed', bounds.bottom > 0 && bounds.top < innerHeight);
      observer.observe(element);
    });
  }

  window.addEventListener('scroll', trackDirection, { passive: true });
  preference.addEventListener('change', configure);
  configure();
})();
