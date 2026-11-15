/**
 * data-motion-inview を持つ要素が画面に 20% 入ったら .is-inview を付ける（一度だけ）。
 * react-intersection-observer の useInView({ triggerOnce: true, threshold: 0.2 }) の置き換え。
 */
export function observeInView() {
  const targets = document.querySelectorAll<HTMLElement>('[data-motion-inview]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-inview'));
    return;
  }
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-inview');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.2 },
  );
  targets.forEach(t => io.observe(t));
}
