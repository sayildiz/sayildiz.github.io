/* Playground: SpongeBob & Patrick bopping to a 122 BPM beat. */

const stage = document.getElementById('stage');
const bubbles = document.getElementById('bubbles');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* clicking a dancer spins them once */
stage?.addEventListener('click', (e) => {
  const dancer = e.target.closest('.dancer');
  if (!dancer || reduced) return;
  dancer.classList.remove('spin');
  void dancer.offsetWidth;            // restart the animation
  dancer.classList.add('spin');
  dancer.addEventListener('animationend', () => dancer.classList.remove('spin'), { once: true });
});

/* bubbles drifting up from the stage floor */
if (bubbles && !reduced) {
  const spawn = () => {
    const b = document.createElement('i');
    const size = 4 + Math.random() * 14;
    b.style.left = `${6 + Math.random() * 88}%`;
    b.style.width = b.style.height = `${size}px`;
    b.style.setProperty('--dx', `${(Math.random() - 0.5) * 90}px`);
    b.style.animationDuration = `${5 + Math.random() * 5}s`;
    bubbles.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  };

  for (let i = 0; i < 6; i++) setTimeout(spawn, i * 400);
  setInterval(spawn, 850);
}
