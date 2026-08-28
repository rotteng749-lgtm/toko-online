(function() {
  // ==========================================
  // 🌸 CUSTOM CURSOR — Sakura sparkle trail
  // ==========================================
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  var trail = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  trail.className = 'cursor-trail';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.body.appendChild(trail);

  var mouseX = 0, mouseY = 0;
  var dotX = 0, dotY = 0;
  var ringX = 0, ringY = 0;
  var trailX = 0, trailY = 0;

  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Sparkle particles on mouse move
    if (Math.random() > 0.85) {
      createSparkle(e.clientX, e.clientY);
    }
  });

  function createSparkle(x, y) {
    var sparkle = document.createElement('div');
    var size = Math.random() * 6 + 2;
    var colors = ['#ffb7d5', '#c084fc', '#e879f9', '#818cf8', '#f472b6'];
    sparkle.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border-radius:50%;transform:translate(-50%,-50%);transition:all 0.8s ease-out;';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.width = size + 'px';
    sparkle.style.height = size + 'px';
    sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
    sparkle.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + sparkle.style.background;
    document.body.appendChild(sparkle);

    requestAnimationFrame(function() {
      sparkle.style.transform = 'translate(-50%,-50%) scale(0)';
      sparkle.style.opacity = '0';
    });

    setTimeout(function() {
      if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
    }, 800);
  }

  function animateCursor() {
    dotX += (mouseX - dotX) * 0.35;
    dotY += (mouseY - dotY) * 0.35;
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    trailX += (mouseX - trailX) * 0.06;
    trailY += (mouseY - trailY) * 0.06;
    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Interactive hover
  var interactive = 'a, button, input, textarea, select, .product-card, .cat-pill, .cart-fab, .admin-nav-item, .btn, [onclick]';
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest(interactive)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', function(e) {
    if (e.target.closest(interactive)) document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mousedown', function() { document.body.classList.add('cursor-click'); });
  document.addEventListener('mouseup', function() { document.body.classList.remove('cursor-click'); });

  // ==========================================
  // 🌸 SAKURA PETALS — Floating cherry blossoms
  // ==========================================
  function initSakuraPetals() {
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;';
    document.body.appendChild(container);

    function createPetal() {
      var petal = document.createElement('div');
      var size = Math.random() * 12 + 6;
      var startX = Math.random() * window.innerWidth;
      var duration = Math.random() * 8 + 8;
      var delay = Math.random() * 3;
      var drift = (Math.random() - 0.5) * 200;

      petal.style.cssText = 'position:absolute;top:-20px;width:' + size + 'px;height:' + size + 'px;border-radius:50% 0 50% 0;pointer-events:none;opacity:' + (Math.random() * 0.15 + 0.05) + ';';
      petal.style.left = startX + 'px';
      petal.style.background = 'linear-gradient(135deg, #ffb7d5, #ffc8dd)';
      petal.style.boxShadow = '0 0 4px rgba(255,183,213,0.3)';
      petal.style.animation = 'petalFall ' + duration + 's linear ' + delay + 's forwards';
      petal.style.setProperty('--drift', drift + 'px');

      container.appendChild(petal);

      setTimeout(function() {
        if (petal.parentNode) petal.parentNode.removeChild(petal);
      }, (duration + delay) * 1000);
    }

    // Add petal animation
    var style = document.createElement('style');
    style.textContent = '@keyframes petalFall { 0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: var(--start-opacity, 0.1); } 25% { transform: translateX(calc(var(--drift) * 0.3)) translateY(25vh) rotate(90deg); } 50% { transform: translateX(calc(var(--drift) * 0.7)) translateY(50vh) rotate(180deg); opacity: var(--mid-opacity, 0.08); } 75% { transform: translateX(var(--drift)) translateY(75vh) rotate(270deg); } 100% { transform: translateX(calc(var(--drift) * 1.2)) translateY(105vh) rotate(360deg); opacity: 0; } }';
    document.head.appendChild(style);

    // Create petals periodically
    setInterval(function() {
      if (document.querySelectorAll('.product-card, .hero').length > 0) {
        createPetal();
      }
    }, 1500);

    // Initial burst
    for (var i = 0; i < 8; i++) {
      setTimeout(createPetal, i * 300);
    }
  }

  // ==========================================
  // 🎨 TOAST NOTIFICATIONS
  // ==========================================
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

  // ==========================================
  // 🧊 3D TILT EFFECT — Product cards + stat cards
  // ==========================================
  function initTilt() {
    var cards = document.querySelectorAll('.product-card, .stat-card, .checkout-section');
    cards.forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -6;
        var rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.01, 1.01, 1.01)';
        card.style.setProperty('--glare-x', (x / rect.width * 100) + '%');
        card.style.setProperty('--glare-y', (y / rect.height * 100) + '%');
        card.classList.add('tilting');
      });

      card.addEventListener('mouseleave', function() {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.classList.remove('tilting');
      });
    });
  }

  // ==========================================
  // 🧲 MAGNETIC HOVER
  // ==========================================
  function initMagnetic() {
    var magnets = document.querySelectorAll('.btn-primary, .btn-wa, .cart-fab, .cat-pill');
    magnets.forEach(function(el) {
      el.addEventListener('mousemove', function(e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * 0.25) + 'px, ' + (y * 0.25) + 'px)';
      });
      el.addEventListener('mouseleave', function() {
        el.style.transform = 'translate(0, 0)';
        el.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      });
      el.addEventListener('mouseenter', function() {
        el.style.transition = 'transform 0.1s ease';
      });
    });
  }

  // ==========================================
  // ✨ RIPPLE EFFECT
  // ==========================================
  function initRipple() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn');
      if (!btn) return;
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(function() { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
    });
  }

  // ==========================================
  // ✨ SPARKLE PARTICLES — Background ambient (anime style)
  // ==========================================
  function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var particles = [];
    var count = 35;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.25 + 0.05,
        hue: Math.random() * 80 + 280, // purple-pink range
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        var twinkleOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle));

        // Star shape
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ', 80%, 75%, ' + twinkleOpacity + ')';
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ', 80%, 75%, ' + (twinkleOpacity * 0.15) + ')';
        ctx.fill();
      });

      // Draw connections
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(192, 132, 252, ' + (0.04 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  // ==========================================
  // 🌀 MESH GRADIENT BACKGROUND
  // ==========================================
  function initMeshGradient() {
    var mesh = document.createElement('div');
    mesh.className = 'mesh-gradient-bg';
    mesh.innerHTML = '<div class="mesh-orb mesh-orb-1"></div><div class="mesh-orb mesh-orb-2"></div><div class="mesh-orb mesh-orb-3"></div><div class="mesh-orb mesh-orb-4"></div>';
    var ambient = document.querySelector('.ambient-bg');
    if (ambient) ambient.appendChild(mesh);
  }

  // ==========================================
  // 📜 SCROLL REVEAL
  // ==========================================
  function initScrollReveal() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.product-card, .stat-card, .admin-card, .track-section, .checkout-section').forEach(function(el) {
      el.classList.add('scroll-reveal');
      observer.observe(el);
    });
  }

  // ==========================================
  // 🔢 COUNTER ANIMATION
  // ==========================================
  function initCounters() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.textContent);
        if (isNaN(target) || target === 0) return;
        var current = 0;
        var increment = Math.ceil(target / 30);
        var timer = setInterval(function() {
          current += increment;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current;
        }, 30);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-value, .hero-stat-value').forEach(function(el) {
      var val = el.textContent.trim();
      if (/^\d+$/.test(val)) observer.observe(el);
    });
  }

  // ==========================================
  // 🎪 PARALLAX SCROLL
  // ==========================================
  function initParallax() {
    var hero = document.querySelector('.hero');
    var heroBadge = document.querySelector('.hero-badge');
    var meshOrbs = document.querySelectorAll('.mesh-orb');
    var scrollProgress = document.getElementById('scroll-progress');

    window.addEventListener('scroll', function() {
      var scrollY = window.scrollY;

      if (hero) hero.style.transform = 'translateY(' + (scrollY * 0.15) + 'px)';
      if (heroBadge) heroBadge.style.transform = 'translateY(' + (scrollY * 0.08) + 'px)';

      meshOrbs.forEach(function(orb, i) {
        var speed = (i + 1) * 0.06;
        orb.style.transform = 'translate(' + (scrollY * speed * 0.5) + 'px, ' + (scrollY * speed) + 'px)';
      });

      if (scrollProgress) {
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        var progress = maxScroll > 0 ? scrollY / maxScroll : 0;
        scrollProgress.style.transform = 'scaleX(' + progress + ')';
      }
    }, { passive: true });
  }

  // ==========================================
  // ⭐ GLOW EFFECT ON PRODUCT CARDS
  // ==========================================
  function initGlowEffect() {
    document.addEventListener('mousemove', function(e) {
      var cards = document.querySelectorAll('.product-card');
      cards.forEach(function(card) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          card.style.setProperty('--mouse-x', x + 'px');
          card.style.setProperty('--mouse-y', y + 'px');
        }
      });
    });
  }

  // ==========================================
  // 🎯 SMOOTH ANCHOR SCROLL
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ==========================================
  // 🚀 INIT ALL
  // ==========================================
  function init() {
    initTilt();
    initMagnetic();
    initRipple();
    initParticles();
    initSakuraPetals();
    initMeshGradient();
    initScrollReveal();
    initCounters();
    initParallax();
    initGlowEffect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setTimeout(init, 1000);
  setTimeout(init, 3000);
})();
