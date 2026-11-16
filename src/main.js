import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prepareRollingText, setupSiteInteractions, setupCopyControls } from './experience.js';
import './style.css';
import './footer.css';

gsap.registerPlugin(ScrollTrigger);
prepareRollingText();
const disposeCopyControls = setupCopyControls();
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const opportunityWord = document.querySelector('.opportunity-word');
const opportunityWords = ['OPPORTUNITY.', 'POSSIBILITY.', 'OPENING.', 'PROSPECT.', 'CHANCE.'];
const motionControls = [...document.querySelectorAll('.motion-toggle, [data-motion-control]')];
const listeners = [];
let userPaused = false;
let paused = reduceQuery.matches;
let motionMedia;
let introConsumed = false;
let wordIndex = 0;
try { userPaused = localStorage.getItem('cyanova-motion') === 'paused'; } catch {}

function listen(node, type, handler, options) {
  node?.addEventListener(type, handler, options);
  listeners.push(() => node?.removeEventListener(type, handler, options));
}

function updateMotionControls() {
  paused = reduceQuery.matches || userPaused;
  document.documentElement.classList.toggle('motion-paused', paused);
  motionControls.forEach(button => {
    button.hidden = false;
    button.disabled = reduceQuery.matches;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', 'Reduce motion');
    const label = button.querySelector('[data-motion-label]');
    if (label) label.textContent = paused ? 'Motion off' : 'Motion on';
    else button.innerHTML = paused ? 'Play motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    button.title = reduceQuery.matches ? 'Reduced motion follows your device preference.' : 'Control animation across the site.';
  });
}

function setupOpportunityCycle() {
  if (!hero || !opportunityWord) return () => {};
  let visible = hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < innerHeight;
  const cycle = gsap.timeline({ paused: true, repeat: -1 });
  cycle.addLabel('hold', 0)
    .to(opportunityWord, { yPercent: -24, autoAlpha: 0, duration: .2, ease: 'power2.in' }, 2.5)
    .call(() => {
      wordIndex = (wordIndex + 1) % opportunityWords.length;
      opportunityWord.textContent = opportunityWords[wordIndex];
    })
    .set(opportunityWord, { yPercent: 27 })
    .to(opportunityWord, { yPercent: 0, autoAlpha: 1, duration: .34, ease: 'power3.out' });
  const update = () => { if (visible && !document.hidden && !paused) cycle.play(); else cycle.pause(); };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .04 });
  observer.observe(hero);
  document.addEventListener('visibilitychange', update);
  const hide = () => cycle.pause();
  window.addEventListener('pagehide', hide);
  update();
  return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); window.removeEventListener('pagehide', hide); cycle.kill(); };
}

function rebuildMotion({ playIntro = false } = {}) {
  motionMedia?.revert();
  motionMedia = undefined;
  updateMotionControls();
  if (paused) return;
  motionMedia = gsap.matchMedia();
  motionMedia.add({
    allowed: '(prefers-reduced-motion: no-preference)',
    finePointer: '(hover: hover) and (pointer: fine)',
    desktop: '(min-width: 761px)',
  }, context => {
    if (!context.conditions.allowed || paused) return;
    const cleanups = [];
    if (playIntro && !introConsumed && scrollY < 100 && !location.hash && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') {
      introConsumed = true;
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const lines = document.querySelectorAll('.hero h1 > span');
      if (lines.length) {
        intro.from(lines, { y: 16, duration: .62, stagger: .06, clearProps: 'transform' }, 0)
          .from('.hero-note', { y: 18, rotation: 1, duration: .78, clearProps: 'transform' }, .1);
      } else {
        const title = document.querySelector('.page-hero h1');
        const note = document.querySelector('.page-note');
        if (title) intro.from(title, { y: 12, duration: .6, clearProps: 'transform' }, 0);
        if (note) intro.from(note, { y: 15, rotation: 1, duration: .75, clearProps: 'transform' }, .1);
      }
    }
    cleanups.push(setupOpportunityCycle());

    // Preserve the site's tactile paper choreography without hiding readable copy.
    const paperObjects = [...document.querySelectorAll('.belief-ticket,.photo,.notebook,.small-note,.letter,.round-sticker')];
    paperObjects.forEach(object => {
      if (object.getBoundingClientRect().top <= innerHeight * .95) return;
      gsap.from(object, {
        y: 25, duration: .75, ease: 'power3.out', clearProps: 'transform',
        scrollTrigger: { trigger: object, start: 'top 96%', once: true },
      });
    });
    const circle = document.querySelector('.circled path');
    if (circle && circle.getBoundingClientRect().top > innerHeight) {
      const length = circle.getTotalLength();
      gsap.fromTo(circle, { strokeDasharray: length, strokeDashoffset: length }, {
        strokeDashoffset: 0, duration: .85, ease: 'power2.out',
        scrollTrigger: { trigger: circle.closest('.circled'), start: 'top 90%', once: true },
      });
    }
    cleanups.push(setupSiteInteractions({ finePointer: context.conditions.finePointer }));
    return () => cleanups.forEach(dispose => dispose());
  }, document.body);
}

rebuildMotion({ playIntro: true });
motionControls.forEach(button => listen(button, 'click', () => {
  if (reduceQuery.matches) return;
  userPaused = !paused;
  try { localStorage.setItem('cyanova-motion', userPaused ? 'paused' : 'playing'); } catch {}
  rebuildMotion();
}));
listen(reduceQuery, 'change', () => rebuildMotion());

const menu = document.querySelector('#navigation');
const menuButton = document.querySelector('.menu-toggle');
const closeMenu = () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  menu?.classList.remove('is-open');
};
listen(menuButton, 'click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menu?.classList.toggle('is-open', open);
});
menu?.querySelectorAll('a').forEach(link => listen(link, 'click', closeMenu));
listen(document, 'keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
});
listen(document, 'click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
const desktop = window.matchMedia('(min-width: 761px)');
listen(desktop, 'change', () => { if (desktop.matches) closeMenu(); });

const route = value => value.replace(/\.html$/, '').replace(/\/$/, '') || '/';
document.querySelectorAll('.site-header nav a,.footer-navigation nav a').forEach(link => {
  const destination = new URL(link.href);
  if (!destination.hash && destination.origin === location.origin && route(destination.pathname) === route(location.pathname)) link.setAttribute('aria-current', 'page');
});

document.querySelectorAll('details').forEach(detail => listen(detail, 'toggle', () => ScrollTrigger.refresh()));
const form = document.querySelector('#invite-form');
const status = document.querySelector('#form-status');
listen(form, 'submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  status.textContent = 'Your introduction is ready to preview. Nothing has been sent or saved; invitation submissions are not connected yet.';
});
document.fonts.ready.then(() => ScrollTrigger.refresh());
listen(window, 'pageshow', event => {
  if (event.persisted) {
    try { userPaused = localStorage.getItem('cyanova-motion') === 'paused'; } catch {}
    rebuildMotion();
    ScrollTrigger.refresh();
  }
});
if (import.meta.hot) import.meta.hot.dispose(() => {
  motionMedia?.revert(); disposeCopyControls(); listeners.forEach(remove => remove());
});
