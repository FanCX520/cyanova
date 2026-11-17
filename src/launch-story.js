import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MOTION } from './motion-settings.js';

export function captureActiveLaunchStory() {
  return [...document.querySelectorAll('.launch-story.is-launch-enhanced')].find(section => section.dataset.storyPinned === 'true') || null;
}

export function restoreStaticLaunchStory(section) {
  if (!section) return;
  requestAnimationFrame(() => {
    if (section.isConnected && !section.classList.contains('is-launch-enhanced')) section.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}

export function updateLaunchStoryAvailability({ room, paused, reduced }) {
  document.querySelectorAll('.launch-story').forEach(section => {
    const enabled = section.classList.contains('is-launch-enhanced');
    const notice = section.querySelector('[data-story-availability]');
    const status = section.querySelector('[data-story-status]');
    if (notice) notice.hidden = enabled;
    if (status) status.textContent = !room
      ? 'The window is too short for a fixed-screen demo. All three steps are shown below.'
      : reduced ? 'Your device prefers reduced motion. You can choose to play this scroll demonstration.'
        : paused ? 'Other site motion is paused. You can still play this scroll demonstration.'
          : 'The scroll demonstration is off. Play it here, or read all three steps below.';
    section.querySelectorAll('[data-story-mode-control]').forEach(button => {
      button.hidden = button.hasAttribute('data-start-story') && (enabled || !room);
      button.disabled = !room;
      button.setAttribute('aria-label', 'Enable scroll demonstration');
      button.setAttribute('aria-pressed', String(enabled));
      const label = button.querySelector('[data-story-mode-label]');
      if (label) label.textContent = enabled ? 'Read without animation' : !room ? 'Taller window needed' : 'Play scroll demo';
    });
  });
}

// Run before downstream ScrollTriggers so the pin's spacing is included in their positions.
export function setupPinnedLaunchStories({ room, desktop }) {
  if (!room) return () => {};
  const cleanups = [];
  document.querySelectorAll('.launch-story').forEach(section => {
    const stage = section.querySelector('.launch-stage');
    const frames = [...section.querySelectorAll('.launch-frame')];
    const copies = frames.map(frame => frame.querySelector('.launch-frame-copy'));
    const sheets = frames.map(frame => frame.querySelector('.launch-sheet'));
    const buttons = [...section.querySelectorAll('[data-story-step]')];
    const progress = section.querySelector('.launch-progress > span');
    if (!stage || frames.length !== 3 || copies.some(x => !x) || sheets.some(x => !x)) return;
    section.classList.add('is-launch-enhanced');
    buttons.forEach(button => { button.hidden = false; });
    gsap.set(copies, { autoAlpha: 0, y: 12 });
    gsap.set(copies[0], { autoAlpha: 1, y: 0 });
    gsap.set(sheets, { autoAlpha: 0, yPercent: 35, scale: .88, rotation: 3 });
    gsap.set(sheets[0], { autoAlpha: 1, yPercent: 0, scale: 1, rotation: -2 });
    const market = sheets[0].querySelectorAll('.launch-market-map > span');
    const local = sheets[1].querySelectorAll('.launch-local-lines > span');
    const loop = sheets[2].querySelector('.launch-loop-mark');
    const strip = sheets[0].querySelector('.launch-torn-strip');
    const tape = sheets[1].querySelector('.launch-note-tape');
    const stripInk = sheets[0].querySelector('.launch-ink-line path');
    const localInk = [...sheets[1].querySelectorAll('.launch-ink-line path')];
    const arrowInk = loop?.querySelector('path');
    [stripInk, ...localInk, arrowInk].filter(Boolean).forEach(path => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
    if (strip) gsap.set(strip, { scaleX: .88, y: 4, transformOrigin: 'left center' });
    if (tape) gsap.set(tape, { scaleX: .7, opacity: .45, transformOrigin: 'left center' });
    gsap.set(market, { opacity: .5, scale: .94 });
    gsap.set(local, { autoAlpha: 0, x: -8 });
    if (loop) gsap.set(loop, { transformOrigin: '50% 50%', rotation: -12, y: 10 });
    let current = -1;
    section.dataset.storyStep = '0';
    let timeline;
    timeline = gsap.timeline({
      defaults: { ease: MOTION.linear },
      scrollTrigger: {
        trigger: section,
        pin: stage,
        pinSpacing: true,
        start: 'top top',
        end: () => `+=${Math.round(innerHeight * (desktop ? 2.6 : 2.2))}`,
        scrub: MOTION.scrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        id: 'cyanova-launch-story',
        onToggle: self => { section.dataset.storyPinned = String(self.isActive); },
      },
      onUpdate: () => {
        if (!timeline) return;
        const p = timeline.progress();
        const index = p < .33 ? 0 : p < .72 ? 1 : 2;
        if (current === index) return;
        current = index;
        section.dataset.storyStep = String(index);
        buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      },
    });
    timeline.addLabel('direction', 0)
      .to(progress, { scaleX: 1, duration: 1 }, 0)
      .to(market, { opacity: 1, scale: 1, duration: .08, stagger: .035 }, .04)
      .set(copies[0], { autoAlpha: 0, immediateRender: false }, .33)
      .to(sheets[0], { xPercent: -7, yPercent: -8, scale: .86, rotation: -5, autoAlpha: .45, duration: .16 }, .24)
      .to(sheets[1], { autoAlpha: 1, yPercent: 0, scale: 1, rotation: 3, duration: .16 }, .27)
      .set(copies[1], { autoAlpha: 1, y: 0, immediateRender: false }, .33)
      .addLabel('localize', .43)
      .to(local, { autoAlpha: 1, x: 0, duration: .12, stagger: .035 }, .34)
      .set(copies[1], { autoAlpha: 0, immediateRender: false }, .72)
      .to(sheets[0], { xPercent: -14, yPercent: -13, scale: .78, rotation: -8, autoAlpha: .28, duration: .16 }, .64)
      .to(sheets[1], { xPercent: 6, yPercent: -6, scale: .88, rotation: 5, autoAlpha: .5, duration: .16 }, .64)
      .to(sheets[2], { autoAlpha: 1, yPercent: 0, scale: 1, rotation: -1, duration: .16 }, .67)
      .set(copies[2], { autoAlpha: 1, y: 0, immediateRender: false }, .72)
      .addLabel('launch', .83);
    // Fractions below belong to the existing duration-1 scroll story, not wall-clock seconds.
    if (strip) timeline.to(strip, { scaleX: 1, y: 0, duration: .12 }, .03);
    if (stripInk) timeline.to(stripInk, { strokeDashoffset: 0, duration: .14 }, .04);
    if (tape) timeline.to(tape, { scaleX: 1, opacity: 1, duration: .1 }, .34);
    if (localInk.length) timeline.to(localInk, { strokeDashoffset: 0, duration: .12, stagger: .035 }, .36);
    if (loop) timeline.to(loop, { rotation: 0, y: 0, duration: .13 }, .8);
    if (arrowInk) timeline.to(arrowInk, { strokeDashoffset: 0, duration: .13 }, .8);
    const handlers = buttons.map((button, index) => {
      const handler = () => {
        const trigger = timeline.scrollTrigger;
        const p = [.12, .54, .91][index];
        scrollTo({ top: trigger.start + (trigger.end - trigger.start) * p, behavior: 'smooth' });
      };
      button.addEventListener('click', handler);
      return () => button.removeEventListener('click', handler);
    });
    cleanups.push(() => {
      handlers.forEach(remove => remove());
      section.classList.remove('is-launch-enhanced');
      delete section.dataset.storyPinned;
      delete section.dataset.storyStep;
      buttons.forEach((button, index) => { button.hidden = true; button.setAttribute('aria-pressed', String(index === 0)); });
    });
  });
  return () => cleanups.forEach(dispose => dispose());
}
