// =====================================================================
// Five interactive WebGL shader wallpapers
// Each exposes: new Shader(canvas) => { start(), stop(), click(x,y), setMouse(x,y), resize() }
// All use raw WebGL2 fragment shaders (full-screen triangle), 60fps.
// =====================================================================

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

function createGL(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: false, alpha: false });
  if (!gl) throw new Error('WebGL2 not supported');
  return gl;
}

function compileProgram(gl, fragSrc) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERT);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error('VS:', gl.getShaderInfoLog(vs));
  }
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('FS:', gl.getShaderInfoLog(fs));
  }
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('LINK:', gl.getProgramInfoLog(p));
  }
  return p;
}

function fullscreenQuad(gl, prog) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return vao;
}

// Base class with shared loop, resize, mouse, ripple stack
class BaseShader {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    this.start_t = performance.now();
    this.mouse = [0.5, 0.5];
    this.mouseTarget = [0.5, 0.5];
    this.ripples = []; // {x,y,t}
    this.running = false;
    this._raf = null;
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  setMouse(x, y) {
    // x,y in CSS pixels relative to canvas
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.mouseTarget = [x / w, 1.0 - y / h];
  }
  click(x, y) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ripples.push({ x: x/w, y: 1.0 - y/h, t: performance.now() });
    if (this.ripples.length > 6) this.ripples.shift();
  }
  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      // smooth mouse
      this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * 0.12;
      this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * 0.12;
      this.draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }
  destroy() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
  }
}

// =====================================================================
// 1. LIQUID GRADIENT FIELD
// =====================================================================
const LIQUID_FS = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec4 u_ripples[6]; // x, y, age, active

// hash noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),
             mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a*noise(p); p *= 2.07; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  vec2 m = u_mouse;
  m.x *= u_res.x / u_res.y;

  // magnetic pull toward mouse
  vec2 dir = p - m;
  float d = length(dir);
  vec2 pull = -normalize(dir + 1e-4) * exp(-d*2.5) * 0.18;

  // ripple distortion
  for (int i = 0; i < 6; i++) {
    if (u_ripples[i].w < 0.5) continue;
    vec2 rp = u_ripples[i].xy; rp.x *= u_res.x / u_res.y;
    float age = u_ripples[i].z;
    float r = length(p - rp);
    float wave = sin(r*40.0 - age*8.0) * exp(-age*1.5) * exp(-r*3.0);
    pull += normalize(p - rp + 1e-4) * wave * 0.06;
  }

  vec2 q = p + pull;
  float t = u_time * 0.15;

  // layered fbm for liquid
  float n1 = fbm(q*1.4 + vec2(t, -t*0.7));
  float n2 = fbm(q*2.3 + vec2(-t*0.5, t*0.3) + n1);
  float n3 = fbm(q*0.8 + vec2(t*0.3, t*0.2) + n2*1.5);

  // colors: deep blue base, blue highlight, white at cursor
  vec3 c1 = vec3(0.012, 0.035, 0.082);   // very dark blue
  vec3 c2 = vec3(0.039, 0.122, 0.302);   // #0A1F4D primary
  vec3 c3 = vec3(0.302, 0.498, 1.000);   // #4D7FFF accent
  vec3 c4 = vec3(1.000, 1.000, 1.000);   // white

  vec3 col = mix(c1, c2, smoothstep(0.2, 0.7, n1));
  col = mix(col, c3, smoothstep(0.55, 0.85, n2) * 0.6);
  col += c4 * smoothstep(0.75, 0.95, n3) * 0.15;

  // mouse: bright white liquid bloom
  float bloom = exp(-d*3.5);
  col = mix(col, c4, bloom * 0.85);
  // soft outer halo of accent blue around the white
  col += c3 * exp(-d*2.0) * 0.25 * (1.0 - bloom);

  // vignette
  vec2 vc = uv - 0.5;
  col *= 1.0 - dot(vc,vc)*0.6;

  // grain
  float g = (hash(gl_FragCoord.xy + u_time)-0.5) * 0.02;
  col += g;

  outColor = vec4(col, 1.0);
}
`;

class LiquidShader extends BaseShader {
  constructor(canvas) {
    super(canvas);
    const gl = this.gl;
    this.prog = compileProgram(gl, LIQUID_FS);
    this.vao = fullscreenQuad(gl, this.prog);
    this.u_res = gl.getUniformLocation(this.prog, 'u_res');
    this.u_time = gl.getUniformLocation(this.prog, 'u_time');
    this.u_mouse = gl.getUniformLocation(this.prog, 'u_mouse');
    this.u_ripples = gl.getUniformLocation(this.prog, 'u_ripples');
  }
  draw() {
    const gl = this.gl;
    const t = (performance.now() - this.start_t) / 1000;
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(this.u_res, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u_time, t);
    gl.uniform2f(this.u_mouse, this.mouse[0], this.mouse[1]);
    const arr = new Float32Array(24);
    for (let i = 0; i < 6; i++) {
      const r = this.ripples[i];
      if (r) {
        const age = (performance.now() - r.t) / 1000;
        arr[i*4+0] = r.x;
        arr[i*4+1] = r.y;
        arr[i*4+2] = age;
        arr[i*4+3] = age < 4 ? 1 : 0;
      } else {
        arr[i*4+3] = 0;
      }
    }
    gl.uniform4fv(this.u_ripples, arr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// =====================================================================
// 2. PARTICLE GRID SYSTEM (CPU sim, GPU render via point sprites)
// =====================================================================
const PARTICLE_VS = `#version 300 es
in vec2 a_pos;
in float a_size;
in float a_alpha;
uniform vec2 u_res;
out float v_alpha;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_size;
  v_alpha = a_alpha;
}
`;
const PARTICLE_FS = `#version 300 es
precision highp float;
in float v_alpha;
out vec4 outColor;
uniform vec3 u_color;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float a = smoothstep(0.5, 0.0, d) * v_alpha;
  outColor = vec4(u_color, a);
}
`;

class ParticleGridShader extends BaseShader {
  constructor(canvas) {
    super(canvas);
    const gl = this.gl;
    // Custom program (not using fullscreenQuad helper)
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, PARTICLE_VS); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, PARTICLE_FS); gl.compileShader(fs);
    this.prog = gl.createProgram();
    gl.attachShader(this.prog, vs); gl.attachShader(this.prog, fs);
    gl.linkProgram(this.prog);

    // Background fill program (solid color w/ subtle vignette)
    this.bgProg = compileProgram(gl, `#version 300 es
      precision highp float; out vec4 o; uniform vec2 u_res; uniform float u_time;
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        vec2 c = uv-0.5;
        vec3 col = vec3(0.012,0.035,0.082);
        col += vec3(0.039,0.122,0.302) * (1.0 - length(c)*1.4) * 0.30;
        o = vec4(col,1.0);
      }`);
    this.bgVao = fullscreenQuad(gl, this.bgProg);

    this.posBuf = gl.createBuffer();
    this.sizeBuf = gl.createBuffer();
    this.alphaBuf = gl.createBuffer();
    this.vao = gl.createVertexArray();

    this.particles = [];
    this._buildGrid();
  }
  _buildGrid() {
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const spacing = 32;
    const cols = Math.ceil(W / spacing) + 1;
    const rows = Math.ceil(H / spacing) + 1;
    this.particles = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * spacing;
        const y = j * spacing;
        this.particles.push({ x, y, ox:x, oy:y, vx:0, vy:0, life: 1 });
      }
    }
  }
  resize() {
    super.resize();
    if (this.particles) this._buildGrid();
  }
  click(x, y) {
    super.click(x, y);
    // explosion impulse on nearby particles
    const dpr = window.devicePixelRatio || 1;
    for (const p of this.particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.sqrt(dx*dx + dy*dy) + 0.001;
      const f = Math.exp(-d/120) * 18;
      p.vx += (dx/d) * f;
      p.vy += (dy/d) * f;
    }
  }
  draw() {
    const gl = this.gl;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const mx = this.mouse[0] * W;
    const my = (1 - this.mouse[1]) * H;

    // simulate
    for (const p of this.particles) {
      const dxm = mx - p.x, dym = my - p.y;
      const dm = Math.sqrt(dxm*dxm + dym*dym) + 0.001;
      // attraction toward cursor (gentle)
      if (dm < 220) {
        const f = (1 - dm/220) * 0.6;
        p.vx += (dxm/dm) * f;
        p.vy += (dym/dm) * f;
      }
      // restoring spring to origin
      p.vx += (p.ox - p.x) * 0.04;
      p.vy += (p.oy - p.y) * 0.04;
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.x += p.vx;
      p.y += p.vy;
    }

    // pack arrays
    const N = this.particles.length;
    const positions = new Float32Array(N*2);
    const sizes = new Float32Array(N);
    const alphas = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const p = this.particles[i];
      positions[i*2] = p.x * dpr;
      positions[i*2+1] = p.y * dpr;
      const dxm = mx - p.x, dym = my - p.y;
      const dm = Math.sqrt(dxm*dxm + dym*dym);
      const near = Math.max(0, 1 - dm/240);
      sizes[i] = (2 + near*5) * dpr;
      alphas[i] = 0.25 + near*0.75;
    }

    // bg
    gl.useProgram(this.bgProg);
    gl.bindVertexArray(this.bgVao);
    const ru = gl.getUniformLocation(this.bgProg, 'u_res');
    gl.uniform2f(ru, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // particles
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    let loc = gl.getAttribLocation(this.prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    loc = gl.getAttribLocation(this.prog, 'a_size');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuf);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
    loc = gl.getAttribLocation(this.prog, 'a_alpha');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);

    gl.uniform2f(gl.getUniformLocation(this.prog,'u_res'), this.canvas.width, this.canvas.height);
    gl.uniform3f(gl.getUniformLocation(this.prog,'u_color'), 1.0,1.0,1.0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disable(gl.BLEND);
  }
}

// =====================================================================
// 3. NEURAL NETWORK LINES
// =====================================================================
class NeuralShader extends BaseShader {
  constructor(canvas) {
    super(canvas);
    const gl = this.gl;
    this.bgProg = compileProgram(gl, `#version 300 es
      precision highp float; out vec4 o; uniform vec2 u_res;
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        vec2 c = uv-0.5;
        vec3 col = vec3(0.010,0.030,0.072);
        col += vec3(0.039,0.122,0.302) * (1.0 - length(c)*1.6) * 0.25;
        o = vec4(col,1.0);
      }`);
    this.bgVao = fullscreenQuad(gl, this.bgProg);

    this.lineProg = compileProgram(gl, `#version 300 es
      precision highp float; out vec4 o;
      uniform vec3 u_color; uniform float u_alpha;
      void main(){ o = vec4(u_color, u_alpha); }`);

    // 2D canvas overlay would be simpler — use 2D canvas instead for lines
    // Switch: use a sibling 2D canvas painted on top via DOM? We're locked to one canvas.
    // We'll draw lines as triangles via WebGL.
    this.lineBuf = gl.createBuffer();
    this.lineVao = gl.createVertexArray();

    this.nodes = [];
    this.pulses = [];
    this._buildNodes();
  }
  _buildNodes() {
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const N = Math.floor((W*H) / 18000);
    this.nodes = [];
    for (let i = 0; i < N; i++) {
      this.nodes.push({
        x: Math.random()*W, y: Math.random()*H,
        ox: 0, oy: 0,
        vx: (Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3,
      });
    }
    this.nodes.forEach(n => { n.ox = n.x; n.oy = n.y; });
  }
  resize() { super.resize(); if (this.nodes) this._buildNodes(); }
  click(x, y) {
    super.click(x, y);
    // create pulses from nearest node along its connections
    let best = null, bd = 1e9;
    for (const n of this.nodes) {
      const d = (n.x-x)*(n.x-x) + (n.y-y)*(n.y-y);
      if (d < bd) { bd = d; best = n; }
    }
    if (best) {
      this.pulses.push({ from: best, t: performance.now(), depth: 0 });
    }
  }
  draw() {
    const gl = this.gl;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const mx = this.mouse[0]*W;
    const my = (1-this.mouse[1])*H;

    // simulate
    for (const n of this.nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      // pull toward mouse
      const dx = mx - n.x, dy = my - n.y;
      const d = Math.sqrt(dx*dx+dy*dy)+0.001;
      if (d < 240) {
        const f = (1 - d/240) * 0.5;
        n.x += (dx/d) * f;
        n.y += (dy/d) * f;
      }
    }

    // bg
    gl.useProgram(this.bgProg);
    gl.bindVertexArray(this.bgVao);
    gl.uniform2f(gl.getUniformLocation(this.bgProg,'u_res'), this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // build line geometry
    const verts = [];
    const colors = []; // alpha per vertex packed separately we'll use uniform alpha per draw
    const segments = [];
    const MAX_DIST = 140;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i+1; j < this.nodes.length; j++) {
        const a = this.nodes[i], b = this.nodes[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < MAX_DIST) {
          segments.push({a, b, alpha: (1 - d/MAX_DIST) * 0.35});
        }
      }
    }

    // single draw call for all lines: build thin quad strips
    const lineVerts = [];
    const lineAlphas = [];
    const thickness = 1.0 * dpr;
    for (const s of segments) {
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
      const len = Math.sqrt(dx*dx+dy*dy)+1e-4;
      const nx = -dy/len * thickness/2;
      const ny = dx/len * thickness/2;
      const ax = s.a.x*dpr, ay = s.a.y*dpr;
      const bx = s.b.x*dpr, by = s.b.y*dpr;
      // two triangles
      lineVerts.push(ax+nx, ay+ny, bx+nx, by+ny, ax-nx, ay-ny);
      lineVerts.push(bx+nx, by+ny, bx-nx, by-ny, ax-nx, ay-ny);
      for (let k = 0; k < 6; k++) lineAlphas.push(s.alpha);
    }

    if (lineVerts.length) {
      // simple program with per-vertex alpha
      // Reuse: rebuild a small program inline
      if (!this._lineProg2) {
        this._lineProg2 = compileProgram(gl, `#version 300 es
          precision highp float;
          in vec2 a_pos; in float a_alpha;
          uniform vec2 u_res;
          out float v_alpha;
          void main(){
            vec2 c = (a_pos/u_res)*2.0-1.0; c.y = -c.y;
            gl_Position = vec4(c,0.,1.); v_alpha = a_alpha;
          }`.replace('in vec2 a_pos;\n          in float a_alpha;', 'in vec2 a_pos;\n          in float a_alpha;'));
      }
      // The above program lacks fragment — let's just write a clean one once
      if (!this._linePack) {
        const p = gl.createProgram();
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, `#version 300 es
in vec2 a_pos; in float a_alpha; uniform vec2 u_res; out float v_alpha;
void main(){ vec2 c=(a_pos/u_res)*2.0-1.0; c.y=-c.y; gl_Position=vec4(c,0.,1.); v_alpha=a_alpha; }`);
        gl.compileShader(vs);
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, `#version 300 es
precision highp float; in float v_alpha; out vec4 o; uniform vec3 u_color;
void main(){ o = vec4(u_color, v_alpha); }`);
        gl.compileShader(fs);
        gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
        this._linePack = p;
        this._lineVao2 = gl.createVertexArray();
        this._linePos = gl.createBuffer();
        this._lineAlpha = gl.createBuffer();
      }
      gl.useProgram(this._linePack);
      gl.bindVertexArray(this._lineVao2);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._linePos);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVerts), gl.DYNAMIC_DRAW);
      let loc = gl.getAttribLocation(this._linePack,'a_pos');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lineAlpha);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineAlphas), gl.DYNAMIC_DRAW);
      loc = gl.getAttribLocation(this._linePack,'a_alpha');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,1,gl.FLOAT,false,0,0);
      gl.uniform2f(gl.getUniformLocation(this._linePack,'u_res'), this.canvas.width, this.canvas.height);
      gl.uniform3f(gl.getUniformLocation(this._linePack,'u_color'), 1.0,1.0,1.0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, lineVerts.length/2);
      gl.disable(gl.BLEND);
    }

    // nodes as points
    if (!this._dotProg) {
      const p = gl.createProgram();
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, `#version 300 es
in vec2 a_pos; in float a_size; uniform vec2 u_res;
void main(){ vec2 c=(a_pos/u_res)*2.0-1.0; c.y=-c.y; gl_Position=vec4(c,0.,1.); gl_PointSize=a_size; }`);
      gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, `#version 300 es
precision highp float; out vec4 o; uniform vec3 u_color;
void main(){ vec2 p=gl_PointCoord-0.5; float d=length(p); float a=smoothstep(0.5,0.0,d); o=vec4(u_color,a); }`);
      gl.compileShader(fs);
      gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
      this._dotProg = p;
      this._dotVao = gl.createVertexArray();
      this._dotPos = gl.createBuffer();
      this._dotSize = gl.createBuffer();
    }
    const dpos = new Float32Array(this.nodes.length*2);
    const dsize = new Float32Array(this.nodes.length);
    for (let i = 0; i < this.nodes.length; i++) {
      dpos[i*2] = this.nodes[i].x*dpr;
      dpos[i*2+1] = this.nodes[i].y*dpr;
      dsize[i] = 4*dpr;
    }
    // Pulses: traveling glow on nodes near pulse origin
    const now = performance.now();
    const livePulses = [];
    for (const pl of this.pulses) {
      const age = (now - pl.t)/1000;
      if (age < 2.5) livePulses.push(pl);
    }
    this.pulses = livePulses;

    // Boost size for nodes near a pulse front
    for (const pl of this.pulses) {
      const age = (now - pl.t)/1000;
      const radius = age * 350;
      for (let i = 0; i < this.nodes.length; i++) {
        const dx = this.nodes[i].x - pl.from.x;
        const dy = this.nodes[i].y - pl.from.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        const front = Math.exp(-Math.abs(d - radius)/30) * Math.exp(-age*0.6);
        dsize[i] += front * 18 * dpr;
      }
    }
    // mouse-near nodes glow
    for (let i = 0; i < this.nodes.length; i++) {
      const dx = this.nodes[i].x - mx, dy = this.nodes[i].y - my;
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d < 200) dsize[i] += (1 - d/200) * 6 * dpr;
    }

    gl.useProgram(this._dotProg);
    gl.bindVertexArray(this._dotVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._dotPos);
    gl.bufferData(gl.ARRAY_BUFFER, dpos, gl.DYNAMIC_DRAW);
    let dloc = gl.getAttribLocation(this._dotProg,'a_pos');
    gl.enableVertexAttribArray(dloc); gl.vertexAttribPointer(dloc,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._dotSize);
    gl.bufferData(gl.ARRAY_BUFFER, dsize, gl.DYNAMIC_DRAW);
    dloc = gl.getAttribLocation(this._dotProg,'a_size');
    gl.enableVertexAttribArray(dloc); gl.vertexAttribPointer(dloc,1,gl.FLOAT,false,0,0);
    gl.uniform2f(gl.getUniformLocation(this._dotProg,'u_res'), this.canvas.width, this.canvas.height);
    gl.uniform3f(gl.getUniformLocation(this._dotProg,'u_color'), 0.302,0.498,1.000);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, this.nodes.length);
    gl.disable(gl.BLEND);
  }
}

// =====================================================================
// 4. GLASS MORPHISM WAVES
// =====================================================================
const GLASS_FS = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec4 u_ripples[6];

float wave(vec2 p, float freq, float speed, float t, vec2 dir) {
  return sin(dot(p, dir)*freq + t*speed);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  float ar = u_res.x / u_res.y;
  p.x *= ar;

  vec2 m = u_mouse; m.x *= ar;
  vec2 dm = p - m;
  float dist = length(dm);

  // mouse bend: shift p slightly
  p += normalize(dm + 1e-4) * exp(-dist*1.5) * 0.05;

  float t = u_time * 0.7;
  float w1 = wave(p, 4.0, 0.6, t, normalize(vec2(1.0,0.3)));
  float w2 = wave(p, 6.0, -0.5, t, normalize(vec2(-0.4,1.0)));
  float w3 = wave(p, 9.0, 0.9, t, normalize(vec2(0.7,-0.7)));

  // shockwaves
  float shock = 0.0;
  for (int i = 0; i < 6; i++) {
    if (u_ripples[i].w < 0.5) continue;
    vec2 rp = u_ripples[i].xy; rp.x *= ar;
    float age = u_ripples[i].z;
    float r = length(p - rp);
    shock += sin(r*30.0 - age*10.0) * exp(-age*1.2) * exp(-r*2.0);
  }

  vec3 c1 = vec3(0.012,0.035,0.082);
  vec3 c2 = vec3(0.039,0.122,0.302);  // deep blue
  vec3 c3 = vec3(0.302,0.498,1.000);  // accent blue
  vec3 c4 = vec3(1.000,1.000,1.000);  // white

  // layered translucent waves
  vec3 col = c1;
  col = mix(col, c2, smoothstep(-0.3, 0.6, w1)*0.65);
  col = mix(col, c4*0.35 + c2*0.65, smoothstep(0.0, 0.8, w2)*0.32);
  col += c3 * smoothstep(0.4, 1.0, w3) * 0.22;
  col += vec3(0.85,0.92,1.0) * shock * 0.15;

  // mouse highlight
  col += c4 * exp(-dist*5.0) * 0.18;

  // soft glass sheen — radial gradient overlay
  vec2 vc = uv - vec2(0.3, 0.7);
  col += vec3(1.0) * exp(-dot(vc,vc)*4.0) * 0.05;

  // vignette
  vec2 vv = uv-0.5; col *= 1.0 - dot(vv,vv)*0.5;

  outColor = vec4(col,1.0);
}
`;

class GlassShader extends BaseShader {
  constructor(canvas) {
    super(canvas);
    const gl = this.gl;
    this.prog = compileProgram(gl, GLASS_FS);
    this.vao = fullscreenQuad(gl, this.prog);
  }
  draw() {
    const gl = this.gl;
    const t = (performance.now() - this.start_t)/1000;
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(gl.getUniformLocation(this.prog,'u_res'), this.canvas.width, this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.prog,'u_time'), t);
    gl.uniform2f(gl.getUniformLocation(this.prog,'u_mouse'), this.mouse[0], this.mouse[1]);
    const arr = new Float32Array(24);
    for (let i = 0; i < 6; i++) {
      const r = this.ripples[i];
      if (r) {
        const age = (performance.now() - r.t)/1000;
        arr[i*4]=r.x; arr[i*4+1]=r.y; arr[i*4+2]=age; arr[i*4+3]= age<3?1:0;
      } else arr[i*4+3]=0;
    }
    gl.uniform4fv(gl.getUniformLocation(this.prog,'u_ripples'), arr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// =====================================================================
// 5. CODE RAIN (modernized — abstract glyphs in brand colors)
// We use a 2D canvas overlay approach inside the same WebGL canvas:
// Actually, easier — render via an offscreen 2D canvas and upload as texture.
// Even simpler: use a separate <canvas> via DOM. But we own ONE canvas.
// We'll do this by using a 2D context — but our canvas is locked to webgl2.
// Solution: this shader uses a sibling 2D canvas which the main code creates.
// To keep API consistent, this class accepts the GL canvas but ignores it,
// drawing instead via a 2D context on a paired canvas managed by the host.
// =====================================================================

class CodeRainShader {
  constructor(canvas, ctx2d) {
    // For code rain we use 2D canvas — the host gives us a 2D ctx.
    this.canvas = canvas;
    this.ctx = ctx2d;
    this.start_t = performance.now();
    this.mouse = [0.5, 0.5];
    this.mouseTarget = [0.5, 0.5];
    this.running = false;
    this.columns = [];
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.floor(w*dpr));
    this.canvas.height = Math.max(1, Math.floor(h*dpr));
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this._buildColumns();
  }
  _buildColumns() {
    const w = this.canvas.clientWidth;
    const fs = 16;
    const cols = Math.ceil(w / fs);
    this.columns = [];
    const palette = ['#FFFFFF', '#4D7FFF', '#0A1F4D'];
    for (let i = 0; i < cols; i++) {
      this.columns.push({
        x: i*fs,
        y: Math.random() * this.canvas.clientHeight,
        speed: 1 + Math.random()*2.5,
        len: 6 + Math.floor(Math.random()*18),
        chars: [],
        color: palette[Math.floor(Math.random()*palette.length)],
        targetSpeed: 1 + Math.random()*2.5,
      });
    }
    const glyphs = '01∆∇◊⟁⟢⟣⟤⟥⌬⌖⌗⌘⌑⌐¬∷∴∵∝∞∮∇';
    for (const c of this.columns) {
      for (let k = 0; k < c.len; k++) {
        c.chars.push(glyphs[Math.floor(Math.random()*glyphs.length)]);
      }
    }
  }
  setMouse(x,y){
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.mouseTarget = [x/w, y/h];
  }
  click(x,y){
    // gust: speed up neighboring columns away from the click
    const fs = 16;
    for (const c of this.columns) {
      const dx = c.x - x;
      const d = Math.abs(dx);
      if (d < 220) {
        c.targetSpeed += (1 - d/220) * 4;
      }
    }
  }
  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.mouse[0] += (this.mouseTarget[0]-this.mouse[0])*0.12;
      this.mouse[1] += (this.mouseTarget[1]-this.mouse[1])*0.12;
      this.draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); }
  destroy() { this.stop(); window.removeEventListener('resize', this._onResize); }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    // fade trail
    ctx.fillStyle = 'rgba(3, 9, 21, 0.18)';
    ctx.fillRect(0,0,w,h);

    const fs = 16;
    ctx.font = `${fs}px "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, monospace`;
    const mx = this.mouse[0]*w;
    const my = this.mouse[1]*h;

    for (const c of this.columns) {
      // mouse repulsion: shift y away from mouse if column near
      const dx = c.x - mx;
      let push = 0;
      if (Math.abs(dx) < 180) {
        const distY = c.y - my;
        const sign = distY >= 0 ? 1 : -1;
        push = sign * (1 - Math.abs(dx)/180) * 1.4;
      }

      c.speed += (c.targetSpeed - c.speed) * 0.05;
      c.targetSpeed += (1.5 + Math.random()*1.5 - c.targetSpeed) * 0.005;
      c.y += c.speed + push;
      if (c.y - c.len*fs > h) {
        c.y = -Math.random()*h*0.3;
        c.len = 6 + Math.floor(Math.random()*18);
      }

      for (let k = 0; k < c.len; k++) {
        const yy = c.y - k*fs;
        if (yy < -fs || yy > h+fs) continue;
        const a = Math.pow(1 - k/c.len, 1.4);
        if (k === 0) {
          ctx.fillStyle = `rgba(255,255,255,${a})`;
        } else {
          // parse hex
          const hex = c.color;
          const r = parseInt(hex.slice(1,3),16);
          const g = parseInt(hex.slice(3,5),16);
          const b = parseInt(hex.slice(5,7),16);
          ctx.fillStyle = `rgba(${r},${g},${b},${a*0.85})`;
        }
        // randomly mutate the glyph
        if (Math.random() < 0.02) {
          const glyphs = '01∆∇◊⟁⟢⟣⟤⟥⌬⌖⌗⌘⌑⌐¬∷∴∵∝∞∮∇';
          c.chars[k] = glyphs[Math.floor(Math.random()*glyphs.length)];
        }
        ctx.fillText(c.chars[k], c.x, yy);
      }
    }
  }
}

window.Shaders = {
  liquid: LiquidShader,
  particles: ParticleGridShader,
  neural: NeuralShader,
  glass: GlassShader,
  coderain: CodeRainShader,
};
