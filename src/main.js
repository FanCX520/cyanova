import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prepareRollingText, setupSiteInteractions, setupCopyControls } from './experience.js';
import { setupNarrativeMotion } from './narrative.js';
import { setupPinnedLaunchStories, captureActiveLaunchStory, restoreStaticLaunchStory, updateLaunchStoryAvailability } from './launch-story.js';
import './style.css';
import './footer.css';
import './narrative.css';
import './launch-story.css';
import './story-availability.css';
import './launch-material.css';

gsap.registerPlugin(ScrollTrigger);
prepareRollingText();
const disposeCopyControls = setupCopyControls();
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const storyRoom = window.matchMedia('(min-height: 480px)');
const hero = document.querySelector('.hero');
const opportunityWord = document.querySelector('.opportunity-word');
const opportunityWords = ['OPPORTUNITY.', 'POSSIBILITY.', 'OPENING.', 'PROSPECT.', 'CHANCE.'];
const motionControls = [...document.querySelectorAll('.motion-toggle, [data-motion-control]')];
const listeners = [];
let userPaused = false;
let storyManualEnabled = false;
let storyDisabled = false;
let paused = reduceQuery.matches;
let motionMedia;
let motionRefreshFrame = 0;
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
  cancelAnimationFrame(motionRefreshFrame);
  motionRefreshFrame = 0;
  const storyAnchor = captureActiveLaunchStory();
  const activeStoryControl = document.activeElement?.closest('.launch-story') ? document.activeElement : null;
  const restoreStoryFocus = () => {
    if (activeStoryControl?.isConnected && !activeStoryControl.hidden && !activeStoryControl.disabled && activeStoryControl.getClientRects().length) activeStoryControl.focus({ preventScroll: true });
  };
  motionMedia?.revert();
  motionMedia = undefined;
  updateMotionControls();
  if (paused && !storyManualEnabled) {
    updateLaunchStoryAvailability({ room: storyRoom.matches, paused, reduced: reduceQuery.matches });
    restoreStaticLaunchStory(storyAnchor); restoreStoryFocus(); return;
  }
  motionMedia = gsap.matchMedia();
  motionMedia.add({
    allowed: '(prefers-reduced-motion: no-preference)',
    always: '(min-width: 0px)',
    finePointer: '(hover: hover) and (pointer: fine)',
    desktop: '(min-width: 761px)',
    storyRoom: '(min-height: 480px)',
  }, context => {
    if (!context.conditions.allowed && !storyManualEnabled) return;
    const cleanups = [];
    if (!storyDisabled && (!paused || storyManualEnabled)) cleanups.push(setupPinnedLaunchStories({ room: context.conditions.storyRoom, desktop: context.conditions.desktop }));
    if (paused) return () => cleanups.forEach(dispose => dispose());
    if (playIntro && !introConsumed && scrollY < 100 && !location.hash && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') {
      introConsumed = true;
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const lines = document.querySelectorAll('.hero h1 > span');
      intro.addLabel('lead', 0);
      if (lines.length) {
        intro.from(lines, { y: 24, opacity: .7, duration: .72, stagger: .08, clearProps: 'transform,opacity' }, 'lead')
          .from('.hero-bottom', { y: 8, opacity: .92, duration: .55, clearProps: 'transform,opacity' }, 'lead+=0.26')
          .from('.hero-note .hand', { y: 5, opacity: .72, duration: .55, clearProps: 'transform,opacity' }, 'lead+=0.46');
        const noteInk = document.querySelector('.hero-note svg path');
        if (noteInk) {
          const length = noteInk.getTotalLength();
          intro.fromTo(noteInk, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .65, ease: 'power2.out' }, 'lead+=0.46');
        }
      } else {
        const title = document.querySelector('.page-hero h1');
        const note = document.querySelector('.page-note');
        const description = document.querySelector('.page-lede');
        if (title) intro.from(title, { y: 18, opacity: .8, duration: .72, clearProps: 'transform,opacity' }, 'lead');
        if (description) intro.from(description, { y: 6, duration: .6, clearProps: 'transform' }, 'lead+=0.2');
        if (note) intro.from(note, { y: 16, rotation: 2, duration: .75, clearProps: 'transform' }, 'lead+=0.3');
      }
    }
    cleanups.push(setupOpportunityCycle());

    // One scene-level sequence hands attention from headline to paper, not paragraph by paragraph.
    cleanups.push(setupNarrativeMotion({ desktop: context.conditions.desktop, finePointer: context.conditions.finePointer, context }));
    cleanups.push(setupSiteInteractions({ finePointer: context.conditions.finePointer }));
    return () => cleanups.forEach(dispose => dispose());
  }, document.body);
  motionRefreshFrame = requestAnimationFrame(() => { motionRefreshFrame = 0; ScrollTrigger.refresh(); });
  updateLaunchStoryAvailability({ room: storyRoom.matches, paused, reduced: reduceQuery.matches });
  restoreStaticLaunchStory(storyAnchor);
  restoreStoryFocus();
}

listen(storyRoom, 'change', () => rebuildMotion());
listen(reduceQuery, 'change', () => { storyManualEnabled = false; rebuildMotion(); });
rebuildMotion({ playIntro: true });
motionControls.forEach(button => listen(button, 'click', () => {
  if (reduceQuery.matches) return;
  storyManualEnabled = false; storyDisabled = false;
  userPaused = !paused;
  try { localStorage.setItem('cyanova-motion', userPaused ? 'paused' : 'playing'); } catch {}
  rebuildMotion();
}));
document.querySelectorAll('[data-story-mode-control]').forEach(button => listen(button, 'click', () => {
  if (!storyRoom.matches) return;
  const section = button.closest('.launch-story');
  const start = !section.classList.contains('is-launch-enhanced');
  storyDisabled = !start; storyManualEnabled = start;
  rebuildMotion();
  if (start && section.classList.contains('is-launch-enhanced')) {
    cancelAnimationFrame(motionRefreshFrame); motionRefreshFrame = 0;
    ScrollTrigger.refresh();
    const persistentControl = section.querySelector('.launch-utilities [data-story-mode-control]');
    persistentControl?.focus({ preventScroll: true });
    scrollTo({ top: section.getBoundingClientRect().top + scrollY + 2, behavior: 'instant' });
  }
}));

document.querySelectorAll('a[href="#launch-story"]').forEach(link => listen(link, 'click', event => {
  if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const section = document.querySelector('.launch-story');
  if (!section) return;
  event.preventDefault();
  if (location.hash !== '#launch-story') history.pushState(history.state, '', '#launch-story');
  section.focus({ preventScroll: true });
  scrollTo({ top: section.getBoundingClientRect().top + scrollY + 2, behavior: 'instant' });
}));

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
  cancelAnimationFrame(motionRefreshFrame);
  motionMedia?.revert(); disposeCopyControls(); listeners.forEach(remove => remove());
});
