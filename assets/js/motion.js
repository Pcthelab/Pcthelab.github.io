const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const watched = new WeakSet();
const running = new Set();
const ease = 'cubic-bezier(.22,1,.36,1)';
const cardMotion = true;
const visibleCards = new WeakSet();
const presenceObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
}, {threshold:0}) : null;

function animate(element, frames, options, allowCardMotion = false) {
  if((motionQuery.matches && !allowCardMotion) || !element?.animate) return;
  const animation = element.animate(frames, options);
  running.add(animation);
  animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  return animation;
}

const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  let cardIndex = 0;
  for(const entry of entries) {
    if(!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    const element = entry.target;
    if(element.matches('.project')) {
      if(!cardMotion) continue;
      const delay = Math.min(cardIndex++, 3) * 110;
      animate(element, [
        {opacity:0, translate:'0 56px', scale:'.96'},
        {opacity:1, translate:'0 0', scale:'1'}
      ], {duration:950, delay, easing:ease, fill:'backwards'}, true);
      const capture = element.querySelector('.project-image-stage img');
      if(capture) animate(capture, [
        {opacity:.4, clipPath:'inset(0 0 100% 0)'},
        {opacity:1, clipPath:'inset(0 0 0 0)'}
      ], {duration:1000, delay:delay+100, easing:ease, fill:'backwards'}, true);
      continue;
    }
    animate(element, [
      {opacity: 0, transform: 'translateY(30px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 850, easing: ease, delay: Number(element.dataset.revealDelay || 0)});
  }
}, {threshold: .08}) : null;

export function revealContent(root = document) {
  root.querySelectorAll('.project').forEach(element => {
    if(visibleCards.has(element))return;
    visibleCards.add(element);
    if(presenceObserver)presenceObserver.observe(element);else element.classList.add('is-in-view');
  });
  root.querySelectorAll('.section-heading, .project, .about-grid > div, .skill, .journey-item, .cert, .contact > .eyebrow, .contact > h2, .contact-intro, .contact-paths, .contact-links').forEach(element => {
    if(watched.has(element)) return;
    watched.add(element);
    if(observer && (!motionQuery.matches || element.matches('.project'))) observer.observe(element);
  });
}

export function initializeMotion() {
  document.documentElement.dataset.cardMotion = 'on';
  document.querySelectorAll('.title-line > span').forEach((line, index) => {
    animate(line, [{transform:'translateY(110%)',opacity:0},{transform:'translateY(0)',opacity:1}], {duration:1050,delay:100+index*130,easing:ease,fill:'backwards'});
  });
  for(const [selector,delay] of [['.hero-top',0],['.hero-copy > p',370],['.hero-actions',490],['.hero-bottom',650]]) {
    const element=document.querySelector(selector);
    if(element) animate(element,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:800,delay,easing:ease,fill:'backwards'});
  }
  const card=document.querySelector('.developer-card');
  animate(card,[{opacity:0,translate:'0 35px',rotate:'-4deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],{duration:1200,delay:250,easing:ease,fill:'backwards'});
  revealContent();

  const header=document.querySelector('.header');
  const progress=document.querySelector('.reading-progress');
  const sections=[...document.querySelectorAll('main > section[id]')];
  const links=[...document.querySelectorAll('.header a[href^="#"]')];
  let frame=0;
  function updateScroll() {
    frame=0;
    const max=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;
    header.classList.toggle('is-scrolled',scrollY>25);
    let active=sections[0]?.id;
    for(const section of sections) if(section.getBoundingClientRect().top<innerHeight*.42) active=section.id;
    links.forEach(link=>{if(link.hash===`#${active}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  const requestScroll=()=>{if(!frame)frame=requestAnimationFrame(updateScroll);};
  addEventListener('scroll',requestScroll,{passive:true});
  addEventListener('resize',requestScroll,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(requestScroll).observe(document.body);
  updateScroll();

  // Pointer effects are event-driven: no permanent animation loop.
  const hero=document.querySelector('.hero');
  let pointerFrame=0,point;
  hero.addEventListener('pointermove',event=>{
    if(!finePointer.matches||motionQuery.matches||event.pointerType==='touch')return;
    point={x:event.clientX,y:event.clientY};
    if(pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;
      const box=hero.getBoundingClientRect();
      hero.style.setProperty('--spot-x',`${point.x-box.left}px`);
      hero.style.setProperty('--spot-y',`${point.y-box.top}px`);
    });
  },{passive:true});
  card.addEventListener('pointermove',event=>{
    if(!finePointer.matches||motionQuery.matches||event.pointerType==='touch')return;
    const r=card.getBoundingClientRect();
    card.style.setProperty('--tilt-y',`${((event.clientX-r.left)/r.width-.5)*7}deg`);
    card.style.setProperty('--tilt-x',`${((event.clientY-r.top)/r.height-.5)*-7}deg`);
  },{passive:true});
  const resetCard=()=>{card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');};
  card.addEventListener('pointerleave',resetCard);

  const projectGrid = document.querySelector('#projects');
  let projectFrame = 0, projectPoint, activeProject;
  const resetProject = () => {
    cancelAnimationFrame(projectFrame);
    projectFrame = 0;
    if(!activeProject) return;
    activeProject.classList.remove('is-pointer-active');
    for(const property of ['--card-rx','--card-ry','--light-x','--light-y','--image-x','--image-y']) activeProject.style.removeProperty(property);
    activeProject = null;
  };
  projectGrid.addEventListener('pointermove',event=>{
    if(!finePointer.matches||!cardMotion||event.pointerType==='touch')return;
    const project=event.target.closest('.project');
    if(!project){resetProject();return;}
    if(activeProject!==project){resetProject();activeProject=project;}
    projectPoint={x:event.clientX,y:event.clientY};
    if(projectFrame)return;
    projectFrame=requestAnimationFrame(()=>{
      projectFrame=0;
      if(!activeProject)return;
      const r=activeProject.getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(projectPoint.x-r.left)/r.width));
      const y=Math.max(0,Math.min(1,(projectPoint.y-r.top)/r.height));
      activeProject.style.setProperty('--card-rx',`${(y-.5)*-6}deg`);
      activeProject.style.setProperty('--card-ry',`${(x-.5)*7}deg`);
      activeProject.style.setProperty('--image-x',`${(x-.5)*14}px`);
      activeProject.style.setProperty('--image-y',`${(y-.5)*10}px`);
      activeProject.style.setProperty('--light-x',`${x*100}%`);
      activeProject.style.setProperty('--light-y',`${y*100}%`);
      activeProject.classList.add('is-pointer-active');
    });
  },{passive:true});
  projectGrid.addEventListener('pointerleave',resetProject);
  projectGrid.addEventListener('pointercancel',resetProject);
  projectGrid.addEventListener('focusin',resetProject);
  projectGrid.addEventListener('click',resetProject);
  finePointer.addEventListener('change',resetProject);

  motionQuery.addEventListener('change',()=>{
    if(motionQuery.matches){running.forEach(animation=>animation.cancel());observer?.disconnect();resetCard();resetProject();}
  });
  document.addEventListener('visibilitychange',()=>{
    document.documentElement.dataset.pageHidden = String(document.hidden);
    if(document.hidden){running.forEach(animation=>animation.finish());resetProject();}
  });
}

export function animateDialog(dialog) {
  animate(dialog,[{opacity:0,transform:'translateY(22px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:400,easing:ease});
}
