import { createArrowIcon } from './icons.js';
let content = null;
let commandHistory = [];
let historyIndex = 0;
let draft = '';
const $ = selector => document.querySelector(selector);
const commands = ['ajuda', 'whoami', 'projetos', 'stack', 'contato', 'limpar'];

export function setTerminalContent(data) {
  content = data;
  const name = $('.terminal-name');
  if(name) {
    name.replaceChildren(document.createTextNode(data.profile.name));
    const cursor = document.createElement('span');
    cursor.className = 'terminal-mark';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '_';
    name.append(cursor);
  }
}

function paragraph(parent, text, className = '') {
  const element = document.createElement('p');
  element.textContent = text;
  if(className) element.className = className;
  parent.append(element);
  return element;
}

function link(parent, text, href) {
  if(!href.startsWith('#') && !href.startsWith('mailto:')) {
    try { const url = new URL(href); if(url.protocol !== 'https:') return; } catch { return; }
  }
  const element = document.createElement('a');
  element.href = href;
  element.textContent = text.replace(/\s*↗$/, '');
  if(text.endsWith('↗')) element.append(createArrowIcon());
  if(href.startsWith('https:')) {element.target='_blank';element.rel='noopener noreferrer';}
  parent.append(element);
  return element;
}

function execute(raw) {
  const command = raw.trim().toLowerCase();
  if(!command) return;
  const output = $('#terminal-output');
  if(commandHistory.at(-1) !== raw.trim()) commandHistory.push(raw.trim());
  if(commandHistory.length > 30) commandHistory.shift();
  historyIndex = commandHistory.length;
  draft = '';
  $('#terminal-input').value = '';
  document.querySelectorAll('.terminal-shortcuts [data-command]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.command===command || (command==='sobre' && button.dataset.command==='whoami'))));

  if(command === 'limpar' || command === 'clear') {
    output.replaceChildren();
    paragraph(output, 'Terminal limpo.', 'terminal-name');
    paragraph(output, 'Escolha um atalho ou digite um comando para explorar meu trabalho.', 'terminal-hint');
    return;
  }
  const result = document.createElement('div');
  result.className = 'terminal-result';
  paragraph(result, `❯ ${raw.trim()}`, 'terminal-command');
  if(command === 'ajuda' || command === 'help') {
    const descriptions={whoami:'Quem está por trás',projetos:'Trabalhos selecionados',stack:'Tecnologias na prática',contato:'Freelance e oportunidades',limpar:'Limpar este terminal'};
    Object.entries(descriptions).forEach(([command,description])=>{
      const button=document.createElement('button');button.type='button';button.className='terminal-help-command';button.dataset.command=command;
      const name=document.createElement('strong');name.textContent=command;
      const detail=document.createElement('span');detail.textContent=description;
      button.append(name,detail);result.append(button);
    });
    paragraph(result, 'Clique em um comando. No teclado: Tab completa, ↑ ↓ percorrem o histórico e Esc limpa o campo.', 'terminal-result-note');
  } else if(!commands.includes(command) && command !== 'sobre') {
    paragraph(result, 'Comando não encontrado. Digite ajuda para ver as opções.');
  } else if(!content) {
    paragraph(result, 'O conteúdo ainda não foi carregado. Você pode navegar pelos links da página.');
  } else if(command === 'whoami' || command === 'sobre') {
    paragraph(result, content.profile.name);
    paragraph(result, content.profile.focus);
    link(result, 'Conhecer minha trajetória ↗', '#trajetoria');
  } else if(command === 'projetos') {
    const projects=content.projects.filter(project=>project.published).sort((a,b)=>Number(b.featured)-Number(a.featured));
    if(!projects.length) paragraph(result, 'Os próximos projetos aparecerão aqui.');
    projects.forEach(project=>{
      const anchor=link(result,project.title,`#projeto=${encodeURIComponent(project.id)}`);
      const label=document.createElement('span');label.textContent=project.title;
      const detail=document.createElement('small');detail.textContent=project.featured?'Projeto principal · '+project.category:project.category;label.append(detail);
      const arrow=createArrowIcon();
      anchor.replaceChildren(label,arrow);
    });
    paragraph(result, 'Selecione um projeto para ver o que desenvolvi.', 'terminal-result-note');
  } else if(command === 'stack') {
    content.skills.forEach(group=>{
      const title=document.createElement('h3');title.textContent=group.title;result.append(title);
      const tags=document.createElement('div');tags.className='terminal-tags';
      group.items.forEach(item=>{const tag=document.createElement('span');tag.textContent=item;tags.append(tag);});result.append(tags);
    });
    paragraph(result, 'C#/.NET: contato pontual no exercício CashFlow.', 'terminal-result-note');
  } else if(command === 'contato') {
    link(result, 'Tenho um projeto em mente ↗', $('#project-contact').href);
    link(result, 'Tenho uma oportunidade ↗', $('#career-contact').href);
    link(result, 'LinkedIn ↗', content.profile.linkedin);
    link(result, 'GitHub ↗', content.profile.github);
  }
  output.replaceChildren(result);
  output.scrollTop = 0;
}

export function initializeTerminal() {
  document.querySelectorAll('.terminal-view').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('.terminal-view').forEach(view=>{
      const active=view===button;
      view.setAttribute('aria-pressed',String(active));
      document.getElementById(view.dataset.view).hidden=!active;
    });
  }));
  $('#terminal-form').addEventListener('submit',event=>{event.preventDefault();execute($('#terminal-input').value);});
  $('.developer-card').addEventListener('click',event=>{const button=event.target.closest('[data-command]');if(button)execute(button.dataset.command);});
  $('#terminal-input').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.target.value='';draft='';return;}
    if(event.key==='Tab' && !event.shiftKey && event.target.value.trim()){
      const matches=commands.filter(command=>command.startsWith(event.target.value.trim().toLowerCase()));
      if(matches.length===1 && matches[0]!==event.target.value.trim()){event.preventDefault();event.target.value=matches[0];return;}
    }
    if(!['ArrowUp','ArrowDown'].includes(event.key)||!commandHistory.length)return;
    event.preventDefault();
    if(historyIndex===commandHistory.length)draft=event.target.value;
    historyIndex=Math.max(0,Math.min(commandHistory.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
    event.target.value=commandHistory[historyIndex]??draft;
    event.target.setSelectionRange(event.target.value.length,event.target.value.length);
  });
}
