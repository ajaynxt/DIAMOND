import {slug, mergeMenu, displayPrice} from './menu-v91-core.js?v=108.0';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const icon=name=>{const n=(name||'').toLowerCase();let p='';
if(/coffee/.test(n))p='<path d="M6 8h10v7a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>';
else if(/beverage|shake/.test(n))p='<path d="M8 4h8l-1 15H9z"/><path d="M10 8h4M13 4l3-2"/>';
else if(/pizza/.test(n))p='<path d="M5 19 12 4l7 15z"/><path d="M9 14h6"/><circle cx="12" cy="10" r="1"/><circle cx="15" cy="15" r="1"/>';
else if(/cake|pastry|sweet/.test(n))p='<path d="M5 11h14v8H5z"/><path d="M7 11V8h10v3M9 8V6m6 2V6M9 5h.01M15 5h.01"/>';
else if(/bakery/.test(n))p='<path d="M5 14c0-4 3-7 7-7s7 3 7 7v5H5z"/><path d="M8 12c1-2 2-3 4-3m0 3c1-2 2-3 4-3"/>';
else if(/sandwich|burger|continental/.test(n))p='<path d="M5 11c1-4 3-6 7-6s6 2 7 6H5zM5 13h14M6 16h12M7 19h10"/>';
else if(/tandoor|north indian/.test(n))p='<path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-3 2-5 4-7 0 3 1 4 2 5 1-3 0-5-1-8z"/>';
else if(/pasta|chinese/.test(n))p='<path d="M5 10h14M7 10c0 6 2 9 5 9s5-3 5-9M8 6c1 1 1 2 0 3m4-4c1 1 1 2 0 3m4-2c1 1 1 2 0 3"/>';
else if(/rice|south indian|special meal/.test(n))p='<path d="M5 12h14c0 5-3 7-7 7s-7-2-7-7z"/><path d="M7 10c1-3 3-4 5-4s4 1 5 4"/>';
else if(/soup/.test(n))p='<path d="M5 11h14c0 5-3 8-7 8s-7-3-7-8z"/><path d="M8 7c0-2 1-2 1-4m4 4c0-2 1-2 1-4"/>';
else p='<path d="M6 7h12v12H6z"/><path d="M9 7V5h6v2M9 11h6M9 15h6"/>';
return `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`};

const state={base:{},menu:{},query:'',cat:'all'};
const catsEl=$('#dm91Cats'),results=$('#dm91Results'),search=$('#dm91Search');

function photo(cat,x){
  const raw=x.imageUrl||x.image||x.photo||x.imagePath||'';
  if(raw){
    let src=String(raw);
    if(src.startsWith('/')) src=src.slice(1);
    else if(!/^https?:|^data:|^blob:/.test(src) && !src.startsWith('assets/')) src='assets/'+src.replace(/^\/+/, '');
    return `<span class="dm91-photoFrame dm91-realPhoto"><img class="dm91-thumb" loading="lazy" decoding="async" src="${esc(src)}" alt=""></span>`;
  }
  return `<span class="dm91-photoFrame dm91-itemCategoryIcon" aria-hidden="true">${icon(cat)}</span>`;
}

function card(cat,x){
  const d=x.description||x.desc||'';
  const id=x.id||slug(x.name);
  const price=displayPrice(x,cat);
  return `<article class="dm91-item" data-item-id="${esc(id)}" data-category="${esc(cat)}" data-live-photo="0">${photo(cat,x)}<div class="dm91-copy"><h3 class="dm91-name" data-menu-field="name">${esc(x.name)}</h3>${d?`<p class="dm91-desc" data-menu-field="description">${esc(d)}</p>`:''}</div>${price?`<strong class="dm91-price" data-menu-field="price">${esc(price)}</strong>`:''}<a class="dm91-order dm91-itemOrder" href="https://uen.io/diamondrestaurant" target="_blank" rel="noopener noreferrer" aria-label="Order ${esc(x.name)} online">Order</a></article>`;
}

function nav(){
  const cats=Object.keys(state.menu);
  catsEl.innerHTML=`<button class="dm91-cat ${state.cat==='all'?'active':''}" data-cat="all"><span class="dm91-catIcon">${icon('menu')}</span><span>All</span></button>`+
    cats.map(c=>`<button class="dm91-cat ${state.cat===c?'active':''}" data-cat="${esc(c)}"><span class="dm91-catIcon">${icon(c)}</span><span>${esc(c)}</span></button>`).join('');
  $$('.dm91-cat',catsEl).forEach(b=>b.onclick=()=>{
    state.cat=b.dataset.cat;nav();draw();
    if(state.cat!=='all')setTimeout(()=>$('#'+slug(state.cat))?.scrollIntoView({behavior:'smooth',block:'start'}),20);
  });
}

function draw(){
  const q=state.query.toLowerCase().trim();let total=0;const blocks=[];
  for(const [cat,items] of Object.entries(state.menu)){
    if(state.cat!=='all'&&state.cat!==cat)continue;
    const show=items.filter(x=>`${cat} ${x.name||''} ${displayPrice(x,cat)} ${x.description||x.desc||''}`.toLowerCase().includes(q));
    if(!show.length)continue;
    total+=show.length;
    blocks.push(`<section class="dm91-section" id="${slug(cat)}" data-category="${esc(cat)}"><div class="dm91-head"><div class="dm91-titleWrap"><span class="dm91-miniIcon">${icon(cat)}</span><h2>${esc(cat)}</h2></div><span class="dm91-count">${show.length} items</span></div><div class="dm91-grid">${show.map(x=>card(cat,x)).join('')}</div></section>`);
  }
  results.innerHTML=total?blocks.join(''):'<div class="dm91-empty">No matching item found.</div>';
}

async function fetchIndiaLiveMenu(){
  try{
    const {firebaseConfig}=await import('./firebase-config.js');
    if(firebaseConfig?.projectId!=='diamondrestaurants-india') throw new Error('Blocked non-India Firebase project');
    const {initializeApp,getApps}=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const {getFirestore,collection,getDocs}=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
    const db=getFirestore(app);
    const snap=await getDocs(collection(db,'menuItems'));
    const live=[];snap.forEach(d=>live.push({id:d.id,...d.data()}));
    return live;
  }catch(e){
    console.warn('Menu live sync skipped:',e?.message||e);
    return [];
  }
}

async function syncLive(){
  const live=await fetchIndiaLiveMenu();
  if(!live.length)return;
  const currentCat=state.cat;
  state.menu=mergeMenu(state.base,live);
  if(currentCat!=='all'&&!state.menu[currentCat])state.cat='all';
  nav();draw();
}

let timer;search?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{state.query=search.value;draw()},90)});
$('#hamb')?.addEventListener('click',()=>$('#navLinks')?.classList.toggle('open'));
const topBtn=$('#dm91Top');addEventListener('scroll',()=>topBtn?.classList.toggle('show',scrollY>500),{passive:true});topBtn?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

(async()=>{
  try{
    const r=await fetch('data/menu-v91.json?v=108.0',{cache:'force-cache'});
    if(!r.ok)throw new Error('menu '+r.status);
    state.base=await r.json();state.menu=mergeMenu(state.base,[]);nav();draw();
    if(location.hash){const id=location.hash.slice(1);const match=Object.keys(state.menu).find(c=>slug(c)===id);if(match){state.cat=match;nav();draw();setTimeout(()=>$('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'}),40)}}
    const editor=new URLSearchParams(location.search).get('editor')==='1';
    const localDev=location.hostname==='127.0.0.1'||location.hostname==='localhost';
    if(!localDev){
      if(editor) syncLive();
      else if('requestIdleCallback' in window) requestIdleCallback(()=>syncLive(),{timeout:1000});
      else setTimeout(syncLive,350);
    }
  }catch(e){results.innerHTML='<div class="dm91-empty">Menu could not load. Please refresh once.</div>';console.error(e)}
})();
