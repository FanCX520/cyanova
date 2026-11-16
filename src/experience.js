import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function prepareRollingText() {
  document.querySelectorAll('.site-header nav a, a.button, .underlined-link').forEach(link => {
    if (link.querySelector('[data-roll]')) return;
    const textNode = [...link.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) return;
    const label = document.createElement('span');
    label.dataset.roll = '';
    label.textContent = textNode.textContent.trim();
    textNode.replaceWith(label);
  });
  document.querySelectorAll('[data-roll]').forEach(label => {
    if (label.dataset.rollReady) return;
    const text = label.textContent;
    const control = label.closest('a,button');
    if (control && !control.hasAttribute('aria-label')) control.setAttribute('aria-label', text.trim());
    label.classList.add('roll-window');
    label.replaceChildren();
    for (const hidden of [false, true]) {
      const row = document.createElement('span');
      row.className = 'roll-row';
      if (hidden) row.setAttribute('aria-hidden', 'true');
      for (const char of [...text]) {
        const letter = document.createElement('span');
        letter.className = 'roll-char';
        letter.textContent = char === ' ' ? '\u00a0' : char;
        row.append(letter);
      }
      label.append(row);
    }
    label.dataset.rollReady = 'true';
  });
}

// Called inside one gsap.matchMedia context, which owns every animation below.
export function setupSiteInteractions({ finePointer }) {
  const cleanups = [];
  let disposed = false;
  const listen = (node, type, handler, options) => {
    node.addEventListener(type, handler, options);
    cleanups.push(() => node.removeEventListener(type, handler, options));
  };
  document.querySelectorAll('[data-roll-ready]').forEach(label => {
    const control = label.closest('a,button');
    if (!control) return;
    const rows = label.querySelectorAll('.roll-row');
    const first = rows[0].querySelectorAll('.roll-char');
    const second = rows[1].querySelectorAll('.roll-char');
    const stagger = Math.min(.014, .15 / Math.max(1, first.length));
    gsap.set(first, { y: 0, yPercent: 0 });
    gsap.set(second, { y: 0, yPercent: 112 });
    const roll = gsap.timeline({ paused: true, defaults: { duration: .28, ease: 'power3.inOut' } })
      .to(first, { yPercent: -112, stagger }, 0)
      .fromTo(second, { yPercent: 112 }, { yPercent: 0, stagger, immediateRender: false }, .025);
    let inside = false;
    const enter = () => roll.play();
    const settle = () => { if (!disposed && !inside && !control.contains(document.activeElement)) roll.reverse(); };
    if (finePointer) {
      listen(control, 'pointerenter', () => { inside = true; enter(); });
      listen(control, 'pointerleave', () => { inside = false; settle(); });
    }
    listen(control, 'focusin', enter);
    listen(control, 'focusout', () => requestAnimationFrame(settle));
  });

  const footer = document.querySelector('.scene-footer');
  if (footer) {
    const landscape = footer.querySelector('.footer-landscape');
    const left = footer.querySelector('.footer-piece-left');
    const right = footer.querySelector('.footer-piece-right');
    const letters = footer.querySelectorAll('.footer-letter');
    gsap.timeline({
      defaults: { duration: 1, ease: 'none' },
      scrollTrigger: {
        trigger: footer, start: 'clamp(top bottom)', end: 'clamp(bottom bottom)',
        scrub: .55, invalidateOnRefresh: true, id: 'cyanova-footer-scene',
      },
    })
      .fromTo(landscape, { yPercent: 7 }, { yPercent: 0 }, 0)
      .fromTo(left, { y: 30, rotation: -3 }, { y: 0, rotation: 0 }, 0)
      .fromTo(right, { y: 44, rotation: 3 }, { y: 0, rotation: 0 }, 0)
      .fromTo(letters, { yPercent: 13 }, { yPercent: 0, stagger: { amount: .12 } }, .08);

    if (finePointer) {
      // Input-responsive decoration only. No custom cursor and no perpetual loop.
      const leftImage = left.querySelector('img');
      const rightImage = right.querySelector('img');
      const lx = gsap.quickTo(leftImage, 'x', { duration: .65, ease: 'power3.out' });
      const ly = gsap.quickTo(leftImage, 'y', { duration: .65, ease: 'power3.out' });
      const rx = gsap.quickTo(rightImage, 'x', { duration: .8, ease: 'power3.out' });
      const ry = gsap.quickTo(rightImage, 'y', { duration: .8, ease: 'power3.out' });
      listen(footer, 'pointermove', event => {
        if (document.hidden || event.pointerType === 'touch') return;
        const x = Math.max(-.5, Math.min(.5, event.clientX / innerWidth - .5));
        const y = Math.max(-.5, Math.min(.5, event.clientY / innerHeight - .5));
        lx(x * 15); ly(y * 10); rx(-x * 13); ry(-y * 12);
      }, { passive: true });
      listen(footer, 'pointerleave', () => { lx(0); ly(0); rx(0); ry(0); });
    }
  }

  // Keep the existing paper cards; let them answer the pointer, not float forever.
  if (finePointer) {
    const cards = [...document.querySelectorAll('.solution-card')];
    const rotations = cards.map(card => Number(gsap.getProperty(card, 'rotation')) || 0);
    cards.forEach((card, index) => {
      const response = gsap.timeline({ paused: true }).to(card, {
        y: -5, rotation: rotations[index] * .6, duration: .24, ease: 'power2.out',
      });
      listen(card, 'pointerenter', () => response.play());
      listen(card, 'pointerleave', () => response.reverse());
    });
  }
  return () => { disposed = true; cleanups.forEach(cleanup => cleanup()); };
}

export function setupCopyControls() {
  const controls = [...document.querySelectorAll('[data-copy-value]')];
  const status = document.querySelector('[data-copy-feedback]');
  const timers = new Map();
  const busy = new WeakSet();
  const originalLabels = new Map();
  let generation = 0;
  const listeners = [];
  controls.forEach(button => {
    button.hidden = false;
    const label = button.querySelector('[data-copy-label]');
    originalLabels.set(button, label?.textContent || 'Copy');
    const handler = async () => {
      if (busy.has(button)) return;
      busy.add(button); button.setAttribute('aria-busy', 'true');
      clearTimeout(timers.get(button));
      const version = generation;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(button.dataset.copyValue);
        if (version !== generation) return;
        if (label) label.textContent = 'Copied';
        if (status) status.textContent = `${button.dataset.copyValue} copied. See you there.`;
      } catch {
        if (version !== generation) return;
        if (status) status.textContent = `Copy this instead: ${button.dataset.copyValue}`;
      } finally {
        busy.delete(button); button.removeAttribute('aria-busy');
        if (version === generation) timers.set(button, setTimeout(() => {
          if (label) label.textContent = originalLabels.get(button);
        }, 2200));
      }
    };
    button.addEventListener('click', handler); listeners.push(() => button.removeEventListener('click', handler));
  });
  document.querySelectorAll('[data-copy-fallback]').forEach(element => { element.hidden = true; });
  const reset = () => {
    generation++;
    timers.forEach(timer => clearTimeout(timer)); timers.clear();
    controls.forEach(button => {
      button.removeAttribute('aria-busy');
      const label = button.querySelector('[data-copy-label]');
      if (label) label.textContent = originalLabels.get(button);
    });
  };
  window.addEventListener('pagehide', reset);
  return () => { reset(); listeners.forEach(remove => remove()); window.removeEventListener('pagehide', reset); };
}
