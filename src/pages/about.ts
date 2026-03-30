async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">About This Site</h1>
      <p class="content__subtitle">Learn Pretext is an independent community resource. It is not affiliated with or endorsed by the pretext library author.</p>
    </div>

    <div class="content__section">
      <h2>What is pretext?</h2>
      <div class="explanation">
        <p><strong>Pretext</strong> is an open-source JavaScript/TypeScript library for multiline text measurement and layout, created by <a href="https://github.com/chenglou" target="_blank" rel="noopener">Cheng Lou</a>. It computes line breaks and text dimensions using pure arithmetic — without touching the DOM — making it hundreds of times faster than traditional browser measurement.</p>
        <p>The library is available on GitHub and npm:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-3) 0;display:flex;flex-direction:column;gap:var(--space-2);">
          <li><a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener" style="font-weight:var(--font-weight-medium);">github.com/chenglou/pretext</a> — source code, documentation, and official demos</li>
          <li><a href="https://www.npmjs.com/package/@chenglou/pretext" target="_blank" rel="noopener" style="font-weight:var(--font-weight-medium);">@chenglou/pretext on npm</a> — install with <code>npm install @chenglou/pretext</code></li>
          <li><a href="https://chenglou.me/pretext/" target="_blank" rel="noopener" style="font-weight:var(--font-weight-medium);">chenglou.me/pretext</a> — Cheng Lou's official demo page</li>
        </ul>
      </div>
    </div>

    <div class="content__section">
      <h2>About Learn Pretext</h2>
      <div class="explanation">
        <p>This site was built by <a href="https://endash.us" target="_blank" rel="noopener" style="font-weight:var(--font-weight-medium);">En Dash Consulting</a> as a free community resource. En Dash is on a mission to <strong>Make Work Feel Better</strong> — we do that by creating open educational tools like this, and by working directly with clients on Ways of Working Transformations and product/software engineering.</p>
        <p>Our goal here is to make pretext more accessible through interactive demos and step-by-step tutorials that show both what the library can do and how to implement it. Every demo is a working implementation with annotated source code — so you're not just seeing what's possible, you're learning how to build it yourself.</p>
        <p>This site is <strong>not</strong> an official project of Cheng Lou or the pretext library. For authoritative documentation, bug reports, and feature requests, please visit the <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener">official GitHub repository</a>.</p>
      </div>
    </div>

    <div class="content__section">
      <h2>Built with</h2>
      <div class="explanation">
        <div style="display:flex;flex-direction:column;gap:var(--space-4);">
          <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
            <span style="flex-shrink:0;width:28px;height:28px;border-radius:var(--radius-sm);background:var(--gradient-accent-soft);border:1px solid rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--font-weight-bold);color:var(--color-accent);">P</span>
            <div>
              <div style="font-weight:var(--font-weight-semibold);margin-bottom:2px;"><a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener">pretext</a></div>
              <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);">The library this site teaches. Used in every interactive demo.</div>
            </div>
          </div>
          <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
            <span style="flex-shrink:0;width:28px;height:28px;border-radius:var(--radius-sm);background:var(--gradient-accent-soft);border:1px solid rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--font-weight-bold);color:var(--color-accent);">N</span>
            <div>
              <div style="font-weight:var(--font-weight-semibold);margin-bottom:2px;"><a href="https://n-dx.dev" target="_blank" rel="noopener">n-dx</a></div>
              <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);">Product development framework used to plan, track, and build this site.</div>
            </div>
          </div>
          <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
            <span style="flex-shrink:0;width:28px;height:28px;border-radius:var(--radius-sm);background:var(--gradient-accent-soft);border:1px solid rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--font-weight-bold);color:var(--color-accent);">C</span>
            <div>
              <div style="font-weight:var(--font-weight-semibold);margin-bottom:2px;"><a href="https://claude.ai" target="_blank" rel="noopener">Claude</a></div>
              <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);">AI assistant by Anthropic. Used via Claude Code for research, implementation, and testing.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content__section">
      <h2>License</h2>
      <div class="explanation">
        <p>The pretext library is licensed under the <a href="https://github.com/chenglou/pretext/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a> by Cheng Lou.</p>
        <p>The content and code of this learning site are by <a href="https://endash.us" target="_blank" rel="noopener">En Dash</a>.</p>
      </div>
    </div>
  `
}

init()
