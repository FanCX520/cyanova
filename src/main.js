import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createEclipse } from './eclipse.js';
import './style.css';

gsap.registerPlugin(ScrollTrigger);
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion;
try { savedMotion = localStorage.getItem('cyanova-motion'); } catch { /* Storage may be unavailable in private browsing. */ }
const startsPaused = reduceQuery.matches || savedMotion === 'paused';
const state = { reduced: startsPaused, paused: startsPaused, reveal: startsPaused ? 1 : .15, scroll: 0 };
const hero = document.querySelector('.hero');
const disposeEclipse = createEclipse(document.querySelector('.eclipse-canvas'), hero, state);
const motionButton = document.querySelector('.motion-toggle');
const media = gsap.matchMedia();
const updateMotionButton = () => {
  motionButton.setAttribute('aria-pressed', String(state.paused));
  motionButton.innerHTML = state.paused ? 'Play motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
};
let motionContext;
function setupMotion({ playIntro = false } = {}) {
  const scrollProgress = state.scroll;
  motionContext?.revert();
  state.scroll = scrollProgress;
  state.reveal = 1;
  document.documentElement.classList.toggle('motion-paused', state.paused);
  motionContext = gsap.context(() => {
    if (state.paused) return;
    if (playIntro) {
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.fromTo(state, { reveal: .15 }, { reveal: 1, duration: 2.5, ease: 'power2.inOut' }, 0)
      .from('.site-header .brand, .site-header nav a, .header-link', { y: -12, autoAlpha: 0, duration: .65, stagger: .07 }, .15)
      .from('.hero-intro', { y: 13, autoAlpha: 0, duration: .6 }, .4)
      .from('.hero h1 > span', { y: 48, autoAlpha: 0, duration: 1, stagger: .13 }, .55)
      .from('.hero-bottom > *', { y: 16, autoAlpha: 0, duration: .7, stagger: .1 }, 1.1)
      .from('.hero-note', { y: 35, rotation: -3, autoAlpha: 0, duration: .9 }, 1.35)
      .from('.hero-footer', { autoAlpha: 0, duration: .7 }, 1.65);
    }
    gsap.to(state, { scroll: 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } });
    gsap.to('.hero-content', { y: -45, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 } });
    const unseen = selector => gsap.utils.toArray(selector).filter(element => element.getBoundingClientRect().top > window.innerHeight * .92);
    const reveal = (selector, vars) => { const targets = unseen(selector); if (targets.length) gsap.from(targets, vars); };
    reveal('.belief-copy > *', { y: 22, autoAlpha: 0, duration: .8, stagger: .1, scrollTrigger: { trigger: '.belief-copy', start: 'top 86%', once: true } });
    reveal('.belief-ticket', { y: 45, rotation: 4, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: '.belief-art', start: 'top 75%', once: true } });
    const path = document.querySelector('.circled path');
    if (unseen('.circled').length) {
    const length = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: '.circled', start: 'top 83%', once: true } });
    }
    unseen('.photo').forEach((photo, i) => {
      gsap.from(photo, { y: 65, rotation: i % 2 ? -5 : 4, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: photo, start: 'top 93%', once: true } });
    });
    reveal('.round-sticker', { scale: .65, rotation: 40, autoAlpha: 0, duration: .8, ease: 'back.out(1.2)', scrollTrigger: { trigger: '.people-board', start: 'top 80%', once: true } });
    reveal('.notebook', { y: 40, rotation: 4, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: '.workbench', start: 'top 85%', once: true } });
    reveal('.small-note', { y: 25, rotation: -3, autoAlpha: 0, duration: .9, scrollTrigger: { trigger: '.workbench', start: 'top 65%', once: true } });
    reveal('.possibility-pair article', { y: 50, autoAlpha: 0, duration: .9, stagger: .16, scrollTrigger: { trigger: '.possibility-pair', start: 'top 88%', once: true } });
    reveal('.letter', { y: 35, rotation: -2, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: '.letter', start: 'top 90%', once: true } });
  }, document.body);
}
setupMotion({ playIntro: !state.paused && window.scrollY < 100 }); updateMotionButton();
motionButton.addEventListener('click', () => {
  state.paused = !state.paused;
  state.reduced = state.paused;
  try { localStorage.setItem('cyanova-motion', state.paused ? 'paused' : 'playing'); } catch { /* Preference still applies for this visit. */ }
  setupMotion(); updateMotionButton(); window.dispatchEvent(new Event('cyanova:motion'));
});
reduceQuery.addEventListener('change', e => { state.reduced = e.matches; state.paused = e.matches; setupMotion(); updateMotionButton(); window.dispatchEvent(new Event('cyanova:motion')); });

const menu = document.querySelector('#navigation');
const menuButton = document.querySelector('.menu-toggle');
const closeMenu = () => { menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); menu.classList.remove('is-open'); };
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); menu.classList.toggle('is-open', open); });
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
media.add('(min-width: 761px)', () => { closeMenu(); });

document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => ScrollTrigger.refresh()));
const form = document.querySelector('#invite-form');
const status = document.querySelector('#form-status');
form.addEventListener('submit', e => { e.preventDefault(); if (!form.reportValidity()) return; status.textContent = 'Your introduction is ready to preview. Nothing has been sent or saved; invitation submissions are not connected yet.'; });
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('pageshow', e => { if (e.persisted) ScrollTrigger.refresh(); });
if (import.meta.hot) import.meta.hot.dispose(() => { disposeEclipse(); motionContext?.revert(); media.revert(); });
