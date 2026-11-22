
// each row: [alpha, beta, gamma, delta, w, n]
const keys = [
  [-0.8,   0.10, -1.1,   0.10, -0.4,  0, 1],   // centre stable node
  [ 1.5, 0.12, -0.5,   0.12, -0.6,  0, 1],   // two stable nodes, slow clockwise spin
  [ 1.5, 0.12, -0.3, 0.12, -0.8,  1, 1],   // chaotic mixing
  [ 1,   0.16,  1,   0.16, -2,    0, 1.5],   // circle, stretched into an oval
];

function startFlow() {
  const bg = document.getElementById("bg");
  if (!bg) return;                                      // a page without the canvas: do nothing
  const scr = document.getElementById("screenflow");    // may be missing on other pages
  const btn = document.getElementById("fx");
  const bctx = bg.getContext("2d");
  const sctx = scr ? scr.getContext("2d") : null;
  const root = document.documentElement;

  let p = 0, tt = 0;   // p = position in the loop (0 to 1), tt = clock for the wobble
  let raf = 0;         // remembers the running loop so it can be stopped
    // ---- figure-8 path + spin: their own clocks, separate from the flow loop ----
  const EIGHT = 1.0;           // half-width of the figure 8, in maths units (screen is 10 across)
    const EIGHT_SPEED = 0.0029;
  const SPIN_SPEED  = 0.0013;
  let a8 = 0, aSpin = 0;       // where each one currently is

  // ---- canvas size: desktop = wide canvas, phone = small tall canvas ----
  // In portrait the flow is turned sideways, so its long axis runs up the screen.
  let W, H, SCALE, rot;
  function size() {
    const vw = window.innerWidth, vh = window.innerHeight;
    rot = vh > vw;                                  // true when the screen is taller than wide
    W = vw < 700 ? 70 : 200;                        // fewer, chunkier pixels on phones
    H = Math.max(1, Math.round(W * vh / vw));       // keeps the pixels square
    SCALE = (rot ? H : W) / 10;                     // always 10 maths units along the long axis
    bg.width = W;
    bg.height = H;
  }
  size();

  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    // only rebuild when the width changes (ignores phone address-bar height changes)
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; size(); }
  });

  // ---- dots ----
  const rand = (a, b) => a + Math.random() * (b - a);
  const spawn = () => {
    const hx = (rot ? H : W) / 2 / SCALE;           // half-width of the screen in maths units
    const hy = (rot ? W : H) / 2 / SCALE;
    return { x: rand(-hx, hx), y: rand(-hy, hy), age: 0, life: rand(150, 450), px: 0, py: 0 };
  };
  const dots = Array.from({ length: window.innerWidth < 700 ? 150 : 300 }, () => {
    const d = spawn();
    d.age = Math.floor(rand(0, d.life));            // start each dot at a random point in its life
    return d;
  });

    // ---- keep the animation going between pages ----
  try {
    const s = JSON.parse(sessionStorage.getItem("flow-state"));
    if (s && s.p >= 0 && s.p < 1) {
      p = s.p;                                   // pick the loop up where it was left
      tt = s.tt;
            a8 = s.a8 || 0;
      aSpin = s.aSpin || 0;
      if (s.dots && s.dots.length === dots.length) {
        s.dots.forEach((v, n) => {               // put every dot back where it was
          dots[n].x = v[0];
          dots[n].y = v[1];
          dots[n].age = v[2];
          dots[n].life = v[3];
        });
      }
    }
  } catch (e) {}

  window.addEventListener("pagehide", () => {   // runs just as you leave the page
    try {
      sessionStorage.setItem("flow-state", JSON.stringify({
        p, tt, a8, aSpin,
        dots: dots.map(d => [+d.x.toFixed(3), +d.y.toFixed(3), d.age, Math.round(d.life)]),
      }));
    } catch (e) {}
  });

  function fade(c, w, h) {
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = "rgba(0, 0, 0, 0.08)";
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
  }

  function frame() {
    // work out where the screen sits on top of the background canvas
    let ox = 0, oy = 0;
    if (sctx) {
      const r = scr.getBoundingClientRect();        // the screen
      const b = bg.getBoundingClientRect();         // the background canvas
      const kx = W / b.width, ky = H / b.height;    // background pixels per page pixel
      const sw = Math.max(1, Math.round(r.width * kx));
      const sh = Math.max(1, Math.round(r.height * ky));
      if (scr.width !== sw || scr.height !== sh) { scr.width = sw; scr.height = sh; }
      ox = Math.round((r.left - b.left) * kx);
      oy = Math.round((r.top - b.top) * ky);
      fade(sctx, scr.width, scr.height);
    }
    fade(bctx, W, H);

    // blend between two neighbouring stages of the loop
    const N = keys.length;
    const seg = Math.floor(p * N), u = p * N - seg;
    const k = Math.min(Math.max((u - 0.3) / 0.7, 0), 1);   // rests 30% of each stage, then shifts
    const m = k * k * (3 - 2 * k);
    const K0 = keys[seg], K1 = keys[(seg + 1) % N];
    const P = K0.map((v, j) => v + (K1[j] - v) * m);
    tt += 0.03;
        // advance the two independent clocks
    a8 += EIGHT_SPEED;
    aSpin += SPIN_SPEED;
    const fx = EIGHT * Math.cos(a8);                  // left-right
    const fy = EIGHT * Math.sin(a8) * Math.cos(a8);   // up-down
    const cs = Math.cos(aSpin), sn = Math.sin(aSpin);

    for (let n = 0; n < dots.length; n++) {
      const d = dots[n];
      const x = d.x, y = d.y, r2 = x*x + y*y;
      d.x += (P[0]*x - P[1]*x*r2 - P[4]*y + P[5]*Math.sin(1.3*y + tt)) * 0.02;
      d.y += (P[2]*y - P[3]*y*r2 + P[4]*x + P[5]*Math.cos(1.1*x - 0.8*tt)) * 0.02;
      d.age++;
      const xs = d.x * P[6];              // stretch the maths x-axis by this stage's value
      const h0 = rot ? d.y : xs;
      const v0 = rot ? xs : d.y;
      d.px = Math.floor(W/2 + ( h0 * cs + v0 * sn + fx) * SCALE);
      d.py = Math.floor(H/2 - (-h0 * sn + v0 * cs + fy) * SCALE);
            const edge = W * 0.25;   // how far past the screen edge a dot may drift before it respawns
      if (d.age > d.life || d.px < -edge || d.px >= W + edge || d.py < -edge || d.py >= H + edge) dots[n] = spawn();
    }

    // draw the same dots twice: blue behind the monitor, green on the screen
    bctx.fillStyle = root.classList.contains("dark") ? "#9db8ff" : "#5981f0";   // paler blue in dark mode
    for (const d of dots) bctx.fillRect(d.px, d.py, 1, 1);
    if (sctx) {
      sctx.fillStyle = "#97efa0";
      for (const d of dots) sctx.fillRect(d.px - ox, d.py - oy, 1, 1);
    }

    p += 0.0003;
    if (p >= 1) p = 0;
    raf = requestAnimationFrame(frame);
  }

  function setFlow(on) {
    root.classList.toggle("noflow", !on);
    if (btn) btn.setAttribute("aria-pressed", String(on));
    try { localStorage.setItem("flow-off", on ? "0" : "1"); } catch (e) {}
    cancelAnimationFrame(raf);                      // stop any running loop first
    if (on) frame();                                // start again only if turning on
  }

  let saved = null;
  try { saved = localStorage.getItem("flow-off"); } catch (e) {}
  // people who ask their device for less motion start with the animation off
  if (saved === null && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) saved = "1";
  setFlow(saved !== "1");

  if (btn) btn.addEventListener("click", () => {
    setFlow(root.classList.contains("noflow"));     // flip it
    btn.classList.add("pressed");                   // press down...
    setTimeout(() => btn.classList.remove("pressed"), 150);   // ...and back up
  });
}

startFlow();