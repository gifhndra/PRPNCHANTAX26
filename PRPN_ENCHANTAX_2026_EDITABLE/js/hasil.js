/* ==========================================================================
   PRPN × ENCHANTAX 2026 — Hasil Lengkap (js/hasil.js)
   Overlay #rev yang tampil lewat tombol "Hasil lengkap" / "Lihat Seluruh Pemenang".
   Dipasang dari app.js: PRPNHasil.init({cats, getWinners, confetti}); PRPNHasil.open(kunciKategori)
   Semua teks diatur dari Dashboard Panitia → Konten Web → 🏆 Pengumuman.
   ========================================================================== */
(function(){
"use strict";
const A="assets/cinematic/";
const IMG={ring:A+"02_ornamental_house_wreath.png",laurel:A+"03_golden_laurel_crown.png",cloudL:A+"04_cloud_cluster_left.png",podium:A+"05_three_level_winner_podium.png",
plaque:A+"06_navy_gold_title_plaque.png",banner:A+"07_red_gold_reveal_banner.png",cream:A+"08_cream_gold_info_plaque.png",beam:A+"09_golden_light_beam.png",
orbit:A+"11_golden_orbit_ribbon.png",curtain:A+"12_royal_red_curtain.png",star:A+"13_four_point_star.png",cloudR:A+"14_cloud_cluster_right.png",glitter:A+"15_golden_glitter_strand.png"};

/* ---------- TEKS: dikelola dari Dashboard Panitia → Konten Web → 🏆 Pengumuman (default di DEF.ann pada app.js) ---------- */
const T=()=>H.ann().hl;
const CAT=k=>H.ann().cat[k]||{};
const ORDER=["lcc","esai","policy","infografis"];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const REAL=v=>{v=String(v==null?"":v).trim();return v&&!/^(nama juara\b.*|asal (kampus|sekolah).*|\[placeholder\].*|[-—–]+)$/i.test(v)};

let H=null,root=null,cur=null,built=false,sw=0,bound=false;
const $=(s)=>root.querySelector(s);

function keys(){return[...ORDER.filter(k=>k in H.cats),...Object.keys(H.cats).filter(k=>!ORDER.includes(k))]}
function entry(k,i){const e=((H.getWinners()||{})[k]||[])[i]||[];return{team:REAL(e[0])?String(e[0]).trim():"",inst:REAL(e[1])?String(e[1]).trim():"",score:REAL(e[2])?String(e[2]).trim():""}}

function col(rank,w){
  const t=T(),has=!!w.team,nl=w.team.length,cls=!has?"soon":nl>34?"l":nl>20?"m":"",inst=has?w.inst:t.soonInst;
  return '<div class="hl-col r'+rank+'" style="--o:'+(3-rank)+'">'+
    (rank===1?'<div class="hl-bm"><img src="'+IMG.beam+'" alt=""></div><div class="hl-lw"><img src="'+IMG.laurel+'" alt=""></div>':"")+
    '<div class="hl-b"><img src="'+IMG.banner+'" alt=""><span>'+t['r'+rank]+'</span></div>'+
    '<div class="hl-p"><img src="'+IMG.plaque+'" alt=""><div class="tx"><b class="hl-nm '+cls+'">'+esc(has?w.team:t.soon)+'</b></div></div>'+
    '<div class="hl-i"><img src="'+IMG.cream+'" alt=""><div class="tx"><span class="hl-in1'+(inst.length>16?" l":"")+'">'+esc(inst||" ")+'</span>'+(has&&w.score?'<span class="hl-sc">Nilai '+esc(w.score)+'</span>':"")+'</div></div>'+
    (has?'<p class="hl-cap">'+t['c'+rank]+'</p>':"")+'</div>';
}

function paint(){
  const t=T(),st=(l)=>'<img class="hl-tw" src="'+IMG.star+'" alt="" style="left:'+l[0]+'%;top:'+l[1]+'%;--s:'+l[2]+'px;--t:'+l[3]+'s;--d:'+l[4]+'s">';
  root.classList.add("hl");root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label",t.title);
  root.innerHTML=
  '<div class="hl-bg" aria-hidden="true"><div class="hl-glow"></div><div class="hl-ring"><img src="'+IMG.ring+'" alt=""></div><div class="hl-orbit"><img src="'+IMG.orbit+'" alt=""></div>'+
  '<img class="hl-cloud a" src="'+IMG.cloudL+'" alt=""><img class="hl-cloud b" src="'+IMG.cloudR+'" alt="">'+
  '<img class="hl-glit a" src="'+IMG.glitter+'" alt=""><img class="hl-glit b" src="'+IMG.glitter+'" alt="">'+
  [[16,22,26,4.2,0],[82,16,20,5.1,1.2],[10,66,18,3.8,2.1],[88,60,28,4.6,.6],[50,8,16,5.5,2.8],[30,82,20,4.9,1.7],[70,86,22,5.3,.3]].map(st).join("")+'</div>'+
  '<div class="hl-scroll">'+(t.kicker?'<div class="hl-kick">'+esc(t.kicker)+'</div>':'')+
  '<div class="hl-ttl"><div class="hl-curtain" aria-hidden="true"><img src="'+IMG.curtain+'" alt=""></div><div class="hl-plq" role="heading" aria-level="2"><img src="'+IMG.plaque+'" alt=""><span>'+esc(t.title)+'</span></div></div>'+
  (t.sub?'<p class="hl-sub">'+esc(t.sub)+'</p>':'')+'<div class="hl-tabs" role="tablist"></div><p class="hl-tag" aria-live="polite"></p>'+
  '<div class="hl-stage"></div>'+
  (t.note?'<p class="hl-note">'+esc(t.note)+'</p>':'')+'<div class="hl-act"><button type="button" class="go" data-a="replay">↻ '+esc(t.replay)+'</button><button type="button" class="gh" data-a="close">'+esc(t.close)+' ✕</button></div></div>';
  const tabs=$(".hl-tabs");
  keys().forEach(k=>{const b=document.createElement("button");b.type="button";b.dataset.k=k;b.setAttribute("role","tab");b.textContent=H.cats[k];tabs.append(b)});
  if(!bound){
    bound=true;
    root.addEventListener("click",e=>{
      const b=e.target.closest("button");if(!b||!root.contains(b))return;
      if(b.dataset.k){render(b.dataset.k,true)}
      else if(b.dataset.a==="close")close();
      else if(b.dataset.a==="replay")open(keys()[0],true);
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&root.classList.contains("show"))close()});
    Object.values(IMG).forEach(u=>{const i=new Image();i.src=u});
  }
  built=true;
}

function render(k,burst){
  if(!built||!root.classList.contains("show"))return;
  if(!(k in H.cats))k=keys()[0];
  cur=k;
  root.querySelectorAll(".hl-tabs button").forEach(b=>{const on=b.dataset.k===k;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
  $(".hl-tag").textContent=CAT(k).tag||T().tagDefault||"";
  $(".hl-stage").innerHTML=col(2,entry(k,1))+col(1,entry(k,0))+col(3,entry(k,2));
  const sc=$(".hl-scroll");
  sc.classList.remove("hl-swap","hl-fin");void sc.offsetWidth;sc.classList.add("hl-swap","hl-fin");
  if(burst&&H.confetti){const t=++sw;setTimeout(()=>{if(t===sw&&root.classList.contains("show"))H.confetti(90)},innerWidth<=760?600:1500)}
}

function open(k,replay){
  paint();
  root.classList.add("show");
  const sc=$(".hl-scroll");sc.scrollTop=0;
  root.classList.remove("hl-in");void root.offsetWidth;root.classList.add("hl-in");
  render(k||cur||keys()[0],true);
  if(replay)H.confetti&&H.confetti(160);
  try{$(".hl-act .gh").focus({preventScroll:true})}catch(e){}
}
function close(){root.classList.remove("show");++sw}

function init(h){H=h;root=document.getElementById("rev");if(!root)return}
window.PRPNHasil={init,open,render,close};
})();
