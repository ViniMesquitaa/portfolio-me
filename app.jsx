const { useState, useEffect, useRef, useMemo, useCallback } = React;

// =====================================================================
// i18n
// =====================================================================
const STRINGS = {
  'en-US': {
    role: 'Full-stack & AI Engineer',
    location: 'Fortaleza · CE · BR',
    available: 'Available for work',
    deck: 'Slide',
    of: 'of',
    next: 'Next',
    prev: 'Prev',
    drag: 'Drag, scroll, or use arrow keys',
    sectionIntro: 'Intro',
    sectionStack: 'Stack',
    sectionRole: 'Role',
    sectionEdu: 'Education',
    sectionAi: 'AI Engineering',
    sectionProjects: 'Selected Work',
    sectionContact: 'Contact',
    intro: 'I build software at the intersection of clean architecture and considered interaction. React on the front, .NET on the back — and a deep love for putting models to work where they actually matter.',
    stackCaption: 'Daily drivers, picked for clarity and speed.',
    projectsCaption: 'Focused work, shipped.',
    roleCaption: 'Where I work today, and how I work.',
    role_company: 'Veridia',
    role_company_sub: 'Software Developer · Full-stack',
    role_lead: 'Full-stack developer with a strong back-end focus.',
    role_body: 'Specialist in C# and .NET — REST APIs, JWT authentication, third-party integrations. I also work with React on the front-end when the product calls for it.',
    role_points: [
      { k: 'C# / .NET', d: 'Core language and platform.' },
      { k: 'REST APIs', d: 'Clean contracts, versioning, idempotency.' },
      { k: 'Auth (JWT)', d: 'Token flows, refresh, claims, role-based access.' },
      { k: 'Integrations', d: 'Third-party APIs, webhooks, queues, retries.' },
      { k: 'React', d: 'Front-end when needed — typed, accessible, fast.' },
    ],
    eduCaption: 'Background and what I’m studying now.',
    edu_items: [
      { degree: 'Technical Degree in Informatics', school: 'Instituto Federal do Ceará', longSchool: 'Instituto Federal de Educação, Ciência e Tecnologia do Ceará', status: 'Completed', year: '—' },
      { degree: 'Systems Analysis & Development', school: 'UNIGRANDE', longSchool: 'Centro Universitário da Grande Fortaleza', status: 'In progress', year: 'now' },
    ],
    aiCaption: 'Where most of my curiosity lives.',
    aiLead: 'I design and ship AI systems end‑to‑end — not just prompts.',
    aiBody: 'Production agents wired through MCP servers, evaluated with real harnesses, and orchestrated as durable workflows. The unsexy parts: tool contracts, retries, traces, evals, cost. The kind of work where a model becomes a teammate, not a demo.',
    aiPills: [
      { k: 'MCP', d: 'Model Context Protocol — typed tools, resources, sampling.' },
      { k: 'Agents', d: 'Planner / executor loops, tool routing, memory, guardrails.' },
      { k: 'Harnesses', d: 'Eval suites, golden sets, regression gates.' },
      { k: 'Workflows', d: 'Durable orchestration — retries, branching, HITL.' },
      { k: 'RAG', d: 'Hybrid retrieval, re‑ranking, structured citations.' },
      { k: 'Tracing', d: 'OpenTelemetry on every span.' },
    ],
    projects: [
      { title: 'Verbium', sub: 'AI Communication', desc: 'AI-powered language platform. Text-first, response-driven.', url: 'https://verbium.vercel.app/' },
      { title: 'Refugie', sub: 'Mental Health', desc: 'A calm, empathetic bridge to psychological support.', url: 'https://refugie.vercel.app/' },
      { title: 'PedeAI Menu', sub: 'Smart Menu', desc: 'Digital menu system optimized for restaurants and mobile.', url: 'https://menu-pedeai.vercel.app/' },
    ],
    visit: 'Visit',
    github: 'GitHub',
    email: 'Email',
    copy: 'Copy',
    copied: 'Copied',
    wallpaper: 'Wallpaper',
    contactLead: 'Let’s talk.',
    contactBody: 'Open to roles, collaborations, and conversations about AI systems done right.',
    shaderNames: { liquid: 'Liquid Field', particles: 'Particle Grid', neural: 'Neural Lines', glass: 'Glass Waves', coderain: 'Code Rain' },
    shaderHints: { liquid: 'Move to bend the field. Click to ripple.', particles: 'Cursor pulls the grid. Click to scatter.', neural: 'Drag attention. Click to send a pulse.', glass: 'Soft layers warp under the cursor.', coderain: 'Rain repels from the cursor.' },
    footer: 'Built with WebGL · No frameworks behind the scenes',
  },
  'pt-BR': {
    role: 'Desenvolvedor Full-stack & AI Engineer',
    location: 'Fortaleza · CE · BR',
    available: 'Disponível para trabalhos',
    deck: 'Slide',
    of: 'de',
    next: 'Próximo',
    prev: 'Anterior',
    drag: 'Arraste, role ou use as setas',
    sectionIntro: 'Intro',
    sectionStack: 'Stack',
    sectionRole: 'Atuação',
    sectionEdu: 'Formação',
    sectionAi: 'Engenharia de IA',
    sectionProjects: 'Trabalhos Selecionados',
    sectionContact: 'Contato',
    intro: 'Construo software entre arquitetura limpa e interação cuidadosa. React no front, .NET no back — e uma paixão por colocar modelos pra trabalhar onde eles realmente importam.',
    stackCaption: 'Ferramentas do dia a dia, escolhidas por clareza e velocidade.',
    projectsCaption: 'Trabalho focado, entregue.',
    roleCaption: 'Onde atuo hoje, e como trabalho.',
    role_company: 'Veridia',
    role_company_sub: 'Desenvolvedor · Full-stack',
    role_lead: 'Desenvolvedor Full Stack com foco forte em back-end.',
    role_body: 'Especialista em C# e .NET — APIs REST, autenticação com JWT e integrações com serviços externos. Também trabalho com React no front-end quando o produto pede.',
    role_points: [
      { k: 'C# / .NET', d: 'Linguagem e plataforma principais.' },
      { k: 'APIs REST', d: 'Contratos claros, versionamento, idempotência.' },
      { k: 'Auth (JWT)', d: 'Fluxos de token, refresh, claims, controle por papel.' },
      { k: 'Integrações', d: 'APIs de terceiros, webhooks, filas, retries.' },
      { k: 'React', d: 'Front-end quando necessário — tipado, acessível, rápido.' },
    ],
    eduCaption: 'Formação e o que estou cursando.',
    edu_items: [
      { degree: 'Técnico em Informática', school: 'IFCE', longSchool: 'Instituto Federal de Educação, Ciência e Tecnologia do Ceará', status: 'Concluído', year: '—' },
      { degree: 'Análise e Desenvolvimento de Sistemas', school: 'UNIGRANDE', longSchool: 'Centro Universitário da Grande Fortaleza', status: 'Em andamento', year: 'hoje' },
    ],
    aiCaption: 'Onde mora a maior parte da minha curiosidade.',
    aiLead: 'Projeto e entrego sistemas de IA de ponta a ponta — não só prompts.',
    aiBody: 'Agentes em produção via servidores MCP, avaliados com harnesses reais, orquestrados como workflows duráveis. A parte chata que importa: contrato de tools, retries, traces, evals, custo. O tipo de trabalho onde o modelo vira time, não demo.',
    aiPills: [
      { k: 'MCP', d: 'Model Context Protocol — tools tipadas, resources, sampling.' },
      { k: 'Agentes', d: 'Loops planner / executor, tools, memória, guardrails.' },
      { k: 'Harnesses', d: 'Suites de eval, golden sets, regressão.' },
      { k: 'Workflows', d: 'Orquestração durável — retries, branching, HITL.' },
      { k: 'RAG', d: 'Retrieval híbrido, re‑ranking, citações estruturadas.' },
      { k: 'Tracing', d: 'OpenTelemetry em cada span.' },
    ],
    projects: [
      { title: 'Verbium', sub: 'Comunicação com IA', desc: 'Plataforma de linguagem com IA. Texto em primeiro lugar.', url: 'https://verbium.vercel.app/' },
      { title: 'Refugie', sub: 'Saúde Mental', desc: 'Uma ponte calma e empática para apoio psicológico.', url: 'https://refugie.vercel.app/' },
      { title: 'PedeAI Menu', sub: 'Cardápio Inteligente', desc: 'Cardápio digital otimizado para restaurantes e mobile.', url: 'https://menu-pedeai.vercel.app/' },
    ],
    visit: 'Visitar',
    github: 'GitHub',
    email: 'E-mail',
    copy: 'Copiar',
    copied: 'Copiado',
    wallpaper: 'Wallpaper',
    contactLead: 'Vamos conversar.',
    contactBody: 'Aberto a vagas, colaborações e conversas sobre IA bem feita.',
    shaderNames: { liquid: 'Campo Líquido', particles: 'Grade de Partículas', neural: 'Linhas Neurais', glass: 'Ondas de Vidro', coderain: 'Chuva de Código' },
    shaderHints: { liquid: 'Mova para curvar o campo. Clique pra gerar ondas.', particles: 'O cursor atrai a grade. Clique para dispersar.', neural: 'Direcione a atenção. Clique para enviar um pulso.', glass: 'Camadas suaves se deformam sob o cursor.', coderain: 'A chuva repele do cursor.' },
    footer: 'Construído com WebGL · Sem frameworks por trás',
  },
};

const SHADER_KEYS = ['liquid', 'particles', 'neural', 'glass', 'coderain'];

// =====================================================================
// Wallpaper layer (unchanged)
// =====================================================================
function Wallpaper({ shaderKey }) {
  const glRef = useRef(null);
  const ctxRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (instanceRef.current) { instanceRef.current.destroy?.(); instanceRef.current = null; }
    const Cls = window.Shaders[shaderKey];
    if (!Cls) return;
    let inst;
    if (shaderKey === 'coderain') {
      const canvas = ctxRef.current;
      const ctx = canvas.getContext('2d');
      inst = new Cls(canvas, ctx);
    } else {
      inst = new Cls(glRef.current);
    }
    instanceRef.current = inst;
    inst.start();
    return () => { inst.destroy?.(); };
  }, [shaderKey]);

  useEffect(() => {
    const move = (e) => instanceRef.current?.setMouse(e.clientX, e.clientY);
    const click = (e) => instanceRef.current?.click(e.clientX, e.clientY);
    window.addEventListener('mousemove', move);
    window.addEventListener('click', click);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('click', click);
    };
  }, []);

  return (
    <div className="wallpaper">
      <canvas ref={glRef} style={{ display: shaderKey === 'coderain' ? 'none' : 'block' }} />
      <canvas ref={ctxRef} style={{ display: shaderKey === 'coderain' ? 'block' : 'none' }} />
      <div className="wallpaper-tint" />
    </div>
  );
}

// =====================================================================
// Status Bar
// =====================================================================
function StatusBar({ lang, setLang, t, slideIdx, slideCount, slideName }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const locale = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
      setTime(d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [lang]);

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <span className="dot" />
        <span className="mono small">MV/OS</span>
        <span className="mono small dim sb-hide">v26.05</span>
      </div>
      <div className="statusbar-center">
        <span className="mono small dim sb-hide">{slideName}</span>
        <span className="mono small slide-counter">
          <span className="cur">{String(slideIdx + 1).padStart(2, '0')}</span>
          <span className="sep">/</span>
          <span className="dim">{String(slideCount).padStart(2, '0')}</span>
        </span>
      </div>
      <div className="statusbar-right">
        <button className={`lang-pill ${lang === 'en-US' ? 'on' : ''}`} onClick={() => setLang('en-US')}>EN</button>
        <span className="lang-sep">/</span>
        <button className={`lang-pill ${lang === 'pt-BR' ? 'on' : ''}`} onClick={() => setLang('pt-BR')}>PT</button>
        <span className="mono small dim time sb-hide">{time}</span>
      </div>
    </div>
  );
}

// =====================================================================
// Slide Card wrapper — adds chrome shared across all slides
// =====================================================================
function Slide({ idx, total, num, name, accent, children, className = '' }) {
  return (
    <article className={`slide ${className}`} data-accent={accent}>
      <div className="slide-head">
        <div className="slide-head-l">
          <span className="mono small dim">{num}</span>
          <span className="slide-name mono small dim">{name}</span>
        </div>
        <div className="slide-head-r mono small dim">
          {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>
      <div className="slide-body">{children}</div>
    </article>
  );
}

// =====================================================================
// SLIDE 01 — Hero / Intro: huge serif type, signature mark
// =====================================================================
function SlideIntro({ t, idx, total }) {
  return (
    <Slide idx={idx} total={total} num="01" name={t.sectionIntro} accent="hero">
      <div className="hero-grid">
        <div className="hero-left">
          <div className="hero-meta mono small dim">
            <span>{t.role}</span>
          </div>
          <h1 className="hero-name">
            <span className="hero-first">Marcos</span>
            <span className="hero-last">Vinícius</span>
          </h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-loc mono small dim">{t.location}</div>
        </div>
      </div>
    </Slide>
  );
}

// =====================================================================
// SLIDE 02 — Stack: terminal/console aesthetic with typed lines
// =====================================================================
const STACK = [
  { name: 'React', sub: 'UI', cmd: 'render --interactive', n: '01' },
  { name: 'TypeScript', sub: 'Lang', cmd: 'tsc --strict', n: '02' },
  { name: 'C#', sub: 'Lang', cmd: 'dotnet build', n: '03' },
  { name: '.NET', sub: 'Platform', cmd: 'dotnet run --release', n: '04' },
];

function SlideStack({ t, idx, total }) {
  return (
    <Slide idx={idx} total={total} num="02" name={t.sectionStack} accent="stack">
      <div className="stack-wrap">
        <p className="block-cap">{t.stackCaption}</p>
        <ul className="stack-list">
          {STACK.map((s, i) => (
            <li className="stack-row" key={s.name}>
              <span className="mono small dim sl-num">{String(i+1).padStart(2,'0')}</span>
              <span className="sl-name">{s.name}</span>
              <span className="mono small dim sl-sub">{s.sub}</span>
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

// =====================================================================
// SLIDE 03 — Role: split ID-card layout, Veridia "badge"
// =====================================================================
function SlideRole({ t, idx, total }) {
  return (
    <Slide idx={idx} total={total} num="03" name={t.sectionRole} accent="role">
      <div className="role-wrap">
        <div className="role-head">
          <img className="role-logo" src="veridia.png" alt="Veridia" />
          <div className="mono small dim">{t.role_company_sub}</div>
        </div>
        <p className="role-lead">{t.role_lead}</p>
        <p className="role-desc">{t.role_body}</p>
        <ul className="role-points">
          {t.role_points.map((p, i) => (
            <li key={p.k} className="role-point">
              <span className="rp-num mono small dim">{String(i+1).padStart(2,'0')}</span>
              <span className="rp-key">{p.k}</span>
              <span className="rp-desc">{p.d}</span>
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

// =====================================================================
// SLIDE 04 — Education: vertical timeline
// =====================================================================
function SlideEdu({ t, idx, total }) {
  return (
    <Slide idx={idx} total={total} num="04" name={t.sectionEdu} accent="edu">
      <div className="edu-wrap">
        <p className="block-cap">{t.eduCaption}</p>
        <ul className="edu-list">
          {t.edu_items.map((e, i) => (
            <li className="edu-row" key={e.degree}>
              <span className="mono small dim edu-num">{String(i+1).padStart(2,'0')}</span>
              <div className="edu-main">
                <div className="edu-degree">{e.degree}</div>
                <div className="mono small dim">{e.school}</div>
              </div>
              <span className="mono small dim edu-status">{e.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

// =====================================================================
// SLIDE 05 — AI: graph/node aesthetic
// =====================================================================
function SlideAI({ t, idx, total }) {
  return (
    <Slide idx={idx} total={total} num="05" name={t.sectionAi} accent="ai">
      <div className="ai-wrap">
        <div className="ai-headline">
          <h2 className="ai-lead">{t.aiLead}</h2>
          <p className="ai-desc">{t.aiBody}</p>
        </div>
        <div className="ai-grid">
          {t.aiPills.map((p, i) => (
            <div className="ai-node" key={p.k}>
              <span className="mono small dim">{String(i+1).padStart(2,'0')}</span>
              <span className="ai-node-key">{p.k}</span>
              <p className="ai-node-desc">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

// =====================================================================
// SLIDE 06 — Projects: Browser-window mockups
// =====================================================================
function SlideProjects({ t, idx, total }) {
  return (
    <Slide idx={idx} total={total} num="06" name={t.sectionProjects} accent="proj">
      <div className="proj-wrap">
        <p className="block-cap">{t.projectsCaption}</p>
        <ul className="proj-list">
          {t.projects.map((p, i) => (
            <li key={p.title}>
              <a className="proj-row" href={p.url} target="_blank" rel="noreferrer">
                <span className="mono small dim proj-num">{String(i+1).padStart(2,'0')}</span>
                <div className="proj-main">
                  <h3 className="proj-title">{p.title}</h3>
                  <p className="proj-desc">{p.desc}</p>
                </div>
                <span className="mono small dim proj-url">{p.url.replace('https://','').replace(/\/$/,'')}</span>
                <span className="proj-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

// =====================================================================
// SLIDE 07 — Contact: huge mailto, copy buttons
// =====================================================================
function SlideContact({ t, idx, total }) {
  const [copied, setCopied] = useState(false);
  const email = 'vinniciussramallho98@gmail.com';
  const github = 'https://github.com/ViniMesquitaa';
  const copyEmail = (e) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Slide idx={idx} total={total} num="07" name={t.sectionContact} accent="contact">
      <div className="contact-wrap">
        <h2 className="contact-lead">{t.contactLead}</h2>
        <p className="contact-body">{t.contactBody}</p>
        <ul className="contact-rows">
          <li className="contact-row">
            <span className="mono small dim contact-label">{t.email}</span>
            <a className="contact-val" href={`mailto:${email}`}>{email}</a>
            <button className="mono small contact-copy" onClick={copyEmail}>{copied ? t.copied : t.copy}</button>
          </li>
          <li className="contact-row">
            <span className="mono small dim contact-label">{t.github}</span>
            <a className="contact-val" href={github} target="_blank" rel="noreferrer">github.com/ViniMesquitaa</a>
            <span className="contact-copy" />
          </li>
        </ul>
        <div className="contact-foot mono small dim">
          <span>© 2026 Marcos Vinícius</span>
        </div>
      </div>
    </Slide>
  );
}

// =====================================================================
// Deck — horizontal, snap, drag, keyboard, custom progress
// =====================================================================
function Deck({ t }) {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const slides = useMemo(() => [
    { name: t.sectionIntro, Comp: SlideIntro },
    { name: t.sectionStack, Comp: SlideStack },
    { name: t.sectionRole, Comp: SlideRole },
    { name: t.sectionEdu, Comp: SlideEdu },
    { name: t.sectionAi, Comp: SlideAI },
    { name: t.sectionProjects, Comp: SlideProjects },
    { name: t.sectionContact, Comp: SlideContact },
  ], [t]);

  const goTo = useCallback((i) => {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[next];
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
  }, [slides.length]);

  // observe scroll position for active slide
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        const i = Math.round(el.scrollLeft / w);
        setIdx(Math.max(0, Math.min(slides.length - 1, i)));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [slides.length]);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(idx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(idx - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, goTo, slides.length]);

  // drag-to-scroll
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = false;
    const onDown = (e) => {
      // Don't interfere with links/buttons
      if (e.target.closest('a, button, input, textarea')) return;
      down = true; moved = false;
      startX = e.pageX;
      startLeft = el.scrollLeft;
      el.classList.add('dragging');
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.classList.remove('dragging');
      if (moved) {
        // snap to nearest
        const w = el.clientWidth;
        const i = Math.round(el.scrollLeft / w);
        goTo(i);
      }
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [goTo]);

  return (
    <>
      <div className="deck" ref={trackRef}>
        {slides.map(({ name, Comp }, i) => (
          <div className="deck-slot" key={name + i}>
            <Comp t={t} idx={i} total={slides.length} />
          </div>
        ))}
      </div>
      <DeckControls idx={idx} total={slides.length} goTo={goTo} t={t} slides={slides} />
    </>
  );
}

function DeckControls({ idx, total, goTo, t, slides }) {
  return (
    <div className="deck-controls">
      <button className="dc-arrow" onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label={t.prev}>
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="dc-progress">
        {slides.map((s, i) => (
          <button key={i} className={`dc-tick ${i === idx ? 'on' : ''} ${i < idx ? 'past' : ''}`} onClick={() => goTo(i)} aria-label={s.name}>
            <span className="dc-tick-bar" />
          </button>
        ))}
      </div>
      <button className="dc-arrow" onClick={() => goTo(idx + 1)} disabled={idx === total - 1} aria-label={t.next}>
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="dc-hint mono small dim">{t.drag}</div>
    </div>
  );
}

// =====================================================================
// ShaderDock — horizontal-scroll on small screens
// =====================================================================
function ShaderDock({ shaderKey, setShaderKey, t }) {
  const [open, setOpen] = useState(() => {
    const v = localStorage.getItem('dockOpen');
    return v === null ? true : v === '1';
  });
  useEffect(() => { localStorage.setItem('dockOpen', open ? '1' : '0'); }, [open]);

  if (!open) {
    return (
      <button className="dock-min" onClick={() => setOpen(true)} aria-label={t.wallpaper}>
        <span className="dock-min-dot" />
        <span className="mono small">{t.wallpaper}</span>
      </button>
    );
  }
  return (
    <div className="dock">
      <div className="dock-row">
        <div className="dock-label mono small dim">{t.wallpaper}</div>
        <div className="dock-pills custom-scroll">
          {SHADER_KEYS.map((k, i) => (
            <button key={k} className={`dock-pill ${k === shaderKey ? 'active' : ''}`} onClick={() => setShaderKey(k)}>
              <span className="dock-num mono">0{i + 1}</span>
              <span className="dock-name">{t.shaderNames[k]}</span>
            </button>
          ))}
        </div>
        <button className="dock-close" onClick={() => setOpen(false)} aria-label="minimize">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// App
// =====================================================================
function App() {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('lang');
    if (stored && STRINGS[stored]) return stored;
    return navigator.language?.startsWith('pt') ? 'pt-BR' : 'en-US';
  });
  const [shaderKey, setShaderKey] = useState(() => localStorage.getItem('shader') || 'liquid');
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('shader', shaderKey); }, [shaderKey]);

  const t = STRINGS[lang];
  const slideNames = [t.sectionIntro, t.sectionStack, t.sectionRole, t.sectionEdu, t.sectionAi, t.sectionProjects, t.sectionContact];

  // listen for slide changes via custom event from Deck
  useEffect(() => {
    const handler = (e) => setSlideIdx(e.detail);
    window.addEventListener('mv:slidechange', handler);
    return () => window.removeEventListener('mv:slidechange', handler);
  }, []);

  return (
    <>
      <Wallpaper shaderKey={shaderKey} />
      <div className="frame">
        <StatusBar lang={lang} setLang={setLang} t={t} slideIdx={slideIdx} slideCount={slideNames.length} slideName={slideNames[slideIdx]} />
        <DeckHost t={t} onIdx={setSlideIdx} />
        <ShaderDock shaderKey={shaderKey} setShaderKey={setShaderKey} t={t} />
      </div>
    </>
  );
}

// Wraps Deck so we can hoist its idx upward
function DeckHost({ t, onIdx }) {
  // intercept by wrapping Deck logic — simpler: forward via custom event
  return <DeckWithReporter t={t} onIdx={onIdx} />;
}

function DeckWithReporter({ t, onIdx }) {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const slides = useMemo(() => [
    { name: t.sectionIntro, Comp: SlideIntro },
    { name: t.sectionStack, Comp: SlideStack },
    { name: t.sectionRole, Comp: SlideRole },
    { name: t.sectionEdu, Comp: SlideEdu },
    { name: t.sectionAi, Comp: SlideAI },
    { name: t.sectionProjects, Comp: SlideProjects },
    { name: t.sectionContact, Comp: SlideContact },
  ], [t]);

  useEffect(() => { onIdx(idx); }, [idx, onIdx]);

  const goTo = useCallback((i) => {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[next];
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
  }, [slides.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        const i = Math.round(el.scrollLeft / w);
        setIdx(Math.max(0, Math.min(slides.length - 1, i)));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [slides.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(idx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(idx - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, goTo, slides.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = false;
    const onDown = (e) => {
      if (e.target.closest('a, button, input, textarea')) return;
      down = true; moved = false;
      startX = e.pageX;
      startLeft = el.scrollLeft;
      el.classList.add('dragging');
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.classList.remove('dragging');
      if (moved) {
        const w = el.clientWidth;
        goTo(Math.round(el.scrollLeft / w));
      }
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [goTo]);

  return (
    <>
      <div className="deck" ref={trackRef}>
        {slides.map(({ name, Comp }, i) => (
          <div className="deck-slot" key={name + i}>
            <Comp t={t} idx={i} total={slides.length} />
          </div>
        ))}
      </div>
      <DeckControls idx={idx} total={slides.length} goTo={goTo} t={t} slides={slides} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
