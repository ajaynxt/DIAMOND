
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const asset = img => { if(!img) return 'https://diamondrestaurants.com/assets/optimized-v1/diamond-logo-hq-white-card-v64.webp'; img=String(img); if(img.startsWith('http') || img.startsWith('data:') || img.startsWith('blob:')) return img; if(img.startsWith('/')) return 'https://diamondrestaurants.com'+img; if(img.startsWith('assets/')) return 'https://diamondrestaurants.com/'+img; if(img.includes('/')) return `https://diamondrestaurants.com/assets/${img}`; return `https://diamondrestaurants.com/assets/images/${img}`; };
const slug = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const esc = s => String(s||'').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const setText = (id,v) => { const el=$(id); if(el) el.textContent=v||''; };
const setHrefText = (id,text,href) => { const el=$(id); if(!el) return; el.textContent=text||el.textContent; if(href) el.href=href; };


async function renderOrderMenuLinks(){
  const drop = document.getElementById('orderDropdown');
  if(!drop) return;
  const fallback = [
    {name:'Food',type:'Food',url:'https://diamondrestaurants.uengage.in/',description:'Order Online',sort:10,visible:true},
    {name:'Android App',type:'Grocery App',url:'https://play.google.com/store/apps/details?id=com.app.uengage.diamondrestaurant',description:'Android app link',sort:20,visible:true},
    {name:'iPhone Link',type:'Grocery App',url:'https://apps.apple.com/us/app/diamond-restaurants/id6743344052',description:'iPhone app link',sort:30,visible:true},
    {name:'Grocery Website',type:'Grocery Website',url:'https://diamondrestaurants.uengage.in/',description:'Website',sort:40,visible:true}
  ];
  const live = await liveCollection('appLinks');
  const links = (live && live.length ? live : fallback).filter(x=>x.visible!==false);
  const food = links.find(x=>(x.type||'').toLowerCase().includes('food')) || fallback[0];
  const groceries = links.filter(x=>String(x.type||'').toLowerCase().includes('grocery')).slice(0,3);
  const g = groceries.length ? groceries : fallback.slice(1);
  const a = (x,label) => `<a href="${esc(x.url||'#')}" target="_blank" rel="noopener">${esc(label||x.name||'Open')}</a>`;
  drop.innerHTML = `<a class="orderItem orderFood" href="${esc(food.url||'#')}" target="_blank" rel="noopener"><strong>Food</strong><span>${esc(food.description||'Order Online')}</span></a>
    <div class="orderGroup"><button class="orderItem orderGroceryToggle" type="button"><strong>Grocery</strong><span>Choose app or website</span></button>
      <div class="grocerySubmenu">${g.map(x=>a(x,x.name)).join('')}</div></div>`;
}

function initOrderMenu(){ /* V98: Order Now is a direct link; no dropdown/panel. */ }


async function json(path){ const r = await fetch(path); return await r.json(); }
let __liveItemsPromise = null;

async function liveItems(){
  if(__liveItemsPromise) return __liveItemsPromise;

  __liveItemsPromise = (async()=>{
    try{
      const {firebaseConfig} = await import('./firebase-config.js');
      if(!firebaseConfig?.apiKey || firebaseConfig.apiKey.includes('PASTE_')) return null;
      const {initializeApp, getApps} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const {getFirestore, collection, getDocs} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const snap = await getDocs(collection(db,'menuItems'));
      const arr=[];
      snap.forEach(d=>{
        const x=d.data()||{};
        if(x.visible!==false) arr.push({id:d.id,...x});
      });
      arr.sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0) || String(a.name||a.id||'').localeCompare(String(b.name||b.id||'')));
      return arr.length ? arr : null;
    }catch(e){
      return null;
    }
  })();

  return __liveItemsPromise;
}

async function liveCollection(name){
  try{
    const {firebaseConfig} = await import('./firebase-config.js');
    if(!firebaseConfig?.apiKey || firebaseConfig.apiKey.includes('PASTE_')) return null;
    const {initializeApp, getApps} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const {getFirestore, collection, getDocs} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db,name));
    const arr=[]; snap.forEach(d=>{const x=d.data()||{}; if(x.visible!==false) arr.push({id:d.id,...x});});
    arr.sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0) || String(a.name||a.title||a.id||'').localeCompare(String(b.name||b.title||b.id||'')));
    return arr.length ? arr : null;
  }catch(e){ return null; }
}

async function liveDoc(colName, docId){
  try{
    const {firebaseConfig} = await import('./firebase-config.js');
    if(!firebaseConfig?.apiKey || firebaseConfig.apiKey.includes('PASTE_')) return null;
    const {initializeApp, getApps} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const {getFirestore, doc, getDoc} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDoc(doc(db,colName,docId));
    return snap.exists() ? {id:snap.id, ...snap.data()} : null;
  }catch(e){ return null; }
}

let __linkedMenuCache = null;
async function menuLookupForLinks(){
  if(__linkedMenuCache) return __linkedMenuCache;
  const arr = await liveItems();
  const map = new Map();
  (arr||[]).forEach(x=>{
    const id = String(x.id || x.itemId || '');
    if(id) map.set(id, x);
    const nameKey = slug(x.name || x.title || '');
    if(nameKey) map.set(nameKey, x);
  });
  __linkedMenuCache = map;
  return map;
}

async function resolveLinkedCards(cards){
  const list = Array.isArray(cards) ? cards : [];
  if(!list.some(x=>x && (x.linkedItemId || x.menuItemId || x.itemId))) return list;
  const map = await menuLookupForLinks();
  return list.map(c=>{
    if(!c) return c;
    const key = String(c.linkedItemId || c.menuItemId || c.itemId || '');
    const item = map.get(key) || map.get(slug(key));
    if(!item) return c;
    const auto = c.useLinkedItem === true || c.autoSync === true;
    const itemImage = item.imageUrl || item.image || item.img || '';
    const customImage = c.imageUrl || c.image || c.img || '';
    const imageOverride = c.imageOverride === true || c.customImage === true;
    const out = {...c};
    if(auto){
      out.name = item.name || item.title || c.name || c.title || '';
      out.title = item.name || item.title || c.title || c.name || '';
      out.price = item.price || item.smPrice || item.stPrice || c.price || '';
      out.category = item.category || item.section || c.category || '';
      out.href = c.href || `menu.html#${slug(item.category || item.section || 'menu')}`;
      out.desc = c.desc || c.description || item.desc || item.description || '';
      out.description = out.desc;
      out.imageUrl = imageOverride ? customImage : (itemImage || customImage);
      out.image = out.imageUrl;
    }else{
      out.imageUrl = customImage || itemImage;
      out.image = out.imageUrl;
    }
    return out;
  });
}

async function applySectionOverrides(){
  const [deliveryRight, cakeLogo, contact] = await Promise.all([
    liveDoc('siteSections','delivery-right'),
    liveDoc('siteSections','cakeWheel'),
    liveDoc('siteSections','contactInfo')
  ]);

  const delivery = deliveryRight || await liveDoc('siteSections','delivery');
  const deliveryImg = document.querySelector('.deliveryPhotoCard img');
  if(delivery?.imageUrl && deliveryImg){ deliveryImg.src = asset(delivery.imageUrl); deliveryImg.setAttribute('data-edit-source','siteSections/delivery-right'); }

  // V89: Keep the approved static Diamond cake-center artwork.
  // Do not replace it with legacy siteSections/cakeWheel data.
  const cakeLogoImg = document.querySelector('.centerBadge img');

  if(contact){
    const setField=(field,value)=>document.querySelectorAll(`[data-edit-field="${field}"] span,[data-edit-field="${field}"] a`).forEach(el=>{ if(value) el.textContent=value; });
    setField('company', contact.company || contact.unit || 'Srijan Bhog Companies Pvt. Ltd.');
    setField('branch-1', contact.branch1 || 'B.C.S. New Shimla-9 (HP)');
    setField('branch-1-phone', contact.branch1Phone || '0177-2670121, 2670125');
    setField('branch-2', contact.branch2 || 'Main Road, Shoghi Bazaar, Shimla (HP)');
    setField('branch-2-phone', contact.branch2Phone || '0177-2661111');
    document.querySelectorAll('[data-edit-field="email"] a,[data-edit-field="email"] span').forEach(el=>{ if(contact.email){ el.textContent=contact.email; if(el.tagName==='A') el.href='mailto:'+contact.email; } });
  }
}

async function homepageSettings(){
  const defaults={
    heroLine:'SINCE 2002 • SHIMLA',
    heroTitle:'You deserve all\nthe sweetness.',
    heroDesc:'Freshly baked every day.\nTraditional sweets crafted with love.\nA restaurant that feels like home.',
    primaryText:'ORDER ONLINE', primaryLink:'https://diamondrestaurants.uengage.in/',
    secondaryText:'VIEW MENU', secondaryLink:'menu.html',
    statOneNum:'Since', statOneLabel:'2002', statTwoNum:'Fresh', statTwoLabel:'Menu Daily', statThreeNum:'All-in-One', statThreeLabel:'Bakery • Sweets • Chaat'
  };
  try{
    const {firebaseConfig} = await import('./firebase-config.js');
    if(!firebaseConfig?.apiKey || firebaseConfig.apiKey.includes('PASTE_')) return defaults;
    const {initializeApp, getApps} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const {getFirestore, doc, getDoc} = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDoc(doc(db,'siteSettings','homepage'));
    if(!snap.exists()) return defaults;
    const d=snap.data()||{};
    return {...defaults,
      heroLine:d.heroLine||defaults.heroLine,
      heroTitle:d.heroTitle||defaults.heroTitle,
      heroDesc:d.heroDesc||defaults.heroDesc,
      primaryText:d.primaryText||d.buttonPrimaryText||defaults.primaryText,
      primaryLink:d.primaryLink||d.buttonPrimaryLink||defaults.primaryLink,
      secondaryText:d.secondaryText||d.buttonSecondaryText||defaults.secondaryText,
      secondaryLink:d.secondaryLink||d.buttonSecondaryLink||defaults.secondaryLink,
      statOneNum:d.statOneNum||d.stat1Num||defaults.statOneNum,
      statOneLabel:d.statOneLabel||d.stat1Label||defaults.statOneLabel,
      statTwoNum:d.statTwoNum||d.stat2Num||defaults.statTwoNum,
      statTwoLabel:d.statTwoLabel||d.stat2Label||defaults.statTwoLabel,
      statThreeNum:d.statThreeNum||d.stat3Num||defaults.statThreeNum,
      statThreeLabel:d.statThreeLabel||d.stat3Label||defaults.statThreeLabel
    };
  }catch(e){ return defaults; }
}
function renderFixedHeroText(settings){
  setText('homeHeroLine', settings.heroLine);
  const h=$('#homeHeroTitle');
  if(h){
    let title=(settings.heroTitle||'').replace(/\\n/g,'\n');
    if(!title.includes('\n') && title.toLowerCase().includes('the sweetness')) title=title.replace(/the sweetness\.?/i,'the\nsweetness.');
    const html=esc(title).replace(/\n/g,'<br>');
    h.innerHTML=html.replace(/sweetness\.?/i,'<span>sweetness.</span>');
  }
  setText('homeHeroDesc', settings.heroDesc);
  setHrefText('homeHeroPrimary', settings.primaryText, settings.primaryLink);
  setHrefText('homeHeroSecondary', settings.secondaryText, settings.secondaryLink);
  setText('homeStatOneNum', settings.statOneNum); setText('homeStatOneLabel', settings.statOneLabel);
  setText('homeStatTwoNum', settings.statTwoNum); setText('homeStatTwoLabel', settings.statTwoLabel);
  setText('homeStatThreeNum', settings.statThreeNum); setText('homeStatThreeLabel', settings.statThreeLabel);
}
async function homeSlidesData(){
  // V53: Admin home slides are allowed. Uploads are 4:3 and shown without cutting.
  const fallback = await json('data/home-slides.json').catch(()=>[
    {imageUrl:'assets/home-slides/home-v30-01-brownie-pack.webp', sort:10, visible:true, homeSet:'v51-default'},
    {imageUrl:'assets/home-slides/home-v30-02-cookie-plate.webp?v=89-clean1', sort:20, visible:true, homeSet:'v51-default'}
  ]);
  return fallback.filter(x=>x.visible!==false).sort((a,b)=>(a.sort||0)-(b.sort||0));
}
function heroSrc(img){
  if(String(img||'').includes('home-v30-01-brownie-pack.webp')){
    return 'assets/home-slides/home-v30-01-brownie-pack.webp';
  }
  if(!img) return 'assets/home-slides/home-v30-01-brownie-pack.webp';
  if(img.startsWith('http') || img.startsWith('data:') || img.startsWith('blob:') || img.startsWith('assets/')) return img;
  if(img.includes('/')) return `assets/${img}`;
  return `assets/home-slides/${img}`;
}
async function renderHomeSlideHero(){
  const stack=$('#homeSlideStack'), dots=$('#homeSlideDots');
  if(!stack || !dots) return;
  let slides=(await json("data/home-slides.json").catch(()=>[])).filter(x=>x.visible!==false && (x.imageUrl||x.image)).sort((a,b)=>(a.sort||0)-(b.sort||0));
  const loadLiveHeroSettings=()=>homepageSettings().then(renderFixedHeroText).catch(()=>{});
  const scheduleHeroSettings=()=>setTimeout(loadLiveHeroSettings,1400);
  if(document.readyState==='complete'){
    scheduleHeroSettings();
  }else{
    window.addEventListener('load',scheduleHeroSettings,{once:true});
  }
  if(!slides.length) return;
  let active=0, timer;
  function draw(){
    stack.innerHTML=slides.map((x,i)=>`<article class="homeSlide ${i===active?'active':''}">
        <img ${i===active?'fetchpriority="high"':'loading="lazy"'} decoding="async" src="${heroSrc(x.imageUrl||x.image)}" alt="${esc(x.title||'Diamond Restaurants home slide')}" onerror="this.src='assets/home-slides/home-v30-01-brownie-pack.webp'">
      </article>`).join('');
    dots.innerHTML=slides.map((_,i)=>`<button class="${i===active?'active':''}" aria-label="Slide ${i+1}"></button>`).join('');
    dots.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{active=i;draw();restart();});
    // Next slide preload first paint ke baad hoga.
  }
  function next(){active=(active+1)%slides.length;draw();}
  function prev(){active=(active-1+slides.length)%slides.length;draw();}
  function restart(){clearInterval(timer); timer=setInterval(next,4300);}
  $('#homeSlideNext')?.addEventListener('click',()=>{next();restart();});
  $('#homeSlidePrev')?.addEventListener('click',()=>{prev();restart();});
  draw(); restart();
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) restart(); },{passive:true});

  const preloadNextSlide=()=>{
    if(slides.length<2) return;
    const k=(active+1)%slides.length;
    const im=new Image();
    im.decoding='async';
    im.fetchPriority='low';
    im.src=heroSrc(slides[k].imageUrl||slides[k].image);
  };

  if(document.readyState==='complete'){
    setTimeout(preloadNextSlide,1200);
  }else{
    window.addEventListener('load',()=>setTimeout(preloadNextSlide,1200),{once:true});
  }

  const refreshLiveSlides=async()=>{
    try{
      const live=await liveCollection('homeSlides');
      const fresh=(live||[])
        .filter(x=>x.visible!==false && (x.imageUrl||x.image))
        .sort((a,b)=>(a.sort||0)-(b.sort||0));

      if(fresh.length){
        const recoveredLocal = slides.filter(x =>
          String(x.imageUrl||x.image||'').includes('assets/recovered-admin/')
        );

        const liveHasRecovered = recoveredLocal.length === 0 || recoveredLocal.every(local =>
          fresh.some(x =>
            String(x.id||'') === String(local.id||'') ||
            String(x.imageUrl||x.image||'').includes(
              String(local.id||'') + '.webp'
            )
          )
        );

        // Migration safety:
        // India Firestore currently misses recovered admin slides.
        // Keep the recovered local set until those docs exist in India.
        if(!liveHasRecovered) return;

        const currentKey=slides.map(x=>x.imageUrl||x.image||'').join('|');
        const freshKey=fresh.map(x=>x.imageUrl||x.image||'').join('|');

        if(currentKey!==freshKey){
          slides=fresh;
          active=Math.min(active,slides.length-1);
        }
      }
    }catch(e){}
  };

  const scheduleLiveSlides=()=>setTimeout(refreshLiveSlides,1800);
  if(document.readyState==='complete'){
    scheduleLiveSlides();
  }else{
    window.addEventListener('load',scheduleLiveSlides,{once:true});
  }
}

async function menuObject(){
  const live = await liveItems();
  if(live && live.length){ return live.reduce((o,x)=>{ const c=x.category||x.section||'Menu'; (o[c] ||= []).push(x); return o;},{}); }
  try{ return await json('data/menu.json'); }catch(e){}
  return {};
}

function mergeRowsByKey(defaults, liveRows){
  const base = Array.isArray(defaults) ? defaults.map((x,i)=>({...x, id:x.id||slug(x.name||x.title||'item-'+i), sort:x.sort ?? (i+1)*10})) : [];
  const live = Array.isArray(liveRows) ? liveRows : [];
  const out = [...base];
  const keyOf = x => slug(x.id || x.name || x.title || '');
  live.forEach(row=>{
    const k = keyOf(row);
    const idx = out.findIndex(x => keyOf(x) === k);
    if(idx >= 0) out[idx] = {...out[idx], ...row};
    else out.push(row);
  });
  return out.filter(x=>x.visible!==false).sort((a,b)=>(a.sort||0)-(b.sort||0));
}

function flatten(menu){ return Object.entries(menu).flatMap(([category,items])=>items.map((x,i)=>({...x, category, sort:x.sort??i*10}))); }

const mobileNavBtn = $('#hamb');
const mobileNavLinks = $('#navLinks');
const mobileNavBackdrop = $('#mobileNavBackdrop');
function setMobileNav(open){
  mobileNavLinks?.classList.toggle('open', open);
  mobileNavBackdrop?.classList.toggle('show', open);
  mobileNavBtn?.classList.toggle('isOpen', open);
  mobileNavBtn?.setAttribute('aria-expanded', String(open));
  mobileNavBtn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('mobileMenuOpen', open);
}
mobileNavBtn?.addEventListener('click',()=>setMobileNav(!mobileNavLinks?.classList.contains('open')));
mobileNavBackdrop?.addEventListener('click',()=>setMobileNav(false));
mobileNavLinks?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMobileNav(false)));
document.addEventListener('keydown',e=>{ if(e.key==='Escape') setMobileNav(false); });

const categoryDefaults = [
  {name:'Sweets', desc:'Traditional mithai, premium sweets and fresh celebration favourites', href:'menu.html#sweets', image:'menu-sweets.webp'},
  {name:'Bakery', desc:'Fresh breads, cookies, pastry and baked favourites', href:'menu.html#bakery', image:'menu-bakery.webp'},
  {name:'Restaurant', desc:'Snacks, meals, Chinese, South Indian and tandoor favourites', href:'menu.html#special-meals', image:'menu-restaurant.webp'},
  {name:'Mega Store', desc:'Open Diamond Mega Store portal and app links', href:'app.html', image:'assets/optimized-v1/diamond-full-logo-current-lossless.webp'}
];
async function renderCategories(){
  const rail=$('#categoryRail'); if(!rail) return;
  const defaults = await json('data/categories.json').catch(()=>categoryDefaults);
  const live = await liveCollection('homeCategories');
  let cats = mergeRowsByKey(defaults || categoryDefaults, live);
  cats = await resolveLinkedCards(cats);
  rail.innerHTML = cats.map(c=>{
    const name=c.name||c.title||'Category';
    const img=c.imageUrl||c.image||(slug(name).includes('mega')?'mega-store-shopping-circle-v81.webp':'assets/optimized-v1/diamond-logo-hq-white-card-v64.webp');
    return `<a class="catPill cat-${slug(name)}" href="${c.href||'menu.html'}" data-edit-item="${name}" data-linked-item="${c.linkedItemId||''}"><div class="imgCircle"><img data-edit-field="category-photo" loading="lazy" decoding="async" src="${asset(img)}" alt="${name}" onerror="this.src='assets/optimized-v1/diamond-logo-hq-white-card-v64.webp'"></div><h3>${name}</h3><p>${c.desc||c.description||''}</p><span>Explore</span></a>`;
  }).join('');
  $('#catLeft')?.addEventListener('click',()=>rail.scrollBy({left:-240,behavior:'smooth'}));
  $('#catRight')?.addEventListener('click',()=>rail.scrollBy({left:240,behavior:'smooth'}));
}
function renderHeroSlides(){
  const stack=$('#heroSlideStack'), dots=$('#heroSlideDots'); if(!stack || !dots) return;
  const slides=[
    {title:'Life is as Sweet as it Can Be', tag:'Fresh sweets, cakes and moments from Diamond.', image:'hero-slides/hero-sweets-01.webp', accent:'gold'},
    {title:'Signature Cakes for Celebrations', tag:'Fresh cakes crafted for every special moment.', image:'hero-slides/hero-cake-01.webp', accent:'maroon'},
    {title:'Restaurant Favourites', tag:'Premium vegetarian meals and snacks.', image:'images/meal-special.webp', accent:'gold'},
    {title:'Fresh Bakery Everyday', tag:'Cookies, muffins, breads and baked treats.', image:'menu/bakery/muffin-mix-fruit.webp', accent:'maroon'}
  ];
  let active=0, timer;
  function src(path){ return path.startsWith('http') || path.startsWith('assets/') ? path : `assets/${path}`; }
  function draw(){
    stack.innerHTML=slides.map((x,i)=>`<article class="heroSlideCard editorialCard ${i===active?'active':''} accent-${x.accent}"><img class="heroRealPhoto" ${i===active?'fetchpriority="high"':'loading="lazy"'} decoding="async" src="${src(x.image)}" alt="${x.title}" onerror="this.src='assets/hero-slides/hero-sweets-01.webp'"><div class="editorialText"><h2>${x.title}</h2><p>${x.tag}</p></div></article>`).join('');
    dots.innerHTML=slides.map((_,i)=>`<button class="${i===active?'active':''}" aria-label="Hero slide ${i+1}"></button>`).join('');
    dots.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{active=i; draw(); restart();});
    [active,(active+1)%slides.length].forEach(k=>{ const im=new Image(); im.src=src(slides[k].image); });
  }
  function next(){active=(active+1)%slides.length; draw();}
  function prev(){active=(active-1+slides.length)%slides.length; draw();}
  function restart(){clearInterval(timer); timer=setInterval(next,3800);}
  $('#heroNext')?.addEventListener('click',()=>{next();restart();});
  $('#heroPrev')?.addEventListener('click',()=>{prev();restart();});
  draw(); restart();
}

// Cake wheel is intentionally locked to the approved artwork in public/assets/images/.
// Do not auto-sync cake names/images from Firestore/admin records. The filename
// in the image folder is the source of truth for the photo and displayed cake name.
async function renderCakeOrbit(){
  const orbit=$('#cakeOrbit'); if(!orbit) return;
  const approvedDefaults=[
    {name:'Mango', image:'cake-mango.webp', price:'SM ₹490 / ST ₹1050'},
    {name:'Pineapple', image:'cake-pineapple.webp', price:'SM ₹490 / ST ₹930'},
    {name:'Vanilla Choco Chip', image:'cake-vanilla.webp', price:'SM ₹500 / ST ₹1150'},
    {name:'Strawberry', image:'cake-strawberry.webp', price:'SM ₹550 / ST ₹1150'},
    {name:'Butterscotch', image:'cake-butterscotch.webp', price:'SM ₹550 / ST ₹1150'},
    {name:'Black Forest', image:'cake-black.webp', price:'SM ₹560 / ST ₹1150'},
    {name:'White Forest', image:'cake-white.webp', price:'SM ₹560 / ST ₹880'},
    {name:'Choco Truffle', image:'cake-truffle.webp', price:'SM ₹570 / ST ₹1150'},
    {name:'Choco Chip', image:'cake-chip.webp', price:'SM ₹590 / ST ₹1150'},
    {name:'Red Velvet', image:'cake-red.webp', price:'SM ₹599 / ST ₹1150'},
    {name:'Blueberry', image:'cake-blue.webp', price:'SM ₹605 / ST ₹1150'},
    {name:'Mix Fruit', image:'cake-mix.webp', price:'SM ₹530 / ST ₹1050'}
  ];
  const approvedNames=new Set(approvedDefaults.map(x=>x.image));
  let live=[];
  try{ live=await liveCollection('cakeWheelSettings') || []; }catch(e){ live=[]; }
  const bySlot=new Map((live||[]).map((x,i)=>[String(x.id||x.slot||('cake-'+(i+1))),x]));
  const approved=approvedDefaults.map((d,i)=>{
    const x=bySlot.get('cake-'+(i+1)) || bySlot.get(String(i+1)) || {};
    const image=approvedNames.has(String(x.image||'')) ? String(x.image) : d.image;
    return {...d,name:String(x.name||d.name),price:String(x.price||d.price),image,category:'Cakes',sort:(i+1)*10};
  });

  orbit.querySelectorAll('.cakeNode').forEach(n=>n.remove());
  let active=0; let timer;
  const dots=$('#cakeDots');
  function draw(){
    orbit.querySelectorAll('.cakeNode').forEach(n=>n.remove());
    const total=approved.length;
    approved.forEach((c,i)=>{
      const pos=(i-active+total)%total;
      const angle=-90+(360/total)*pos;
      const node=document.createElement('button');
      node.className='cakeNode'+(i===active?' active':pos>3&&pos<total-3?' dim':'');
      node.style.setProperty('--angle',`${angle}deg`);
      const img=document.createElement('img');
      img.loading='eager';
      img.decoding='async';
      img.alt=c.name;
      // Cake photos are fixed to the approved files in /assets/images/.
      // Never replace a missing cake with the Diamond logo. Try the mirrored
      // migrated copy only as a second source so the cake artwork stays intact.
      const cakeLocal='/assets/images/'+encodeURIComponent(c.image).replace(/%2F/g,'/');
      const cakeMirror='/assets/migrated-firestore/'+encodeURIComponent(c.image).replace(/%2F/g,'/');
      img.src=new URL(cakeLocal+'?v=97', location.origin).href;
      img.onerror=()=>{
        img.onerror=null;
        img.src=new URL(cakeMirror+'?v=97', location.origin).href;
      };
      node.appendChild(img);
      node.onclick=()=>{active=i;draw();restart();};
      orbit.appendChild(node);
    });
    $('#activeCakeName').textContent=approved[active].name;
    $('#activeCakePrice').textContent=approved[active].price;
    if(dots){
      dots.innerHTML=approved.map((_,i)=>`<button class="${i===active?'active':''}" aria-label="Cake ${i+1}"></button>`).join('');
      dots.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{active=i;draw();restart();});
    }
  }
  function next(){active=(active+1)%approved.length;draw();}
  function prev(){active=(active-1+approved.length)%approved.length;draw();}
  function restart(){clearInterval(timer);timer=setInterval(next,3600);}
  $('#cakeNext')?.addEventListener('click',()=>{next();restart();});
  $('#cakePrev')?.addEventListener('click',()=>{prev();restart();});
  draw();restart();
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) restart(); },{passive:true});
}
async function renderMeals(){
  let meals = await liveCollection('specialMeals') || await json('data/special-meals.json').catch(()=>null) || [
    {name:'Special Thali',desc:'Paneer dish, dal makhani, rice, raita, salad, papad and fresh breads.',image:'meal-special.webp'},
    {name:'Executive Thali',desc:'A complete meal with balanced portions and Diamond taste.',image:'meal-exec.webp'},
    {name:'Paneer Naan with Gravy',desc:'Soft naan paired with rich paneer gravy.',image:'meal-paneer.webp'},
    {name:'Amritsari Kulcha',desc:'Crisp kulcha served with flavourful chana.',image:'meal-amrit.webp'}
  ];
  meals = await resolveLinkedCards(meals.filter(x=>x.visible!==false));
  let i=0; const tabs=$('#mealTabs'); if(!tabs || !meals.length) return;
  function imgOf(m){ return asset(m.imageUrl||m.image||m.img||'meal-special.webp'); }
  function draw(){ const m=meals[i], p=meals[(i-1+meals.length)%meals.length], n=meals[(i+1)%meals.length]; $('#mealTitle').textContent=m.name||''; $('#mealDesc').textContent=m.desc||''; $('#mealMainImg').src=imgOf(m); $('#mealMainImg').setAttribute('data-edit-field','special-meal-photo'); $('#mealPrevImg').src=imgOf(p); $('#mealNextImg').src=imgOf(n); tabs.innerHTML=meals.map((x,k)=>`<button data-edit-item="${x.name||''}" class="${k===i?'active':''}">${x.name||''}</button>`).join(''); tabs.querySelectorAll('button').forEach((b,k)=>b.onclick=()=>{i=k;draw();}); }
  $('#mealNext')?.addEventListener('click',()=>{i=(i+1)%meals.length;draw();}); $('#mealPrev')?.addEventListener('click',()=>{i=(i-1+meals.length)%meals.length;draw();}); draw();
}
async function renderSweetRail(){
  const rail=$('#sweetRail'); if(!rail) return;
  const defaults = await json('data/sweet-pastry.json').catch(()=>[]);
  const live = await liveCollection('freshPicks');
  let picks = mergeRowsByKey(defaults, live);
  picks = (await resolveLinkedCards(picks));
  rail.innerHTML=picks.map(x=>`<a class="ovalCard" data-edit-item="${x.name||x.title||''}" data-linked-item="${x.linkedItemId||''}" href="${x.href||`menu.html#${slug(x.category||'sweets')}`}"><div class="imgCircle"><img data-edit-field="fresh-pick-photo" loading="lazy" decoding="async" src="${asset(x.imageUrl||x.image)}" alt="${x.name||x.title||''}" onerror="this.src='assets/optimized-v1/diamond-logo-hq-white-card-v64.webp'"></div><h3>${x.name||x.title||''}</h3><p>${x.price||''}</p></a>`).join('');
  $('#sweetLeft')?.addEventListener('click',()=>rail.scrollBy({left:-230,behavior:'smooth'}));
  $('#sweetRight')?.addEventListener('click',()=>rail.scrollBy({left:230,behavior:'smooth'}));
}
async function renderStories(){
  const rail=$('#storyRail');
  const sec=$('#stories');
  if(!rail || !sec) return;

  let stories=[];

  try{
    const live=await liveCollection('storyCards');
    if(Array.isArray(live)){
      stories=live
        .filter(x=>x.visible!==false)
        .sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0));
    }
  }catch(e){
    console.warn('Diamond Stories load error:',e);
  }

  if(!stories.length){
    stories=[
      {
        title:'Best Restaurant 2017',
        subtitle:'Big Shimla Pride Award • Selected by jury and public voting',
        imageUrl:'assets/awards/award-best-restaurant-2017.webp',
        sort:10
      },
      {
        title:'Top 4 Best Restaurant',
        subtitle:'Big Shimla Pride Award • Best Restaurant of the City nomination',
        imageUrl:'assets/awards/award-top4-restaurant.webp',
        sort:20
      },
      {
        title:'GST Honour 2022',
        subtitle:'Presented with honour by CGST Commissionerate Shimla',
        imageUrl:'assets/awards/award-gst-honour-2022.webp',
        sort:30
      }
    ];
  }

  sec.style.display='';

  rail.innerHTML=stories.map(s=>`
    <article class="storyCard">
      <img
        loading="lazy"
        decoding="async"
        src="${asset(s.imageUrl||s.image)}"
        alt="${esc(s.title||'Diamond Award')}"
        onerror="this.src='assets/optimized-v1/diamond-logo-hq-white-card-v64.webp'">
      <div>
        <h3>${esc(s.title||'Diamond Award')}</h3>
        <p>${esc(s.subtitle||s.desc||'')}</p>
      </div>
    </article>
  `).join('');

  const count=$('#storyCount');
  if(count) count.textContent=`01 / ${String(stories.length).padStart(2,'0')}`;

  const dots=$('#storyDots');
  if(dots){
    dots.innerHTML=stories.map((_,i)=>
      `<span class="${i===0?'active':''}"></span>`
    ).join('');
  }
}
async function renderReviews(){
  const grid=$('#reviewGrid');
  if(!grid) return;

  let reviews=[];

  try{
    const live=await liveCollection('reviews');

    if(Array.isArray(live) && live.length){
      // Firestore is the source of truth.
      reviews=live;
    }else{
      // Local JSON is fallback only.
      reviews=await json('data/reviews.json').catch(()=>[]);
    }
  }catch(e){
    reviews=await json('data/reviews.json').catch(()=>[]);
  }

  // Extra protection against accidental duplicate documents.
  const seen=new Set();

  reviews=reviews
    .filter(x=>x && x.visible!==false)
    .filter(x=>{
      const key=String(
        x.id ||
        `${x.name||''}|${x.title||''}|${x.text||''}`
      ).trim().toLowerCase();

      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0));

  grid.innerHTML=reviews.map(r=>`
    <article class="reviewCard">
      <div class="stars">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}</div>
      <h3>${esc(r.title||'')}</h3>
      <p>${esc(r.text||'')}</p>
      <b>— ${esc(r.name||'Guest')}${r.city ? ', '+esc(r.city) : ''}</b>
    </article>
  `).join('');
}

function renderDeliveryFocus(){
  const img=$('#deliveryFoodImg'), tabs=$$('.deliveryChip');
  if(!img || !tabs.length) return;
  let active=0, timer;
  function set(i){
    active=i;
    tabs.forEach((t,k)=>t.classList.toggle('active', k===active));
    const next=tabs[active]?.dataset.img;
    if(next){ img.style.opacity='.35'; setTimeout(()=>{ img.src=next; img.style.opacity='1'; },120); }
  }
  tabs.forEach((t,i)=>{
    t.addEventListener('mouseenter',()=>set(i));
    t.addEventListener('focus',()=>set(i));
  });
  img.style.transition='opacity .22s ease';
  timer=setInterval(()=>set((active+1)%tabs.length),3000);
  $('#deliveryFocus')?.addEventListener('mouseenter',()=>clearInterval(timer));
  $('#deliveryFocus')?.addEventListener('mouseleave',()=>{timer=setInterval(()=>set((active+1)%tabs.length),3000);});
}



function renderHeroOrbit(){
  const main = document.querySelector('#heroOrbitMain');
  const title = document.querySelector('#heroOrbitTitle');
  const eyebrow = document.querySelector('#heroOrbitEyebrow');
  const thumbs = [...document.querySelectorAll('.heroOrbitThumb')];
  if(!main || !thumbs.length) return;
  let active = 0;
  function setHero(i){
    const btn = thumbs[i]; if(!btn) return;
    active = i;
    thumbs.forEach((t,k)=>t.classList.toggle('active', k===i));
    const img = btn.dataset.img;
    main.style.opacity = '.25';
    setTimeout(()=>{ main.src = img; main.alt = btn.dataset.title || 'Diamond food'; main.style.opacity = '1'; }, 120);
    if(title) title.textContent = btn.dataset.title || 'Diamond Fresh';
    if(eyebrow) eyebrow.textContent = i === 0 ? 'Diamond Signature' : 'Fresh From Diamond';
  }
  thumbs.forEach((btn,i)=>btn.addEventListener('click',()=>setHero(i)));
  setInterval(()=>setHero((active+1)%thumbs.length), 3600);
}

initOrderMenu();

const scheduleLiveOrderLinks = () => {
  const refresh = () => renderOrderMenuLinks().catch(()=>{});
  if('requestIdleCallback' in window){
    requestIdleCallback(refresh, {timeout:2500});
  }else{
    setTimeout(refresh,1800);
  }
};

if(document.readyState==='complete'){
  scheduleLiveOrderLinks();
}else{
  window.addEventListener('load',scheduleLiveOrderLinks,{once:true});
}

renderHomeSlideHero();
renderDeliveryFocus();

const runSecondaryHome = () => {
  renderCategories();
  renderCakeOrbit();
  renderMeals();
  renderSweetRail();

  const runLowPriority = () => {
    renderStories();
    renderReviews();
    applySectionOverrides();
  };

  if('requestIdleCallback' in window){
    requestIdleCallback(runLowPriority, {timeout:1800});
  }else{
    setTimeout(runLowPriority,700);
  }
};

const scheduleSecondaryHome=()=>setTimeout(runSecondaryHome,900);

if(document.readyState==='complete'){
  scheduleSecondaryHome();
}else{
  window.addEventListener('load',scheduleSecondaryHome,{once:true});
}

// Warm Menu only after the homepage has finished its important loading.
function warmDiamondMenu(){
  const warm = () => {
    fetch('menu.html', {cache:'force-cache'}).catch(()=>{});
    fetch('menu.js', {cache:'force-cache'}).catch(()=>{});
    fetch('data/menu.json', {cache:'force-cache'}).catch(()=>{});
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(warm, {timeout:3000});
  } else {
    setTimeout(warm, 1500);
  }
}

if(document.readyState === 'complete'){
  warmDiamondMenu();
}else{
  window.addEventListener('load', warmDiamondMenu, {once:true});
}


// V82: quick-bar order button opens the existing Order Now menu on desktop, fallback to app page.
document.addEventListener('click', function(e){
  const quick = e.target.closest && e.target.closest('.quickOrderV82');
  if(!quick) return;
  const real = document.getElementById('orderToggle');
  if(real){ real.click(); }
});


// V82: Quick header Order Now links. Same old links restored.
(function(){
  function initQuickOrderV82(){
    const buttons = Array.from(document.querySelectorAll('.quickOrderV82'));
    if(!buttons.length) return;
    let backdrop = document.querySelector('.quickOrderBackdropV82');
    if(!backdrop){
      backdrop = document.createElement('div');
      backdrop.className = 'quickOrderBackdropV82';
      document.body.appendChild(backdrop);
    }
    function closeAll(){
      document.querySelectorAll('.headerQuickActionsV82.orderOpen').forEach(x=>x.classList.remove('orderOpen'));
      backdrop.classList.remove('show');
    }
    buttons.forEach(btn=>{
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        const wrap = btn.closest('.headerQuickActionsV82');
        if(!wrap) return;
        const open = !wrap.classList.contains('orderOpen');
        closeAll();
        if(open){
          wrap.classList.add('orderOpen');
          backdrop.classList.add('show');
        }
      });
    });
    backdrop.addEventListener('click', closeAll);
    document.addEventListener('click', function(e){
      if(!e.target.closest('.headerQuickActionsV82')) closeAll();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeAll();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initQuickOrderV82);
  else initQuickOrderV82();
})();


// Shared app/order links: homepage and App page use the same Firestore collection + fallback.
async function renderSharedOrderLinksV83(){
  const panel=document.getElementById('sharedOrderPanelV81');
  if(!panel) return;
  const fallback=[
    {name:'Food Order',type:'Food',url:'https://uen.io/diamondrestaurant',description:'Order online from Diamond.',sort:10},
    {name:'Mega Store',type:'Mega Mart',url:'https://diamondrestaurants.uengage.in/',description:'Open Diamond Mega Store.',sort:20},
    {name:'Android App',type:'Grocery App',url:'https://play.google.com/store/apps/details?id=com.app.uengage.diamondrestaurant',description:'Diamond grocery app.',sort:30},
    {name:'iPhone Link',type:'Grocery App',url:'https://apps.apple.com/us/app/diamond-restaurants/id6743344052',description:'Diamond iPhone app.',sort:40},
    {name:'Google Review',type:'Review',url:'https://search.google.com/local/writereview?placeid=ChIJsR6d57d4BTkRu6lcEKPn1Eg&source=g.page.m.dd._&laa=lu-desktop-reviews-dialog-review-solicitation',description:'Share your Diamond experience.',sort:50}
  ];
  try{
    const live=await liveCollection('appLinks');
    let links=(live&&live.length?live:await json('data/app-links.json').catch(()=>fallback))||fallback;
    links=links.filter(x=>x&&x.visible!==false).sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0)||String(a.name||'').localeCompare(String(b.name||'')));
    panel.innerHTML='<button class="sharedOrderCloseV81" type="button" aria-label="Close">×</button><h3>Order from Diamond</h3>'+links.map(x=>`<a class="sharedOrderItemV81" href="${esc(x.url||'#')}" target="_blank" rel="noopener"><b>${esc(x.name||'Open')}</b><span>${esc(x.description||x.buttonText||'Open')}</span></a>`).join('');
    const close=panel.querySelector('.sharedOrderCloseV81');
    close?.addEventListener('click',()=>document.getElementById('sharedOrderBackdropV81')?.click());
  }catch(e){ console.warn('Shared order links load failed:',e); }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>renderSharedOrderLinksV83()); else renderSharedOrderLinksV83();

// V98: Order Now / Order Online buttons are direct links; popup interception removed.
