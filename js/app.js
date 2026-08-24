
const $ = (s, root=document)=>root.querySelector(s);
const $$ = (s, root=document)=>[...root.querySelectorAll(s)];

const routes = ["inicio","recuerdos","dedicatorias","conversaciones","historia","dalas","carta","secretos"];


const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.getElementById("mainNav");

function closeMobileNav(){
  if(!mainNav || !mobileMenuBtn) return;
  mainNav.classList.remove("open");
  mobileMenuBtn.classList.remove("open");
  mobileMenuBtn.setAttribute("aria-expanded","false");
}

function toggleMobileNav(){
  if(!mainNav || !mobileMenuBtn) return;
  const open = !mainNav.classList.contains("open");
  mainNav.classList.toggle("open", open);
  mobileMenuBtn.classList.toggle("open", open);
  mobileMenuBtn.setAttribute("aria-expanded", String(open));
}

if(mobileMenuBtn){
  mobileMenuBtn.addEventListener("click", (e)=>{
    e.stopPropagation();
    toggleMobileNav();
  });
}
if(mainNav){
  mainNav.addEventListener("click", e=>e.stopPropagation());
}
document.addEventListener("click", ()=>{
  if(window.innerWidth <= 860) closeMobileNav();
});
window.addEventListener("resize", ()=>{
  if(window.innerWidth > 860) closeMobileNav();
});


function showView(name){
  if(!routes.includes(name)) name="inicio";
  closeMobileNav();
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
  $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  window.scrollTo({top:0,behavior:"smooth"});
  history.replaceState(null,"",`#${name}`);
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));

function renderStats(){
  const legacyStats=$("#mediaStats");
  if(legacyStats){
    legacyStats.innerHTML = `
      <span class="stat">${MEDIA_STATS.photos} fotos</span>
      <span class="stat">${MEDIA_STATS.videos} videos</span>
      <span class="stat">${MEDIA_STATS.david} del príncipe</span>
      <span class="stat">${MEDIA_STATS.niko} de tu niño</span>`;
  }
}
let activeFilter="all";
function mediaMatches(x){
  if(activeFilter==="all") return true;
  if(activeFilter==="images") return x.type==="image";
  if(activeFilter==="videos") return x.type==="video";
  if(activeFilter==="david") return x.senderKey==="david" || x.sender==="David";
  if(activeFilter==="niko") return x.senderKey==="niko";
  return true;
}
let currentMediaType="all";
let currentMediaOwner="all";
let currentMediaSearch="";
let currentFeaturedMedia=null;

function mediaSearchText(item){
  return [
    item.caption||"",
    item.date||"",
    item.sender||"",
    item.senderKey||"",
    item.type==="video" ? "video" : "foto"
  ].join(" ").toLowerCase();
}

function getFilteredMedia(){
  return MEDIA_ITEMS.filter(item=>{
    const typeOk=currentMediaType==="all" || item.type===currentMediaType;
    const itemOwner = item.senderKey || ((item.sender||"").toLowerCase().includes("niko") ? "niko" : "david");
    const ownerOk=currentMediaOwner==="all" || itemOwner===currentMediaOwner;
    const searchOk=!currentMediaSearch || mediaSearchText(item).includes(currentMediaSearch);
    return typeOk && ownerOk && searchOk;
  });
}

function renderMedia(){
  const list=getFilteredMedia();
  const grid=$("#mediaGrid");
  const empty=$("#mediaEmpty");
  if(!grid) return;

  grid.innerHTML=list.map((item,index)=>{
    const itemOwner = item.senderKey || ((item.sender||"").toLowerCase().includes("niko") ? "niko" : "david");
    const who=itemOwner==="david" ? "Príncipe" : itemOwner==="niko" ? "Tu niño" : "Recuerdo";
    const icon=item.type==="video" ? "▶" : "↗";
    const cls=item.type==="video" ? "media-card media-card-video" : "media-card";
    const media=item.type==="video"
      ? `<video src="${item.src}" preload="metadata" muted playsinline></video>`
      : `<img src="${item.src}" loading="lazy" alt="${escapeHtml(item.caption||"Recuerdo")}">`;

    return `<article class="${cls}" data-media-index="${MEDIA_ITEMS.indexOf(item)}" tabindex="0" aria-label="Abrir recuerdo">
      ${media}
      <div class="media-card-overlay">
        <div class="media-card-meta">
          <strong>${escapeHtml(item.caption||who)}</strong>
          <span>${who}${item.date ? " · "+escapeHtml(item.date) : ""}</span>
        </div>
        <div class="media-card-badge">${icon}</div>
      </div>
    </article>`;
  }).join("");

  if(empty) empty.classList.toggle("hidden",list.length!==0);
  if(grid) grid.classList.toggle("hidden",list.length===0);

  const results=$("#mediaResultsText");
  if(results){
    results.textContent=`${list.length} ${list.length===1 ? "recuerdo" : "recuerdos"} visibles`;
  }

  grid.querySelectorAll(".media-card").forEach(card=>{
    const open=()=>{
      const item=MEDIA_ITEMS[Number(card.dataset.mediaIndex)];
      openLightbox(item);
    };
    card.addEventListener("click",open);
    card.addEventListener("keydown",e=>{
      if(e.key==="Enter" || e.key===" "){e.preventDefault();open();}
    });
  });
}

function setFeaturedMedia(item){
  if(!item) return;
  currentFeaturedMedia=item;
  const hero=$("#mediaFeatured");
  const title=$("#featuredMediaTitle");
  if(hero){
    if(item.type==="image"){
      hero.style.backgroundImage=`url("${item.src}")`;
    }else{
      hero.style.backgroundImage="linear-gradient(145deg,#13243b,#08111e)";
    }
  }
  if(title){
    title.textContent=item.caption || (item.type==="video" ? "Un video para volver a ver" : "Una foto que se quedó");
  }
}

function initProfessionalMedia(){
  const photos=MEDIA_ITEMS.filter(x=>x.type==="image").length;
  const videos=MEDIA_ITEMS.filter(x=>x.type==="video").length;
  const total=MEDIA_ITEMS.length;
  if($("#mediaPhotoCount")) $("#mediaPhotoCount").textContent=photos;
  if($("#mediaVideoCount")) $("#mediaVideoCount").textContent=videos;
  if($("#mediaTotalCount")) $("#mediaTotalCount").textContent=total;

  const featuredPool=MEDIA_ITEMS.filter(x=>x.type==="image");
  if(featuredPool.length){
    setFeaturedMedia(featuredPool[Math.floor(Math.random()*featuredPool.length)]);
  }

  document.querySelectorAll("#mediaTypeFilters button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll("#mediaTypeFilters button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentMediaType=btn.dataset.filter;
      renderMedia();
    });
  });

  document.querySelectorAll("#mediaOwnerFilters button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll("#mediaOwnerFilters button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentMediaOwner=btn.dataset.owner;
      renderMedia();
    });
  });

  const search=$("#mediaSearch");
  if(search){
    search.addEventListener("input",e=>{
      currentMediaSearch=e.target.value.trim().toLowerCase();
      renderMedia();
    });
  }

  const featuredBtn=$("#featuredMediaButton");
  if(featuredBtn){
    featuredBtn.addEventListener("click",()=>{
      if(currentFeaturedMedia) openLightbox(currentFeaturedMedia);
    });
  }

  const shuffle=$("#mediaShuffle");
  if(shuffle){
    shuffle.addEventListener("click",()=>{
      const list=getFilteredMedia();
      if(!list.length) return;
      const random=list[Math.floor(Math.random()*list.length)];
      openLightbox(random);
    });
  }
}
function escapeHtml(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$$(".filters button").forEach(btn=>btn.addEventListener("click",()=>{
  activeFilter=btn.dataset.filter;
  $$(".filters button").forEach(b=>b.classList.toggle("active",b===btn));
  renderMedia();
}));

function openLightbox(itemOrIndex){
  const x = typeof itemOrIndex === "number" ? MEDIA_ITEMS[itemOrIndex] : itemOrIndex;
  if(!x) return;
  const box=$("#lightbox"), holder=$("#lightboxMedia");
  if(!box || !holder) return;
  holder.innerHTML=x.type==="image"
    ? `<img src="${x.src}" alt="">`
    : `<video src="${x.src}" controls autoplay playsinline></video>`;
  const owner = (x.senderKey || ((x.sender||"").toLowerCase().includes("niko") ? "niko" : "david")) === "david"
    ? "Príncipe"
    : "Tu niño";
  if($("#lightboxTitle")) $("#lightboxTitle").textContent=`${owner}${x.date?` · ${x.date}`:""}`;
  if($("#lightboxCaption")) $("#lightboxCaption").textContent=x.caption||"";
  box.classList.add("open");
  document.body.style.overflow="hidden";
}
function closeLightbox(){
  $("#lightbox").classList.remove("open");
  $("#lightboxMedia").innerHTML="";
  document.body.style.overflow="";
}
if($("#lightboxClose")) $("#lightboxClose").addEventListener("click",closeLightbox);
if($("#lightbox")) $("#lightbox").addEventListener("click",e=>{if(e.target===$("#lightbox"))closeLightbox()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLightbox()});

function renderConversations(query=""){
  const q=query.trim().toLowerCase();
  const list=CONVERSATIONS.filter(c=>{
    const hay=[c.title,c.date,c.note,...c.messages.map(m=>m.text)].join(" ").toLowerCase();
    return !q || hay.includes(q);
  });
  $("#conversationGrid").innerHTML=list.map(c=>`
    <article class="convo-card">
      <div class="convo-date">${c.date}</div>
      <h3>${c.title}</h3>
      <p class="convo-note">${c.note}</p>
      <div class="chat-preview">
        ${c.messages.map(m=>`<div class="bubble ${m.who}"><b>${m.name}</b>${escapeHtml(m.text)}</div>`).join("")}
      </div>
    </article>`).join("");
  const count=$("#conversationCount");
  if(count) count.textContent=`${list.length} momentos`;
}
function renderTimeline(){
  $("#timeline").innerHTML=TIMELINE.map(e=>`
    <div class="event"><div class="date">${e.date}</div><h3>${e.title}</h3><p>${e.text}</p></div>`).join("");
}
if($("#envelope")){
  $("#envelope").addEventListener("click",()=>{
    $("#envelope").classList.toggle("open");
    if($("#letter")) $("#letter").classList.toggle("open");
  });
}
$$(".secret").forEach(s=>s.querySelector("button").addEventListener("click",()=>s.classList.add("open")));


const conversationSearch=$("#conversationSearch");
if(conversationSearch){
  conversationSearch.addEventListener("input",e=>renderConversations(e.target.value));
}
const initial=location.hash.replace("#","");showView(routes.includes(initial)?initial:"inicio");


function getDailySecretIndex(){
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
  let hash = 0;
  for(let i=0;i<dayKey.length;i++){
    hash = ((hash << 5) - hash) + dayKey.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % DAILY_SECRETS.length;
}

function initDailySecret(){
  const card = $("#dailySecretCard");
  const btn = $("#dailySecretButton");
  if(!card || !btn || typeof DAILY_SECRETS === "undefined") return;

  const today = new Date();
  const secret = DAILY_SECRETS[getDailySecretIndex()];
  const formatted = today.toLocaleDateString("es-ES",{
    weekday:"long",day:"numeric",month:"long",year:"numeric"
  });

  $("#dailySecretDate").textContent = formatted;
  $("#dailySecretEmoji").textContent = secret.emoji;
  $("#dailySecretTitle").textContent = secret.title;
  $("#dailySecretText").textContent = secret.text;

  btn.addEventListener("click",()=>{
    $("#dailySecretLock").classList.add("hidden");
    $("#dailySecretContent").classList.remove("hidden");
  });
}



let currentDedicationType="all";
let currentDedicationSearch="";
let currentFeaturedDedication=null;

function dedicationSearchText(item){
  return [
    item.caption||"",
    item.originalName||"",
    item.type==="video" ? "video" : "foto"
  ].join(" ").toLowerCase();
}

function getFilteredDedications(){
  return DEDICATION_ITEMS.filter(item=>{
    const typeOk = currentDedicationType==="all" || item.type===currentDedicationType;
    const searchOk = !currentDedicationSearch || dedicationSearchText(item).includes(currentDedicationSearch);
    return typeOk && searchOk;
  });
}

function setFeaturedDedication(item){
  if(!item) return;
  currentFeaturedDedication=item;
  const feature=$("#dedicationFeature");
  const title=$("#dedicationFeatureTitle");
  if(feature){
    if(item.type==="image"){
      feature.style.backgroundImage=`url("${item.src}")`;
      feature.style.backgroundSize="cover";
      feature.style.backgroundPosition="center";
    }else{
      feature.style.backgroundImage="linear-gradient(145deg,#132947,#08111f)";
    }
  }
  if(title){
    title.textContent=item.caption || "Algo que guardé para ti";
  }
}

function renderDedications(){
  const grid=$("#dedicationGrid");
  const empty=$("#dedicationEmpty");
  if(!grid || typeof DEDICATION_ITEMS==="undefined") return;

  const list=getFilteredDedications();
  grid.innerHTML=list.map((item, i)=>{
    const media=item.type==="video"
      ? `<video src="${item.src}" preload="metadata" muted playsinline></video>`
      : `<img src="${item.src}" loading="lazy" alt="${escapeHtml(item.caption||"Dedicatoria")}">`;
    const icon=item.type==="video" ? "▶" : "↗";
    const label=item.type==="video" ? "Video guardado" : "Imagen guardada";
    const cardClass=item.type==="video" ? "media-card media-card-video" : "media-card";

    return `<article class="${cardClass}" data-ded-index="${DEDICATION_ITEMS.indexOf(item)}" tabindex="0" aria-label="Abrir dedicatoria">
      ${media}
      <div class="media-card-overlay">
        <div class="media-card-meta">
          <strong>${escapeHtml(item.caption || label)}</strong>
          <span>${label}</span>
        </div>
        <div class="media-card-badge">${icon}</div>
      </div>
    </article>`;
  }).join("");

  if(empty) empty.classList.toggle("hidden", list.length !== 0);
  grid.classList.toggle("hidden", list.length === 0);

  grid.querySelectorAll("[data-ded-index]").forEach(card=>{
    const open=()=>{
      const item=DEDICATION_ITEMS[Number(card.dataset.dedIndex)];
      openLightbox(item);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", e=>{
      if(e.key==="Enter" || e.key===" "){
        e.preventDefault();
        open();
      }
    });
  });
}

function initDedications(){
  if(typeof DEDICATION_ITEMS==="undefined" || typeof DEDICATION_STATS==="undefined") return;

  if($("#dedPhotoCount")) $("#dedPhotoCount").textContent=DEDICATION_STATS.photos;
  if($("#dedVideoCount")) $("#dedVideoCount").textContent=DEDICATION_STATS.videos;
  if($("#dedTotalCount")) $("#dedTotalCount").textContent=DEDICATION_STATS.total;

  const featureCandidate = DEDICATION_ITEMS.find(x=>x.type==="image") || DEDICATION_ITEMS[0];
  if(featureCandidate) setFeaturedDedication(featureCandidate);

  const search=$("#dedicationSearch");
  if(search){
    search.addEventListener("input", e=>{
      currentDedicationSearch=e.target.value.trim().toLowerCase();
      renderDedications();
    });
  }

  document.querySelectorAll("#dedicationTypeFilters button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("#dedicationTypeFilters button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentDedicationType=btn.dataset.filter;
      renderDedications();
    });
  });

  if($("#dedicationFeatureBtn")){
    $("#dedicationFeatureBtn").addEventListener("click", ()=>{
      if(currentFeaturedDedication) openLightbox(currentFeaturedDedication);
    });
  }

  if($("#dedicationShuffle")){
    $("#dedicationShuffle").addEventListener("click", ()=>{
      const list=getFilteredDedications();
      if(!list.length) return;
      const random=list[Math.floor(Math.random()*list.length)];
      openLightbox(random);
    });
  }

  renderDedications();
}


function initLetterTabs(){
  const tabs=$$("[data-letter-tab]");
  const panels=$$("[data-letter-panel]");
  if(!tabs.length || !panels.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener("click",()=>{
      const target=tab.dataset.letterTab;
      tabs.forEach(t=>t.classList.toggle("active",t===tab));
      panels.forEach(p=>p.classList.toggle("active",p.dataset.letterPanel===target));
    });
  });
}

function initializePage(){
  try{
    renderStats();
    initProfessionalMedia();
    renderMedia();
    initDedications();
    renderConversations();
    renderTimeline();
    initDailySecret();
    initLetterTabs();
  }catch(err){
    console.error("Error inicializando la página:", err);
    const grid=document.getElementById("mediaGrid");
    if(grid && typeof MEDIA_ITEMS!=="undefined"){
      grid.innerHTML=MEDIA_ITEMS.map((item,i)=>{
        const media=item.type==="video"
          ? `<video src="${item.src}" controls preload="metadata" playsinline></video>`
          : `<img src="${item.src}" loading="lazy" alt="Recuerdo">`;
        return `<article class="media-card" data-media-index="${i}">${media}</article>`;
      }).join("");
    }
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", initializePage, {once:true});
}else{
  initializePage();
}
