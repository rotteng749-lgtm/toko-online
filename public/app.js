(function() {
  // === Custom Cursor ===
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mouseX = 0, mouseY = 0;
  var dotX = 0, dotY = 0;
  var ringX = 0, ringY = 0;

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    dotX += (mouseX - dotX) * 0.25;
    dotY += (mouseY - dotY) * 0.25;
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effect for interactive elements
  var interactiveElements = 'a, button, input, textarea, select, .product-card, .cat-pill, .cart-fab, .admin-nav-item, [onclick]';
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(interactiveElements)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(interactiveElements)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  // Click animation
  document.addEventListener('mousedown', function() { document.body.classList.add('cursor-click'); });
  document.addEventListener('mouseup', function() { document.body.classList.remove('cursor-click'); });

  // === Toast ===
  function ensureContainer() {
    var el = document.getElementById('toast-container');
    if (!el) { el = document.createElement('div'); el.id = 'toast-container'; el.className = 'toast-container'; document.body.appendChild(el); }
    return el;
  }
  window.showToast = function(msg, type) {
    type = type || 'success';
    var c = ensureContainer();
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function() { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = 'all 0.3s ease'; setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3500);
  };

  // === Scroll animations ===
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .stat-card, .admin-card').forEach(function(el) {
    observer.observe(el);
  });

  // === Header scroll effect ===
  var header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
})();
