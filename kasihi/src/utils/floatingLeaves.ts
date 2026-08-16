export function initFloatingLeaves(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const leaves = ['🍃', '🌿', '🍂', '🌱'];
  
  const interval = setInterval(() => {
    const leaf = document.createElement('div');
    const leafChar = leaves[Math.floor(Math.random() * leaves.length)];
    const startX = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = 8 + Math.random() * 4;
    
    leaf.textContent = leafChar;
    leaf.style.position = 'absolute';
    leaf.style.left = startX + '%';
    leaf.style.top = '-20px';
    leaf.style.fontSize = '24px';
    leaf.style.opacity = '0';
    leaf.style.pointerEvents = 'none';
    leaf.style.animation = `floatLeaf ${duration}s linear ${delay}s forwards`;
    
    container.appendChild(leaf);
    
    setTimeout(() => {
      leaf.remove();
    }, (duration + delay) * 1000);
  }, 500);

  return () => clearInterval(interval);
}

export function initParticles(containerId: string, particleCount = 5) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function createParticle() {
    const particle = document.createElement('div');
    const startX = Math.random() * 100;
    const size = 4 + Math.random() * 8;
    const delay = Math.random() * 0.5;
    const duration = 3 + Math.random() * 2;
    
    particle.style.position = 'absolute';
    particle.style.left = startX + '%';
    particle.style.bottom = '0';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = 'rgba(88, 80, 236, 0.25)';
    particle.style.pointerEvents = 'none';
    particle.style.animation = `particleRise ${duration}s ease-out ${delay}s forwards`;
    
    if (container) {
      container.appendChild(particle);
    }
    
    setTimeout(() => {
      particle.remove();
    }, (duration + delay) * 1000);
  }

  const interval = setInterval(() => {
    for (let i = 0; i < particleCount; i++) {
      setTimeout(createParticle, i * 100);
    }
  }, 1000);

  return () => clearInterval(interval);
}

export function animateCounter(
  element: HTMLElement,
  target: number,
  duration: number = 2000,
  format?: (value: number) => string
) {
  const start = 0;
  const startTime = Date.now();

  const animate = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = Math.floor(start + (target - start) * progress);
    element.textContent = format ? format(current) : current.toString();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

export function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.hasAttribute('data-counter-animated')) {
        const target = entry.target as HTMLElement;
        const targetValue = parseInt(target.getAttribute('data-counter') || '0');
        const format = target.getAttribute('data-counter-format');
        
        animateCounter(
          target,
          targetValue,
          1500,
          format ? (val) => {
            if (format === 'plus') return val + '+';
            if (format === 'dot') return val.toLocaleString('id-ID');
            return val.toString();
          } : undefined
        );
        
        target.setAttribute('data-counter-animated', 'true');
      }
    });
  }, { threshold: 0.1 });

  counters.forEach((counter) => observer.observe(counter));
}
