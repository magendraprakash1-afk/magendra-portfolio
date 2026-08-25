/* ═══════════════════════════════════════════════════════════════
   INTERACTIVE PARTICLE BACKGROUND
   Canvas-based particles with connections, glowing blobs,
   and mouse-following effects
   ═══════════════════════════════════════════════════════════════ */

(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let blobs = [];
  let mouse = { x: -1000, y: -1000 };
  let animId;
  let settings = {
    particleCount: 80,
    connectionDistance: 150,
    particleSpeed: 0.4,
    blobCount: 3
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      particleColor: isDark ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 201, 106, 0.3)',
      lineColor: isDark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 158, 212, 0.06)',
      blobColors: isDark 
        ? ['rgba(0, 255, 136, 0.04)', 'rgba(0, 212, 255, 0.04)', 'rgba(100, 100, 255, 0.03)']
        : ['rgba(0, 201, 106, 0.06)', 'rgba(0, 158, 212, 0.06)', 'rgba(100, 100, 255, 0.04)']
    };
  }

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * settings.particleSpeed;
      this.vy = (Math.random() - 0.5) * settings.particleSpeed;
      this.size = Math.random() * 2 + 0.5;
      this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.02;
        this.vx += dx * force;
        this.vy += dy * force;
      }

      // Limit speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > settings.particleSpeed * 3) {
        this.vx *= 0.98;
        this.vy *= 0.98;
      }
    }

    draw(colors) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = colors.particleColor;
      ctx.fill();
    }
  }

  class Blob {
    constructor(color) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.radius = Math.random() * 200 + 100;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.color = color;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -this.radius || this.x > width + this.radius) this.vx *= -1;
      if (this.y < -this.radius || this.y > height + this.radius) this.vy *= -1;
    }

    draw() {
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = [];
    blobs = [];
    const colors = getThemeColors();
    
    for (let i = 0; i < settings.particleCount; i++) {
      particles.push(new Particle());
    }
    
    for (let i = 0; i < settings.blobCount; i++) {
      blobs.push(new Blob(colors.blobColors[i % colors.blobColors.length]));
    }
  }

  function drawConnections(colors) {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < settings.connectionDistance) {
          const opacity = 1 - dist / settings.connectionDistance;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = colors.lineColor.replace(/[\d.]+\)$/, (opacity * 0.15) + ')');
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const colors = getThemeColors();

    // Draw blobs
    blobs.forEach(blob => {
      blob.update();
      blob.draw();
    });

    // Update & draw particles
    particles.forEach(p => {
      p.update();
      p.draw(colors);
    });

    // Draw connections
    drawConnections(colors);

    // Mouse glow on canvas
    if (mouse.x > 0 && mouse.y > 0) {
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
      gradient.addColorStop(0, 'rgba(0, 255, 136, 0.03)');
      gradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    animId = requestAnimationFrame(animate);
  }

  // Event listeners
  window.addEventListener('resize', () => {
    resize();
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Also move the mouse glow div
    const glow = document.getElementById('mouseGlow');
    if (glow) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }
  });

  document.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Listen for settings changes
  window.addEventListener('settings-updated', (e) => {
    const s = e.detail;
    if (s.particleDensity) settings.particleCount = s.particleDensity;
    init();
  });

  // Start
  init();
  animate();
})();
