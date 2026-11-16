import { arrowIcon } from './icons.js';
import { initializeMotion, revealContent, animateDialog } from './motion.js';
import { initializeTerminal, setTerminalContent } from './terminal.js';

const $ = (selector) => document.querySelector(selector);
const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = (value, local = false) => {
  if (local && /^\/(?!\/)/.test(value || '')) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
const tags = (items) => items.map(t => `<span class="tag">${escape(t)}</span>`).join('');
const external = (url, label, cls = '') => safeUrl(url) ? `<a class="${cls}" href="${escape(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${label.replaceAll('↗', arrowIcon)}</a>` : '';
let projects = [];
let lastProjectTrigger = null;
const dialog = $('#project-dialog');
function bindImageFallbacks(root) {
  root.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
    if (img.closest('.project-image-button')) { const stage=img.closest('.project-image-stage'); stage.classList.add('image-missing'); stage.textContent = img.dataset.title; }
    else img.hidden = true;
  }, { once: true }));
}
function renderProjects() {
  $('#projects').innerHTML = projects.length ? projects.map((p, i) => `
    <article class="project ${p.featured ? 'featured' : ''}" data-accent="${escape(p.accent)}">
      <button class="project-image-button" data-project="${escape(p.id)}" aria-label="Ver detalhes de ${escape(p.title)}">
        <span class="project-window" aria-hidden="true"><span class="window-dots">● ● ●</span><span>${escape(p.title)} / ${p.demo ? 'web app' : 'projeto'}</span><span>${arrowIcon}</span></span>
        <span class="project-image-stage"><span class="project-float">${safeUrl(p.image, true) ? `<img src="${escape(safeUrl(p.image, true))}" alt="${escape(p.imageAlt)}" data-title="${escape(p.title)}" loading="${i === 0 ? 'eager' : 'lazy'}" width="1200" height="720">` : `<span class="image-placeholder">${escape(p.title)}</span>`}</span></span>
        <span class="project-peek" aria-hidden="true">Explorar <span>${arrowIcon}</span></span>
        <span class="project-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>
      </button>
      <div class="project-body">
        ${p.featured ? '<span class="featured-label">PROJETO EM DESTAQUE</span>' : ''}
        <div class="project-meta"><span>${escape(p.category)}</span><span>${escape(p.year)}</span></div>
        <h3>${escape(p.title)}</h3><p>${escape(p.summary)}</p>
        <div class="tags">${tags(p.tags)}</div>
        <div class="project-links"><button data-project="${escape(p.id)}">Ver detalhes <span aria-hidden="true">${arrowIcon}</span></button>${external(p.repository,'GitHub ↗')}</div>
      </div>
    </article>`).join('') : '<p class="error-state">Novos projetos serão compartilhados aqui. Enquanto isso, conheça meu trabalho no GitHub.</p>';
  bindImageFallbacks($('#projects'));
}
function showProject(id) {
  const p = projects.find(p => p.id === id);
  if (!p) return;
  $('#dialog-content').innerHTML = `${safeUrl(p.image, true) ? `<img class="dialog-image" src="${escape(safeUrl(p.image, true))}" alt="${escape(p.imageAlt)}">` : ''}<div class="dialog-copy"><span class="eyebrow">${escape(p.category)}${p.year ? ` / ${escape(p.year)}` : ''}</span><h2 id="dialog-title">${escape(p.title)}</h2><p>${escape(p.description)}</p><div class="tags">${tags(p.tags)}</div><h3>O que desenvolvi</h3><ul>${p.highlights.map(h=>`<li>${escape(h)}</li>`).join('')}</ul>${p.imageNote ? `<p class="image-note">${escape(p.imageNote)}</p>` : ''}<div class="dialog-actions">${external(p.demo,'Acessar aplicação ↗','button primary')}${external(p.repository,'Ver código no GitHub ↗','button')}</div></div>`;
  bindImageFallbacks(dialog);
  if (!dialog.open) { dialog.showModal(); animateDialog(dialog); }
  dialog.scrollTop = 0;
}
function syncHash() { const match = /^#projeto=(.+)$/.exec(location.hash); if (match) { try { showProject(decodeURIComponent(match[1])); } catch {} } else if(dialog.open) dialog.close(); }
document.addEventListener('click', e => {
  const terminalTrigger = e.target.closest('#terminal-output a[href^="#projeto="]');
  if (terminalTrigger) lastProjectTrigger = terminalTrigger;
  const trigger = e.target.closest('[data-project]');
  if (trigger) { lastProjectTrigger=trigger; const hash = `#projeto=${encodeURIComponent(trigger.dataset.project)}`; if(location.hash === hash) showProject(trigger.dataset.project); else location.hash = hash; }
});
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if(e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { if(location.hash.startsWith('#projeto=')) history.replaceState(null,'','#projetos'); if(lastProjectTrigger?.isConnected) lastProjectTrigger.focus({preventScroll:true}); });
window.addEventListener('hashchange', syncHash);
$('#year').textContent = new Date().getFullYear();
async function loadContent() {
  try {
    const response = await fetch('/data/content.json', { cache: 'no-cache' });
    if(!response.ok) throw new Error('Content unavailable');
    const data = await response.json(); const p=data.profile;
    const values={intro:p.intro,about:p.about,focus:p.focus,availability:p.availability,location:`${p.location} · Brasil`,'footer-name':p.shortName,'hero-role':`${p.name} / ${p.role}`};
    Object.entries(values).forEach(([id,text])=>{document.getElementById(id).textContent=text;});
    document.title=`${p.shortName} — ${p.role}`;
    document.querySelectorAll('[data-link]').forEach(a=>{a.href=safeUrl(p[a.dataset.link])||'#contato';});
    $('#email-text').href=`mailto:${p.email}`; $('#email-text').textContent=p.email;
    $('#project-contact').href=`mailto:${p.email}?subject=${encodeURIComponent('Vamos conversar sobre um projeto')}&body=${encodeURIComponent('Olá, Juan!\n\nTenho uma ideia de projeto e gostaria de conversar.\n\nO que preciso:\nPrazo que tenho em mente:\n\nVamos conversar?')}`;
    $('#career-contact').href=`mailto:${p.email}?subject=${encodeURIComponent('Oportunidade de estágio')}`;
    ['#resume','#about-resume'].forEach(s=>{$(s).href=safeUrl(p.resume,true)||'#contato';});
    $('.code-body .code-value').textContent=JSON.stringify(p.shortName);
    projects = data.projects.filter(p=>p.published).sort((a,b)=>Number(b.featured)-Number(a.featured)); renderProjects();
    $('#skills').innerHTML=data.skills.map(s=>`<div class="skill"><h3>${escape(s.title)}</h3><p>${s.items.map(escape).join(' · ')}</p></div>`).join('');
    const x=data.experience, ed=data.education;
    $('#journey').innerHTML=`<article class="journey-item"><span class="small-label">${escape(x.period)}</span><h4>${escape(x.company)}</h4><div class="journey-role">${escape(x.role)}</div><p>${escape(x.description)}</p></article><article class="journey-item"><span class="small-label">${escape(ed.period)}</span><h4>${escape(ed.school)}</h4><div class="journey-role">${escape(ed.course)}</div></article>`;
    $('#certifications').innerHTML=data.certifications.map(c=>`<article class="cert"><h4>${escape(c.title)}</h4><div class="cert-meta"><span>${escape(c.issuer)}</span><span>${escape(c.detail)}</span></div></article>`).join('');
    setTerminalContent(data);
    revealContent();
    syncHash();
  } catch {
    $('#projects').innerHTML='<div class="error-state"><p>Não foi possível carregar os projetos.</p><button class="button" id="retry">Tentar novamente</button> <a href="https://github.com/Pcthelab" target="_blank" rel="noopener">Acessar GitHub </a></div>'.replace('Acessar GitHub ', 'Acessar GitHub ' + arrowIcon);
    $('#retry').addEventListener('click',loadContent);
  }
}
$('#copy-email').addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText($('#email-text').textContent);$('#copy-status').textContent='E-mail copiado. Vamos conversar!';}
  catch {$('#copy-status').textContent='Selecione e copie o endereço acima, ou clique nele para abrir seu e-mail.';}
});
const terminalDisclosure = $('.terminal-disclosure');
terminalDisclosure.addEventListener('click', () => {
  const expanded = terminalDisclosure.getAttribute('aria-expanded') !== 'true';
  terminalDisclosure.setAttribute('aria-expanded', String(expanded));
  terminalDisclosure.querySelector('span').textContent = expanded ? 'Recolher terminal' : 'Explorar terminal interativo';
});
initializeTerminal();
initializeMotion();
loadContent();
