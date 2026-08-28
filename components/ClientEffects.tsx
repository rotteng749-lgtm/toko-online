'use client';

import { useEffect } from 'react';

export default function ClientEffects() {
  useEffect(() => {
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
      var me = e as MouseEvent;
      mouseX = me.clientX;
      mouseY = me.clientY;
      if (Math.random() > 0.85) {
        createSparkle(me.clientX, me.clientY);
      }
    });

    function createSparkle(x: number, y: number) {
      var sparkle = document.createElement('div');
      var size = Math.random() * 6 + 2;
      var colors = ['#ffb7d5', '#c084fc', '#e879f9', '#818cf8', '#f472b6'];
      sparkle.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border-radius:50%;transform:translate(-50%,-50%);transition:all 0.8s ease-out;';
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';
      sparkle.style.width = size + 'px';
      sparkle.style.height = size + 'px';
      var color = colors[Math.floor(Math.random() * colors.length)];
      sparkle.style.background = color;
      sparkle.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + color;
      document.body.appendChild(sparkle);
      requestAnimationFrame(function() {
        sparkle.style.transform = 'translate(-50%,-50%) scale(0)';
        sparkle.style.opacity = '0';
      });
      setTimeout(function() { if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle); }, 800);
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

    var interactive = 'a, button, input, textarea, select, .product-card, .cat-pill, .cart-fab, .admin-nav-item, .btn, [onclick]';
    document.addEventListener('mouseover', function(e) {
      var t = e.target as HTMLElement;
      if (t && t.closest(interactive)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', function(e) {
      var t = e.target as HTMLElement;
      if (t && t.closest(interactive)) document.body.classList.remove('cursor-hover');
    });
    document.addEventListener('mousedown', function() { document.body.classList.add('cursor-click'); });
    document.addEventListener('mouseup', function() { document.body.classList.remove('cursor-click'); });

    // ==========================================
    // 🌸 SAKURA PETALS
    // ==========================================
    var petalContainer = document.createElement('div');
    petalContainer.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;';
    document.body.appendChild(petalContainer);

    var petalStyle = document.createElement('style');
    petalStyle.textContent = '@keyframes petalFall { 0% { transform: translateX(0) translateY(0) rotate(0deg); opacity:0.12; } 50% { transform: translateX(var(--drift)) translateY(50vh) rotate(180deg); opacity:0.08; } 100% { transform: translateX(calc(var(--drift)*1.2)) translateY(105vh) rotate(360deg); opacity:0; } }';
    document.head.appendChild(petalStyle);

    function createPetal() {
      var petal = document.createElement('div');
      var size = Math.random() * 12 + 6;
      var startX = Math.random() * window.innerWidth;
      var duration = Math.random() * 8 + 8;
      var delay = Math.random() * 3;
      var drift = (Math.random() - 0.5) * 200;
      petal.style.cssText = 'position:absolute;top:-20px;border-radius:50% 0 50% 0;pointer-events:none;background:linear-gradient(135deg,#ffb7d5,#ffc8dd);box-shadow:0 0 4px rgba(255,183,213,0.3);';
      petal.style.left = startX + 'px';
      petal.style.width = size + 'px';
      petal.style.height = size + 'px';
      petal.style.animation = 'petalFall ' + duration + 's linear ' + delay + 's forwards';
      petal.style.setProperty('--drift', drift + 'px');
      petalContainer.appendChild(petal);
      setTimeout(function() { if (petal.parentNode) petal.parentNode.removeChild(petal); }, (duration + delay) * 1000);
    }

    setInterval(function() { createPetal(); }, 1800);
    for (var i = 0; i < 6; i++) { setTimeout(createPetal, i * 400); }

    // ==========================================
    // 🎨 TOAST
    // ==========================================
    (window as any).showToast = function(msg: string, type?: string) {
      type = type || 'success';
      var el = document.getElementById('toast-container');
      if (!el) { el = document.createElement('div'); el.id = 'toast-container'; el.className = 'toast-container'; document.body.appendChild(el); }
      var t = document.createElement('div');
      t.className = 'toast toast-' + type;
      t.textContent = msg;
      el.appendChild(t);
      setTimeout(function() { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = 'all 0.3s ease'; setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, 3500);
    };

    // ==========================================
    // 🧊 3D TILT
    // ==========================================
    function initTilt() {
      document.querySelectorAll('.product-card, .stat-card, .checkout-section').forEach(function(card) {
        card.addEventListener('mousemove', function(e: Event) {
          var me = e as MouseEvent;
          var rect = card.getBoundingClientRect();
          var x = me.clientX - rect.left;
          var y = me.clientY - rect.top;
          var rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
          var rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
          (card as HTMLElement).style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.01,1.01,1.01)';
        });
        card.addEventListener('mouseleave', function() {
          (card as HTMLElement).style.transform = '';
        });
      });
    }

    // ==========================================
    // ✨ SCROLL REVEAL
    // ==========================================
    function initScrollReveal() {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.product-card, .stat-card, .admin-card, .track-section, .checkout-section').forEach(function(el) {
        el.classList.add('scroll-reveal');
        observer.observe(el);
      });
    }

    // ==========================================
    // 🎪 PARALLAX + SCROLL PROGRESS
    // ==========================================
    function initParallax() {
      var scrollProgress = document.getElementById('scroll-progress');
      window.addEventListener('scroll', function() {
        var scrollY = window.scrollY;
        if (scrollProgress) {
          var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          scrollProgress.style.transform = 'scaleX(' + (maxScroll > 0 ? scrollY / maxScroll : 0) + ')';
        }
      }, { passive: true });
    }

    // ==========================================
    // ✨ RIPPLE
    // ==========================================
    document.addEventListener('click', function(e: Event) {
      var t = e.target as HTMLElement;
      var btn = t && t.closest('.btn') as HTMLElement;
      if (!btn) return;
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var me = e as MouseEvent;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (me.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (me.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(function() { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
    });

    // ==========================================
    // 🌀 MESH GRADIENT
    // ==========================================
    var mesh = document.createElement('div');
    mesh.className = 'mesh-gradient-bg';
    mesh.innerHTML = '<div class="mesh-orb mesh-orb-1"></div><div class="mesh-orb mesh-orb-2"></div><div class="mesh-orb mesh-orb-3"></div><div class="mesh-orb mesh-orb-4"></div>';
    var ambient = document.querySelector('.ambient-bg');
    if (ambient) ambient.appendChild(mesh);

    // ==========================================
    // 🚀 INIT
    // ==========================================
    function init() { initTilt(); initScrollReveal(); initParallax(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    setTimeout(init, 1000);
    setTimeout(init, 3000);
  }, []);

  return null;
}
