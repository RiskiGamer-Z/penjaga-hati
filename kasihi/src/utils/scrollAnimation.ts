/**
 * Scroll Animation Utility
 * Handles Intersection Observer for scroll reveal animations
 */

export const initScrollAnimations = () => {
  if (typeof window === 'undefined') return;

  // Define animation classes
  const animationMap: { [key: string]: string } = {
    'scroll-fade': 'animate-fadeIn',
    'scroll-slide-up': 'animate-slideInUp',
    'scroll-scale': 'animate-scaleIn',
    'scroll-rotate': 'animate-rotateIn',
  };

  // Get all elements with scroll animation data attributes
  const elements = document.querySelectorAll('[data-scroll-animation]');

  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const animationType = element.getAttribute('data-scroll-animation') || 'scroll-fade';
          const animationClass = animationMap[animationType] || 'animate-fadeIn';
          const delay = element.getAttribute('data-animation-delay') || '0';

          // Add delay if specified
          if (delay !== '0') {
            element.style.animationDelay = `${delay}ms`;
          }

          // Trigger animation
          element.classList.add(animationClass);

          // Unobserve after animation completes
          observer.unobserve(element);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));

  return observer;
};

/**
 * Stagger animations for multiple elements
 * Used for animating list items, cards, etc. in sequence
 */
export const initStaggeredAnimations = () => {
  if (typeof window === 'undefined') return;

  const animationMap: { [key: string]: string } = {
    'scroll-fade': 'animate-fadeIn',
    'scroll-slide-up': 'animate-slideInUp',
    'scroll-scale': 'animate-scaleIn',
    'scroll-rotate': 'animate-rotateIn',
  };

  const containers = document.querySelectorAll('[data-stagger-animation]');

  if (containers.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const container = entry.target as HTMLElement;
          const animationType = container.getAttribute('data-stagger-animation') || 'scroll-fade';
          const staggerDelay = parseInt(container.getAttribute('data-stagger-delay') || '100');
          const animationClass = animationMap[animationType] || 'animate-fadeIn';

          // Get all child elements to animate
          const children = container.querySelectorAll('[data-stagger-item]');

          children.forEach((child, index) => {
            const childElement = child as HTMLElement;
            const delay = index * staggerDelay;

            // Schedule animation
            setTimeout(() => {
              childElement.style.animationDelay = '0ms';
              childElement.classList.add(animationClass);
            }, delay);
          });

          observer.unobserve(container);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  containers.forEach((el) => observer.observe(el));

  return observer;
};

/**
 * Parallax effect on scroll
 * Elements with data-parallax attribute will move at different speeds
 */
export const initParallaxEffect = () => {
  if (typeof window === 'undefined') return;

  const elements = document.querySelectorAll('[data-parallax]');

  if (elements.length === 0) return;

  const handleScroll = () => {
    elements.forEach((element) => {
      const el = element as HTMLElement;
      const speed = parseFloat(el.getAttribute('data-parallax') || '0.5');
      const rect = el.getBoundingClientRect();
      const distance = window.innerHeight - rect.top;
      const yOffset = distance * speed;

      el.style.transform = `translateY(${yOffset}px)`;
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

/**
 * Initialize all scroll animations
 */
export const initAllScrollAnimations = () => {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initScrollAnimations();
      initStaggeredAnimations();
      initParallaxEffect();
    });
  } else {
    initScrollAnimations();
    initStaggeredAnimations();
    initParallaxEffect();
  }
};
