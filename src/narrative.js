import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Visual attention is independent of keyboard focus: no element is focused here.
function readingGroup(group, { desktop, finePointer, context }) {
  const items = [...group.querySelectorAll(group.matches('.people-board') ? '.person' : '.solution-card')];
  if (!items.length) return () => {};
  const listeners = [];
  let current = -1;
  let scrollIndex = -1;
  let pointerIndex = -1;
  let keyboardIndex = -1;
  let inside = false;
  let disposed = false;
  const listen = (node, type, handler) => {
    node.addEventListener(type, handler);
    listeners.push(() => node.removeEventListener(type, handler));
  };
  const render = () => {
    if (disposed) return;
    const index = keyboardIndex >= 0 ? keyboardIndex : pointerIndex >= 0 ? pointerIndex : inside ? scrollIndex : -1;
    if (index === current) return;
    current = index;
    if (index >= 0) group.dataset.readingMode = 'on';
    else delete group.dataset.readingMode;
    items.forEach((item, i) => {
      if (i === index) item.dataset.readingActive = 'true';
      else delete item.dataset.readingActive;
    });
    // Only the transform changes; surrounding layout and all text stay readable.
    context.add(() => gsap.to(items, {
      scale: i => desktop && i === index ? 1.014 : 1,
      duration: .48, ease: 'power3.out', overwrite: 'auto',
    }));
  };
  const enter = index => { inside = true; scrollIndex = index; render(); };
  ScrollTrigger.create({
    trigger: group,
    start: 'clamp(top 76%)', end: 'clamp(bottom 30%)',
    id: group.matches('.people-board') ? 'reading-people' : 'reading-solutions',
    onEnter: self => enter(Math.min(items.length - 1, Math.floor(self.progress * items.length))),
    onEnterBack: self => enter(Math.min(items.length - 1, Math.floor(self.progress * items.length))),
    onUpdate: self => {
      inside = self.isActive;
      if (desktop) {
        scrollIndex = Math.min(items.length - 1, Math.floor(self.progress * items.length));
        render();
      }
    },
    onLeave: () => { inside = false; render(); },
    onLeaveBack: () => { inside = false; render(); },
  });
  if (!desktop) {
    items.forEach((item, index) => {
      ScrollTrigger.create({
        trigger: item, start: 'center 58%', end: 'center 42%',
        onEnter: () => enter(index), onEnterBack: () => enter(index),
      });
    });
  }
  items.forEach((item, index) => {
    if (finePointer) {
      listen(item, 'pointerenter', () => { pointerIndex = index; render(); });
      listen(item, 'pointerleave', () => { pointerIndex = -1; render(); });
    }
    listen(item, 'focusin', () => { keyboardIndex = index; render(); });
    listen(item, 'focusout', () => requestAnimationFrame(() => {
      if (disposed || item.contains(document.activeElement)) return;
      keyboardIndex = -1; render();
    }));
  });
  return () => {
    disposed = true;
    listeners.forEach(remove => remove());
    delete group.dataset.readingMode;
    items.forEach(item => delete item.dataset.readingActive);
  };
}

export function setupNarrativeMotion({ desktop, finePointer, context }) {
  const disposers = [];
  const hero = document.querySelector('.hero, .page-hero');
  const heroContent = hero?.querySelector('.hero-content, .page-hero-grid');
  if (hero && heroContent) {
    gsap.to(heroContent, {
      y: desktop ? -30 : -12, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 12%', scrub: .65, invalidateOnRefresh: true, id: 'cyanova-opening-handoff' },
    });
  }

  const sections = [...document.querySelectorAll('.belief,.people,.approach,.possibility,.questions,.invitation,.page-paper,.page-dark,.scene-footer')];
  sections.forEach(section => {
    // A direct anchor visit or browser Back should reveal a settled page immediately.
    const startBelowViewport = section.getBoundingClientRect().top > innerHeight * .86;
    if (startBelowViewport) {
      let heading;
      let papers = [];
      let secondary = [];
      if (section.matches('.belief')) { heading = section.querySelector('.belief-art h2'); papers = [...section.querySelectorAll('.belief-ticket')]; }
      else if (section.matches('.people')) { heading = section.querySelector('.people-heading h2'); papers = [...section.querySelectorAll('.photo')]; secondary = [...section.querySelectorAll('.round-sticker')]; }
      else if (section.matches('.approach')) { heading = section.querySelector('.approach-copy h3'); papers = [...section.querySelectorAll('.notebook')]; secondary = [...section.querySelectorAll('.small-note')]; }
      else if (section.matches('.possibility')) { heading = section.querySelector('.possibility-heading h2'); papers = [...section.querySelectorAll('.possibility-pair article')]; }
      else if (section.matches('.invitation')) { heading = section.querySelector('.invitation-copy h2'); papers = [...section.querySelectorAll('.letter')]; }
      else if (section.matches('.scene-footer')) heading = section.querySelector('.footer-cta h2');
      else { heading = section.querySelector('h2'); papers = [...section.querySelectorAll('.contact-sheet')]; }
      const ink = [...section.querySelectorAll('.circled path')];
      const scene = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: section, start: 'top 86%', once: true },
      });
      scene.addLabel('read', 0);
      if (heading) scene.from(heading, { y: desktop ? 20 : 12, opacity: .84, duration: .72, clearProps: 'transform,opacity' }, 'read');
      ink.forEach(path => {
        const length = path.getTotalLength();
        scene.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .9, ease: 'power2.out' }, 'read+=0.12');
      });
      if (papers.length) scene.from(papers, { y: desktop ? 28 : 17, duration: .85, stagger: .09, clearProps: 'transform' }, 'read+=0.14');
      if (secondary.length) scene.from(secondary, { y: 15, duration: .65, clearProps: 'transform' }, 'read+=0.35');
    }
    const group = section.querySelector('.people-board,.solution-grid');
    if (group) disposers.push(readingGroup(group, { desktop, finePointer, context }));
  });
  return () => disposers.forEach(dispose => dispose());
}
