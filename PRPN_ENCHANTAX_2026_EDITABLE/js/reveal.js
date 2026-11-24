/* ==========================================================================
   PRPN × ENCHANTAX 2026 — Cinematic Grand Reveal (js/reveal.js)
   Vanilla JS (situs ini tidak memakai GSAP/React). Komponen terpisah:
     AnnouncementIntro (Scene 1)  · MysteryReveal (Scene 2) · GrandReveal (Scene 3)
     WinnerCategory + WinnerCard + WinnerPodium (Scene 4) · AnnouncementClosing (Scene 5)
   State animasi ini TERPISAH dari loader (LoadingAnimation / MedalLogo /
   OrnamentalHouseRing di app.js tidak disentuh).
   Dipasang lewat PRPNReveal.init({...}) dari app.js.
   ========================================================================== */
(function(){
"use strict";
const A="assets/cinematic/";
const IMG={portal:A+"01_cinematic_winner_portal.png",ring:A+"02_ornamental_house_wreath.png",laurel:A+"03_golden_laurel_crown.png",
cloudL:A+"04_cloud_cluster_left.png",podium:A+"05_three_level_winner_podium.png",plaque:A+"06_navy_gold_title_plaque.png",
banner:A+"07_red_gold_reveal_banner.png",cream:A+"08_cream_gold_info_plaque.png",beam:A+"09_golden_light_beam.png",
spark:A+"10_golden_sparkles_and_glow.png",orbit:A+"11_golden_orbit_ribbon.png",curtain:A+"12_royal_red_curtain.png",
star:A+"13_four_point_star.png",cloudR:A+"14_cloud_cluster_right.png",glitter:A+"15_golden_glitter_strand.png"};
const ORDER=["lcc","esai","policy","infografis"];
const LONG={lcc:"Lomba Cerdas Cermat",esai:"Lomba Esai",policy:"Lomba Policy Brief",infografis:"Lomba Infografis"};
const RK={3:"JUARA 3",2:"JUARA 2",1:"JUARA 1"};
const CANCEL={cancelled:true};
const mq=matchMedia("(prefers-reduced-motion: reduce)");
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const REAL=v=>{v=String(v==null?"":v).trim();return v&&!/^(nama juara\b.*|asal (kampus|sekolah).*|\[placeholder\].*|[-—–]+)$/i.test(v)};

let H=null,home=null,stage=null,dust=null,veil=null,io=null,raf=0,last=0;
const off=[];                                   // listener cleanup
const S={scene:0,full:false,active:false,paused:false,skip:false,run:0,busy:false,waiters:[],par:[],card:null,
         px:0,py:0,tx:0,ty:0,cats:[],lastCat:null};
const q=(s,r)=>(r||stage).querySelector(s),qa=(s,r)=>[...(r||stage).querySelectorAll(s)];
const on=(t,e,f,o)=>{t.addEventListener(e,f,o);off.push(()=>t.removeEventListener(e,f,o))};

/* ------------------------------------------------------------ data */
function getCats(){
  const W=H.getWinners()||{},keys=[...ORDER.filter(k=>k in H.cats),...Object.keys(H.cats).filter(k=>!ORDER.includes(k))],out=[];
  keys.forEach(k=>{
    const rows=W[k]||[],wins=[];
    [[2,3],[1,2],[0,1]].forEach(([i,rank])=>{const e=rows[i]||[];if(REAL(e[0]))wins.push({rank,team:String(e[0]).trim(),inst:REAL(e[1])?String(e[1]).trim():"",score:REAL(e[2])?String(e[2]).trim():""})});
    if(wins.length){const ac=(H.ann&&H.ann().cat[k])||{};out.push({key:k,label:H.cats[k]||k,long:ac.long||LONG[k]||H.cats[k]||k,desc:ac.desc||"",wins})};
  });
  return out;
}
function canUnveil(){
  if(!H.isPublished()&&!H.canPreview()){H.toast("Hasil belum disahkan panitia ⏳");return false}
  S.cats=getCats();
  if(!S.cats.length){H.toast("Data juara belum diisi panitia");return false}
  return true;
}

/* ------------------------------------------------------------ sequencer (pausable, skippable, cancellable) */
const isWA=a=>!(window.CSSAnimation&&a instanceof CSSAnimation)&&!(window.CSSTransition&&a instanceof CSSTransition);
const beat=()=>{S.skip=false};                  // setiap "beat" baru mulai tanpa status skip
function anim(el,kf,o){
  o=Object.assign({duration:900,fill:"both",easing:"cubic-bezier(.22,.8,.24,1)"},o||{});
  if(mq.matches)o.duration=Math.min(o.duration,160),o.delay=0;
  const a=el.animate(kf,o);if(S.paused)a.pause();if(S.skip)a.finish();
  return a;
}
function clearAnims(root){(root||stage).getAnimations({subtree:true}).forEach(a=>{if(isWA(a))try{a.cancel()}catch(e){}})}
function cancelRun(){++S.run;S.waiters.splice(0).forEach(w=>w.r())}
function mkCtx(tok){
  const chk=()=>{if(tok!==S.run)throw CANCEL};
  return{
    wait(ms){chk();if(mq.matches)ms*=.6;return new Promise(r=>S.waiters.push({left:ms/1000,r})).then(chk)},
    play(el,kf,o){chk();const a=anim(el,kf,o);return a.finished.then(()=>{},()=>{}).then(chk)},
    run(el,kf,o){chk();return anim(el,kf,o)}               // fire-and-forget (tetap bisa di-skip / di-pause)
  };
}
const IN=(o)=>[{opacity:0,transform:"translateY("+(o&&o.y!=null?o.y:18)+"px) scale("+(o&&o.s||1)+")",filter:"blur(8px)"},{opacity:1,transform:"none",filter:"blur(0)"}];
function hide(...els){els.flat().forEach(e=>{if(e){clearAnims(e);e.style.opacity=0}})}
const say=t=>{const e=q(".cr-sr");if(e)e.textContent=t};

/* ------------------------------------------------------------ particles (3 depth layers + gentle bursts) */
function Dust(cv){
  const c=cv.getContext("2d"),spr=document.createElement("canvas");spr.width=spr.height=32;
  {const g=spr.getContext("2d"),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,"rgba(255,236,170,1)");r.addColorStop(.35,"rgba(244,213,138,.55)");r.addColorStop(1,"rgba(233,196,106,0)");g.fillStyle=r;g.fillRect(0,0,32,32)}
  let W=1,Hh=1,dpr=1,P=[],B=[],t=0;
  const lite=()=>(navigator.hardwareConcurrency||8)<=4||innerWidth<700;
  function resize(){const r=cv.getBoundingClientRect();dpr=Math.min(1.5,devicePixelRatio||1);W=Math.max(1,r.width);Hh=Math.max(1,r.height);cv.width=W*dpr;cv.height=Hh*dpr;
    const n=lite()?34:68;P=Array.from({length:n},(_,i)=>{const d=[.35,.7,1][i%3];return{x:Math.random()*W,y:Math.random()*Hh,d,r:(1.6+Math.random()*2.6)*(.6+d*.6),v:(5+Math.random()*13)*(.5+d*.7),ph:Math.random()*6.3}})}
  function burst(x,y,n){if(mq.matches)return;for(let i=0;i<n&&B.length<140;i++){const a=Math.random()*6.283,s=30+Math.random()*120;B.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-50,l:0,L:1.6+Math.random()*1.6,r:2+Math.random()*3})}}
  function step(dt,px,py){
    t+=dt;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,Hh);c.globalCompositeOperation="lighter";
    for(const p of P){if(!mq.matches){p.y-=p.v*dt;p.x+=Math.sin(t*.5+p.ph)*6*dt;if(p.y<-10){p.y=Hh+10;p.x=Math.random()*W}}
      const o=mq.matches?0:px*p.d*26,u=mq.matches?0:py*p.d*18,s=p.r*6;c.globalAlpha=.22+.4*Math.sin(t*1.3+p.ph)**2*p.d;c.drawImage(spr,p.x+o-s/2,p.y+u-s/2,s,s)}
    for(let i=B.length-1;i>=0;i--){const b=B[i];b.l+=dt;if(b.l>b.L){B.splice(i,1);continue}b.vy+=26*dt;b.vx*=.985;b.x+=b.vx*dt;b.y+=b.vy*dt;const k=1-b.l/b.L,s=b.r*7*k+2;c.globalAlpha=.8*k;c.drawImage(spr,b.x-s/2,b.y-s/2,s,s)}
    c.globalAlpha=1;
  }
  return{resize,step,burst};
}

/* ------------------------------------------------------------ main loop (parallax, tilt, waiters, particles) */
function tick(n){
  const dt=Math.min(.05,(n-last)/1000);last=n;
  if(!S.paused||S.skip){
    for(let i=S.waiters.length-1;i>=0;i--){const w=S.waiters[i];w.left-=dt;if(w.left<=0||S.skip){S.waiters.splice(i,1);w.r()}}
  }
  if(S.skip)stage.getAnimations({subtree:true}).forEach(a=>{if(isWA(a))try{a.finish()}catch(e){}});
  const k=Math.min(1,dt*5);S.px+=(S.tx-S.px)*k;S.py+=(S.ty-S.py)*k;
  if(!mq.matches){
    S.par.forEach(e=>{const d=+e.dataset.d||0;e.style.transform="translate3d("+(S.px*d*-22).toFixed(2)+"px,"+(S.py*d*-14).toFixed(2)+"px,0)"});
    const cd=S.card;if(cd&&S.scene===2){cd.style.transform="rotateX("+(-S.py*14).toFixed(2)+"deg) rotateY("+(S.px*18).toFixed(2)+"deg)";cd.style.setProperty("--mx",(50+S.px*60)+"%");cd.style.setProperty("--my",(22+S.py*50)+"%")}
  }
  dust.step(S.paused?0:dt,S.px,S.py);
  raf=requestAnimationFrame(tick);
}
function loopOn(){if(S.active)return;S.active=true;last=performance.now();dust.resize();raf=requestAnimationFrame(tick)}
function loopOff(){S.active=false;cancelAnimationFrame(raf)}

/* ------------------------------------------------------------ scene helpers */
function setScene(n){
  S.scene=n;stage.className=stage.className.replace(/\bcr-s\d\b/g,"").trim()+" cr-s"+n;
  qa(".cr-sc").forEach(e=>e.classList.toggle("on",+e.dataset.s===n));
  const b=q(".cr-scn");if(b)b.textContent=n>=3?"SCENE "+n+"/5":"";
}
function resetStage(){
  S.waiters.splice(0).forEach(w=>w.r());S.skip=false;clearAnims();stage.classList.remove("cr-st-gl","cr-st-rg","cr-st-orb","cr-beat");
  hide(q(".cr-dim"),q(".cr-spot"),q(".cr-beamw"),q(".cr-gather"),q(".cr-curtain"),q(".cr-chip"),q(".cr-q"),q(".cr-pod"),q(".cr-cp"),q(".cr-wipe"));
  q(".cr-wc").innerHTML="";qa(".cr-pod b").forEach(b=>b.classList.remove("lit"));
}

/* ============ SCENE 1 — AnnouncementIntro (The Mysterious Announcement) ============ */
async function AnnouncementIntro(c){
  setScene(1);
  const k=q('.cr-sc[data-s="1"] .cr-kick'),ls=qa('.cr-sc[data-s="1"] .cr-ln'),f=q('.cr-sc[data-s="1"] .cr-foot');
  hide(k,ls,f);
  await c.wait(500);stage.classList.add("cr-st-gl");           // cahaya keemasan di tengah
  await c.wait(900);stage.classList.add("cr-st-orb");          // golden orbit muncul bertahap
  await c.wait(1100);stage.classList.add("cr-st-rg");          // siluet house ring samar
  await c.wait(900);
  await c.play(k,[{opacity:0,letterSpacing:".9em",filter:"blur(8px)"},{opacity:1,letterSpacing:".5em",filter:"blur(0)"}],{duration:1800});
  await c.wait(500);
  await c.play(ls[0],IN(),{duration:1300});await c.wait(250);
  await c.play(ls[1],IN(),{duration:1300});await c.wait(700);
  await c.play(f,IN({y:8}),{duration:1200});
  await c.wait(2300);
}

/* ============ SCENE 2 — MysteryReveal (The Waiting Experience) ============ */
async function MysteryReveal(c,quick){
  setScene(2);
  const t=q(".cr-t2"),w=q(".cr-cw"),b=q('.cr-btn[data-a="unveil"]');
  hide(t,w,b);
  if(quick){[t,w,b].forEach(e=>e.style.opacity=1);return}
  await c.wait(700);
  await c.play(t,IN({y:14}),{duration:1200});
  await c.play(w,IN({y:24,s:.92}),{duration:1500});
  c.play(b,IN({y:10}),{duration:1000});
  say("Pengumuman juara siap dibuka. Tekan tombol Unveil the Winners.");
}

/* ============ SCENE 3 — GrandReveal (The Grand Reveal) ============ */
async function GrandReveal(c){
  setScene(3);beat();
  const pw=q(".cr-portal"),lg=q(".cr-logo"),k=q('.cr-sc[data-s="3"] .cr-kick'),ls=qa('.cr-sc[data-s="3"] .cr-ln'),g=q(".cr-gather"),dim=q(".cr-dim"),sw=q(".cr-orbit-sw");
  hide(pw,lg,k,ls);
  c.run(dim,[{opacity:0},{opacity:.35}],{duration:1400});                                  // background sedikit meredup
  c.run(g,[{opacity:0,transform:"scale(1.5)"},{opacity:1,transform:"scale(.55)"}],{duration:2600});   // cahaya berkumpul di tengah
  c.run(sw,[{transform:"rotate(0deg)"},{transform:"rotate(360deg)"}],{duration:6000,easing:"cubic-bezier(.4,.1,.3,1)"}); // orbit mengelilingi
  await c.wait(1200);
  c.run(pw,[{opacity:0,clipPath:"inset(0 50% 0 50%)",transform:"scale(.94)",filter:"brightness(.6)"},{opacity:1,clipPath:"inset(0 0 0 0)",transform:"scale(1)",filter:"brightness(1)"}],{duration:2200}); // portal membuka
  await c.wait(1500);
  c.run(lg,[{opacity:0,transform:"translate(-50%,-50%) scale(.86)"},{opacity:1,transform:"translate(-50%,-50%) scale(1)"}],{duration:1600});
  await c.wait(1100);
  await c.play(k,[{opacity:0,letterSpacing:".9em",filter:"blur(8px)"},{opacity:1,letterSpacing:".5em",filter:"blur(0)"}],{duration:1600});
  await c.wait(300);
  await c.play(ls[0],IN(),{duration:1200});await c.wait(200);
  await c.play(ls[1],IN(),{duration:1200});
  say("Congratulations to all winners");
  await c.wait(2600);
  await Promise.all([c.play(pw.parentNode,[{opacity:1},{opacity:0}],{duration:1000,fill:"forwards"}),c.play(k,[{opacity:1},{opacity:0}],{duration:1000,fill:"forwards"}),c.play(ls[0].parentNode,[{opacity:1},{opacity:0}],{duration:1000,fill:"forwards"})]);
}

/* ============ SCENE 4 — WinnerCard / WinnerPodium / WinnerCategory ============ */
function WinnerCard(cat,w){
  const nl=w.team.length,cls=nl>34?"l":nl>20?"m":"",words=esc(w.team).split(/\s+/).map(x=>'<span class="w">'+x+"</span>").join("");
  return '<div class="cr-wcard r'+w.rank+'">'+(w.rank===1?'<div class="cr-lw"><img src="'+IMG.laurel+'" alt=""></div>':"")+
  '<div class="cr-wb"><img src="'+IMG.banner+'" alt=""><span>'+RK[w.rank]+"</span></div>"+
  '<div class="cr-wp"><img src="'+IMG.plaque+'" alt=""><div class="tx"><b class="cr-nm '+cls+'">'+words+"</b></div></div>"+
  '<div class="cr-wi"><img src="'+IMG.cream+'" alt=""><div class="tx"><span class="cr-in'+(w.inst.length>24?" l":"")+'">'+esc(w.inst||" ")+'</span><span class="cr-ty">'+esc(cat.label)+(w.score?" · "+esc(w.score):"")+"</span></div></div></div>";
}
function WinnerPodium(rank,lit){const b=q(".cr-pod .n"+rank);if(b)b.classList.toggle("lit",lit)}

async function cloudWipe(c,mid){
  beat();
  const wp=q(".cr-wipe"),a=q(".cr-wipe .a"),b=q(".cr-wipe .b"),T={duration:1100,fill:"forwards"};
  c.run(wp,[{opacity:0},{opacity:1}],{duration:900,fill:"forwards"});
  c.run(a,[{transform:"translate(-105%,-50%)"},{transform:"translate(-18%,-50%)"}],T);
  await c.play(b,[{transform:"translate(105%,-50%)"},{transform:"translate(16%,-50%)"}],T);
  await mid();
  c.run(wp,[{opacity:1},{opacity:0}],{duration:1000,fill:"forwards"});
  c.run(a,[{transform:"translate(-18%,-50%)"},{transform:"translate(-105%,-50%)"}],{duration:1200,fill:"forwards"});
  await c.play(b,[{transform:"translate(16%,-50%)"},{transform:"translate(105%,-50%)"}],{duration:1200,fill:"forwards"});
}

async function winnerBeat(c,cat,w){
  beat();
  const wc=q(".cr-wc"),dim=q(".cr-dim");
  wc.innerHTML=WinnerCard(cat,w);
  const card=q(".cr-wcard",wc),banner=q(".cr-wb",wc),plq=q(".cr-wp",wc),inst=q(".cr-wi",wc),nm=qa(".cr-nm .w",wc),lw=q(".cr-lw",wc),top=w.rank===1;
  hide(banner,plq,inst,nm);
  say(RK[w.rank]+" "+cat.label+": "+w.team+(w.inst?", "+w.inst:""));
  if(top){
    c.run(q(".cr-spot"),[{opacity:0},{opacity:1}],{duration:1600});
    c.run(dim,[{opacity:.55},{opacity:.22}],{duration:1800});
    c.run(q(".cr-beamw"),[{opacity:0,transform:"scaleY(.7)"},{opacity:.7,transform:"scaleY(1)"}],{duration:2000});
    c.run(card,[{transform:"scale(.86)"},{transform:"scale(1)"}],{duration:2400});
    c.run(lw,[{opacity:0,transform:"translateX(-50%) scale(.72)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:2000});
  }else{
    c.run(dim,[{opacity:.35},{opacity:.35}],{duration:100});
  }
  await c.wait(top?500:200);
  c.run(banner,[{opacity:0,transform:"translateY(-22px)"},{opacity:1,transform:"none"}],{duration:900});
  await c.wait(350);
  c.run(plq,[{opacity:0,clipPath:"inset(0 50% 0 50%)"},{opacity:1,clipPath:"inset(0 0 0 0)"}],{duration:top?1400:1100});   // award panel membuka
  await c.wait(top?700:500);
  const el=qa(".cr-nm .w",wc);
  el.forEach((e,i)=>c.run(e,top?[{opacity:0,transform:"translateY(18px) scale(1.08)",filter:"blur(10px)",letterSpacing:".3em"},{opacity:1,transform:"none",filter:"blur(0)",letterSpacing:"0"}]:IN({y:12}),{duration:top?1500:900,delay:i*(top?160:100)}));
  await c.wait(600+el.length*(top?160:100));
  c.run(inst,IN({y:10}),{duration:1000});
  WinnerPodium(w.rank,true);
  if(top){
    const r=stage.getBoundingClientRect();dust.burst(r.width/2,r.height*.45,46);
    await c.wait(1500);dust.burst(r.width/2,r.height*.5,30);
    await c.wait(4500);
  }else await c.wait(3800);
  await c.play(card,[{opacity:1,transform:"translateY(0)"},{opacity:0,transform:"translateY(-16px)"}],{duration:900,fill:"forwards"});
  wc.innerHTML="";
  if(top){c.run(q(".cr-spot"),[{opacity:1},{opacity:0}],{duration:1200,fill:"forwards"});c.run(q(".cr-beamw"),[{opacity:.7},{opacity:0}],{duration:1200,fill:"forwards"})}
}

async function WinnerCategory(c,cat,i,n){
  beat();
  const intro=q(".cr-ci"),kick=q(".cr-ci .cr-kick"),cp=q(".cr-cp"),cn=q(".cr-cp span"),cs=q(".cr-cs"),cd=q(".cr-cd"),chip=q(".cr-chip"),cur=q(".cr-curtain"),pod=q(".cr-pod"),dim=q(".cr-dim");
  S.lastCat=cat.key;
  qa(".cr-pod b").forEach(b=>b.classList.remove("lit"));
  kick.textContent=String((H.ann?H.ann().rv.catKick:"")||"KATEGORI {n} / {total}").replace("{n}",i+1).replace("{total}",n);cn.textContent=cat.label;cs.textContent=cat.long;cd.textContent=cat.desc||"";
  q(".cr-chip span").textContent=cat.label;
  hide(kick,cp,cs,cd,chip,pod,cur);clearAnims(intro);intro.style.opacity=1;
  say("Kategori "+cat.long);
  c.run(dim,[{opacity:.3},{opacity:.3}],{duration:100});
  c.run(cur,[{opacity:0,transform:"translateY(-100%)"},{opacity:1,transform:"translateY(0)"}],{duration:1500});
  await c.wait(500);
  await c.play(kick,IN({y:8}),{duration:900});
  c.run(cp,[{opacity:0,clipPath:"inset(0 50% 0 50%)",transform:"scale(.92)"},{opacity:1,clipPath:"inset(0 0 0 0)",transform:"scale(1)"}],{duration:1500});
  await c.wait(1000);
  await c.play(cs,IN({y:8}),{duration:900});
  if(cat.desc){await c.wait(250);await c.play(cd,IN({y:8}),{duration:1000});await c.wait(2600)}else await c.wait(2000);
  c.run(cur,[{opacity:1},{opacity:0}],{duration:800,fill:"forwards"});
  await c.play(intro,[{opacity:1},{opacity:0}],{duration:800,fill:"forwards"});
  c.run(chip,[{opacity:0,transform:"translateY(-14px)"},{opacity:1,transform:"none"}],{duration:900});
  c.run(pod,[{opacity:0,transform:"translateY(24px)"},{opacity:1,transform:"none"}],{duration:1000});
  await c.wait(900);
  const wins=cat.wins;                                              // sudah urut: Juara 3 → 2 → 1
  for(const w of wins){
    if(w.rank===1){                                                 // jeda suspense sebelum Juara 1
      beat();const qe=q(".cr-q");stage.classList.add("cr-beat");
      c.run(dim,[{opacity:.35},{opacity:.6}],{duration:1400});
      c.run(q(".cr-beamw"),[{opacity:0,transform:"scaleY(.5)"},{opacity:.55,transform:"scaleY(1)"}],{duration:2200});
      await c.play(qe,[{opacity:0,letterSpacing:".5em",filter:"blur(8px)"},{opacity:1,letterSpacing:".14em",filter:"blur(0)"}],{duration:1600});
      await c.wait(1900);
      await c.play(qe,[{opacity:1},{opacity:0}],{duration:700,fill:"forwards"});
      stage.classList.remove("cr-beat");
    }
    await winnerBeat(c,cat,w);
  }
  c.run(pod,[{opacity:1},{opacity:0}],{duration:700,fill:"forwards"});
  await c.play(chip,[{opacity:1},{opacity:0}],{duration:700,fill:"forwards"});
}

/* ============ SCENE 5 — AnnouncementClosing ============ */
async function AnnouncementClosing(c){
  setScene(5);beat();
  const k=q('.cr-sc[data-s="5"] .cr-kick'),ls=qa('.cr-sc[data-s="5"] .cr-ln'),t=q(".cr-thx"),ac=q(".cr-acts");
  hide(k,ls,t,ac);ac.style.pointerEvents="none";
  c.run(q(".cr-dim"),[{opacity:.3},{opacity:0}],{duration:1500,fill:"forwards"});
  await c.wait(900);
  await c.play(ls[0],IN(),{duration:1300});await c.wait(250);
  await c.play(ls[1],IN(),{duration:1300});await c.wait(500);
  await c.play(t,IN({y:10}),{duration:1200});await c.wait(500);
  c.run(ac,IN({y:12}),{duration:1000});
  ac.style.pointerEvents="auto";
  say("Every achievement deserves to be celebrated. Thank you for being part of PRPN × ENCHANTAX 2026.");
}

/* ------------------------------------------------------------ flow control */
async function guarded(fn){try{await fn()}catch(e){if(e!==CANCEL)console.error("[PRPNReveal]",e)}}
function startIntro(){
  cancelRun();const tok=S.run;S.skip=false;resetStage();
  guarded(async()=>{const c=mkCtx(tok);await AnnouncementIntro(c);setScene(2);await MysteryReveal(c)});
}
async function fadeVeil(to,ms){
  if(!veil.parentNode)document.body.appendChild(veil);
  const from=+getComputedStyle(veil).opacity||0,a=veil.animate([{opacity:from},{opacity:to}],{duration:mq.matches?10:ms,fill:"forwards"});
  await a.finished.catch(()=>{});veil.style.opacity=to;a.cancel();if(!to)veil.remove();
}
function toFull(){document.body.appendChild(stage);stage.classList.add("cr-full");document.documentElement.classList.add("cr-lock");S.full=true;dust.resize();document.addEventListener("keydown",onKey)}
function toHome(){document.removeEventListener("keydown",onKey);home.appendChild(stage);stage.classList.remove("cr-full","cr-pv");document.documentElement.classList.remove("cr-lock");S.full=false;dust.resize()}
async function runShow(c){
  await GrandReveal(c);
  setScene(4);
  for(let i=0;i<S.cats.length;i++){
    if(i>0)await cloudWipe(c,async()=>{resetStage2()});
    await WinnerCategory(c,S.cats[i],i,S.cats.length);
  }
  await cloudWipe(c,async()=>{resetStage2();setScene(5)});
  await AnnouncementClosing(c);
}
function resetStage2(){hide(q(".cr-ci"),q(".cr-cp"),q(".cr-chip"),q(".cr-pod"),q(".cr-curtain"),q(".cr-q"),q(".cr-spot"),q(".cr-beamw"));q(".cr-wc").innerHTML=""}
function setPauseBtn(){const b=q('.cr-bar [data-a="pause"]');b.textContent=S.paused?"▶":"⏸";b.setAttribute("aria-label",S.paused?"Lanjutkan":"Jeda")}
async function unveil(){
  if(S.busy||S.full||!canUnveil())return;
  S.busy=true;cancelRun();S.paused=false;
  const tok=S.run;
  await fadeVeil(1,550);
  if(tok!==S.run){S.busy=false;fadeVeil(0,400);return}
  resetStage();toFull();stage.classList.toggle("cr-pv",!H.isPublished());setScene(3);setPauseBtn();
  const c=mkCtx(tok);fadeVeil(0,900);S.busy=false;
  try{q('.cr-bar [data-a="close"]').focus({preventScroll:true})}catch(e){}
  await guarded(()=>runShow(c));
}
async function closeFull(){
  if(!S.full||S.busy)return;S.busy=true;cancelRun();S.paused=false;
  await fadeVeil(1,450);
  resetStage();toHome();setScene(2);S.busy=false;
  const tok=++S.run;
  await MysteryReveal(mkCtx(tok),true).catch(()=>{});
  await fadeVeil(0,600);
  const b=q('.cr-btn[data-a="unveil"]');if(b)try{b.focus({preventScroll:true})}catch(e){}
}
function onKey(e){
  if(!S.full)return;
  if(e.key==="Escape"){e.preventDefault();closeFull()}
  else if(e.key===" "&&e.target.tagName!=="BUTTON"){e.preventDefault();pause()}
}
function pause(){
  S.paused=!S.paused;
  stage.getAnimations({subtree:true}).forEach(a=>{if(isWA(a))try{S.paused?a.pause():a.play()}catch(e){}});
  setPauseBtn();
}
function skip(){if(S.paused)pause();S.skip=true}
function replay(){
  if(S.busy||!S.full)return;cancelRun();S.paused=false;setPauseBtn();
  S.cats=getCats();if(!S.cats.length)return;
  resetStage();setScene(3);
  guarded(()=>runShow(mkCtx(S.run)));
}
async function share(){
  const url=location.href.split("#")[0]+"#juara",data={title:"Pengumuman Juara PRPN × ENCHANTAX 2026",text:"Selamat kepada para juara PRPN × ENCHANTAX 2026! 🏆",url};
  try{if(navigator.share){await navigator.share(data);return}await navigator.clipboard.writeText(url);H.toast("Tautan pengumuman disalin ✅")}
  catch(e){if(e&&e.name==="AbortError")return;H.toast("Salin tautan ini: "+url)}
}
function onAction(e){
  const b=e.target.closest("[data-a]");if(!b||!stage.contains(b))return;
  const a=b.dataset.a;
  if(a==="unveil")unveil();
  else if(a==="pause")pause();
  else if(a==="skip")skip();
  else if(a==="replay")replay();
  else if(a==="close")closeFull();
  else if(a==="all"){const k=S.lastCat||(S.cats[0]&&S.cats[0].key)||"esai";closeFull().then(()=>H.onViewAll(k))}
  else if(a==="home"){closeFull().then(()=>H.onHome())}
  else if(a==="share")share();
}

/* ------------------------------------------------------------ mount */
function build(){
  const st=(n,l)=>'<img class="cr-tw" src="'+IMG.star+'" alt="" style="left:'+l[0]+'%;top:'+l[1]+'%;--s:'+l[2]+'px;--t:'+l[3]+'s;--d:'+l[4]+'s">';
  stage=document.createElement("div");stage.id="crx";stage.className="cr";stage.setAttribute("role","region");stage.setAttribute("aria-label","Pengumuman Juara PRPN × ENCHANTAX 2026");
  stage.innerHTML=
  '<div class="cr-bgfx" aria-hidden="true"><div class="cr-glow"></div><div class="cr-gather"></div>'+
  '<div class="cr-p" data-d=".3"><div class="cr-ring-s"><img class="cr-ring" src="'+IMG.ring+'" alt=""></div></div>'+
  '<div class="cr-p" data-d=".55"><div class="cr-orbit-sw"><div class="cr-orbit-s"><img class="cr-orbit" src="'+IMG.orbit+'" alt=""></div></div></div>'+
  '<div class="cr-p" data-d=".9"><img class="cr-cloud a" src="'+IMG.cloudL+'" alt=""><img class="cr-cloud b" src="'+IMG.cloudR+'" alt=""></div>'+
  '<div class="cr-p" data-d=".7">'+[[18,24,26,4.2,0],[80,18,20,5.1,1.2],[12,68,18,3.8,2.1],[86,62,28,4.6,.6],[50,10,16,5.5,2.8]].map((l,i)=>st(i,l)).join("")+"</div>"+
  '<canvas class="cr-dust"></canvas><div class="cr-dim"></div><div class="cr-spot"></div><div class="cr-beamw"><img class="cr-beam" src="'+IMG.beam+'" alt=""></div></div>'+
  /* scene 1 */
  '<div class="cr-sc" data-s="1"><div class="cr-kick">THE MOMENT IS NEAR</div><p class="cr-h"><span class="cr-ln">Something Extraordinary</span><span class="cr-ln">Is About to Be Revealed.</span></p><div class="cr-foot">PRPN × ENCHANTAX 2026</div></div>'+
  /* scene 2 */
  '<div class="cr-sc" data-s="2"><div class="cr-t2"><img src="'+IMG.plaque+'" alt=""><span>THE WAIT IS ALMOST OVER</span></div>'+
  '<div class="cr-cw cr-p" data-d="1.1" style="position:relative;display:block;inset:auto"><div class="cr-cwp"><div class="cr-float"><div class="cr-card"><img class="cr-lb" src="'+IMG.laurel+'" alt=""><img class="cr-gl" src="'+IMG.spark+'" alt="">'+
  '<div class="cr-face"><img class="cr-seal" src="'+IMG.star+'" alt=""><div class="cr-rks"><b>III</b><b>II</b><b>I</b></div><small>PRPN × ENCHANTAX</small><div class="cr-sheen"></div></div>'+
  '<img class="cr-cc l" src="'+IMG.cloudL+'" alt=""><img class="cr-cc r" src="'+IMG.cloudR+'" alt=""></div></div></div></div>'+
  '<button class="cr-btn" data-a="unveil" type="button">UNVEIL THE WINNERS</button></div>'+
  /* scene 3 */
  '<div class="cr-sc" data-s="3"><div class="cr-kick">THE MOMENT HAS ARRIVED</div><div class="cr-pw"><img class="cr-portal" src="'+IMG.portal+'" alt=""><div class="cr-logo"><img class="cr-lc" alt="PRPN × ENCHANTAX"><img class="cr-lgd" alt=""></div></div>'+
  '<p class="cr-h cr-big"><span class="cr-ln">CONGRATULATIONS</span><span class="cr-ln">TO ALL WINNERS</span></p></div>'+
  /* scene 4 */
  '<div class="cr-sc" data-s="4"><div class="cr-curtain"><img src="'+IMG.curtain+'" alt=""></div>'+
  '<div class="cr-ci"><div class="cr-kick"></div><div class="cr-cp"><img src="'+IMG.plaque+'" alt=""><span></span></div><div class="cr-cs"></div><div class="cr-cd"></div></div>'+
  '<div class="cr-chip"><img src="'+IMG.banner+'" alt=""><span></span></div><div class="cr-q">AND THE CHAMPION IS…</div><div class="cr-wc"></div>'+
  '<div class="cr-pod"><img src="'+IMG.podium+'" alt=""><b class="n2">2</b><b class="n1">1</b><b class="n3">3</b></div></div>'+
  /* scene 5 */
  '<div class="cr-sc" data-s="5"><div class="cr-kick">PRPN × ENCHANTAX 2026</div><p class="cr-h cr-s5-h"><span class="cr-ln">EVERY ACHIEVEMENT</span><span class="cr-ln">DESERVES TO BE CELEBRATED.</span></p>'+
  '<p class="cr-thx">Thank You for Being Part of PRPN × ENCHANTAX 2026.</p>'+
  '<div class="cr-acts" style="pointer-events:none"><button class="cr-btn" data-a="all" type="button">Lihat Seluruh Pemenang</button><button class="cr-btn ghost" data-a="home" type="button">Kembali ke Halaman Utama</button><button class="cr-btn ghost" data-a="share" type="button">Bagikan Pengumuman</button></div></div>'+
  '<div class="cr-wipe" aria-hidden="true"><img class="a" src="'+IMG.cloudL+'" alt=""><img class="b" src="'+IMG.cloudR+'" alt=""></div>'+
  '<div class="cr-prev">PREVIEW PANITIA — BELUM DISAHKAN</div>'+
  '<div class="cr-bar"><button type="button" data-a="pause" aria-label="Jeda">⏸</button><button type="button" data-a="skip" aria-label="Lewati bagian ini">⏭</button><button type="button" data-a="replay" aria-label="Putar ulang">↻</button><button type="button" data-a="close" aria-label="Tutup">✕</button><span class="cr-scn"></span></div>'+
  '<div class="cr-sr" aria-live="polite"></div>';
  const lg=H.logo;q(".cr-lc").src=lg.core;q(".cr-lgd").src=lg.gold;S.par=qa(".cr-p");S.card=q(".cr-card");
  home.appendChild(stage);
  veil=document.createElement("div");veil.className="cr-veil";
}

function init(h){
  if(stage)return;
  H=h;home=document.querySelector(h.mount);if(!home)return;
  build();dust=Dust(q(".cr-dust"));
  on(stage,"click",onAction);
  on(stage,"pointermove",e=>{const r=stage.getBoundingClientRect();S.tx=clamp((e.clientX-r.left)/r.width-.5,-.5,.5)*2;S.ty=clamp((e.clientY-r.top)/r.height-.5,-.5,.5)*2});
  on(stage,"pointerleave",()=>{S.tx=0;S.ty=0});
  on(window,"resize",()=>{if(S.active)dust.resize()});
  // Scene 1 diputar saat halaman Pengumuman Juara dibuka (terlihat di layar); dihentikan saat ditinggalkan
  io=new IntersectionObserver(es=>es.forEach(e=>{
    if(S.full)return;
    if(e.intersectionRatio>=.45&&!S.active){loopOn();startIntro()}
    else if(e.intersectionRatio<.08&&S.active){cancelRun();loopOff();resetStage();qa(".cr-sc").forEach(x=>x.classList.remove("on"))}
  }),{threshold:[0,.08,.45,.8]});
  io.observe(home);
  // gambar dimuat lebih awal supaya reveal tidak patah-patah
  Object.values(IMG).forEach(u=>{const i=new Image();i.src=u});
}
function destroy(){
  loopOff();cancelRun();if(stage)clearAnims();off.splice(0).forEach(f=>f());
  if(io)io.disconnect();document.removeEventListener("keydown",onKey);document.documentElement.classList.remove("cr-lock");
  if(veil)veil.remove();if(stage)stage.remove();stage=null;
}
window.PRPNReveal={init,destroy,replay:()=>S.full?replay():startIntro()};
})();
