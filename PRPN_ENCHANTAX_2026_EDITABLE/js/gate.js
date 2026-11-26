/* ============================================================
   GERBANG PENGUMPULAN KARYA
   Kartu "Kumpulkan Karyamu" terkunci. Peserta mengisi email ketua + nama tim;
   dicocokkan ke Google Sheet (lewat Apps Script, aksi "check"). Hanya jika status
   Konfirmasi = Verified, kartu cabang tim itu terbuka.
   ============================================================ */
const GATE={ok:null,KEY:"prpn_gate"};
const gNorm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();

/* cocokkan jenis lomba dari sheet dengan kartu cabang (nama/id). Bila tidak ada yang cocok, semua kartu dibuka. */
function gMatch(card,v){
  const n=gNorm(card.dataset.bn),i=gNorm(card.dataset.bid),k=v.kode||"",c=gNorm(v.cabang);
  const KW={lcc:/lcc|cerdas|cermat/,cfp:/cfp|call|paper|esai|essay|policy/,infografis:/info/};
  if(k&&KW[k]&&(KW[k].test(n)||KW[k].test(i)))return true;
  return !!(c&&n&&(n===c||n.includes(c)||c.includes(n)))}
function gAnyMatch(v){return [...document.querySelectorAll("#subs .sub-c")].some(d=>gMatch(d,v))}

function gApply(){
  const S=document.getElementById("subs"),G=document.getElementById("gate");if(!S||!G)return;
  G.hidden=S.hidden;
  const v=GATE.ok,all=v&&!gAnyMatch(v);
  S.querySelectorAll(".sub-c").forEach(d=>{const open=!!v&&(all||gMatch(d,v));if(open)d.removeAttribute("inert");else d.setAttribute("inert","")});
  const m=document.getElementById("gm"),b=document.getElementById("gb"),x=document.getElementById("gx");
  if(v){document.getElementById("ge").value=v.email;document.getElementById("gt").value=v.tim;
    m.innerHTML=`<div class="ok">✅ Terverifikasi: ${esc(v.tim)}${v.cabang?" ("+esc(v.cabang)+")":""}. Silakan centang ketentuan lalu kumpulkan karyamu.</div>`;
    b.hidden=true;x.hidden=false;document.getElementById("ge").readOnly=document.getElementById("gt").readOnly=true}
  else{b.hidden=false;x.hidden=true;document.getElementById("ge").readOnly=document.getElementById("gt").readOnly=false}}

/* ---------- detail status (Improvement / Rejected / menunggu) ---------- */
const gH=s=>esc(s).replace(/\n/g,"<br>");
const G_ST={
  improvement:{c:"gs-imp",l:"Improvement (perlu perbaikan)",d:"Data pendaftaran timmu sudah kami terima, tetapi masih ada bagian yang perlu diperbaiki sebelum dapat diverifikasi. Baca keterangan panitia di bawah, lakukan perbaikan sesuai arahan, lalu hubungi narahubung LO bila masih ada yang kurang jelas. Setelah berstatus Verified, pengumpulan karya akan terbuka untuk timmu."},
  rejected:{c:"gs-rej",l:"Rejected (ditolak)",d:"Pendaftaran timmu belum dapat diterima oleh panitia. Baca alasan dari panitia di bawah. Jika merasa ada kekeliruan atau ingin bertanya lebih lanjut, silakan hubungi narahubung LO terkait."},
  registered:{c:"gs-reg",l:"Registered (menunggu verifikasi)",d:"Pendaftaran timmu sudah masuk, tetapi belum diverifikasi oleh panitia. Mohon tunggu konfirmasi dari panitia. Bila sudah cukup lama, silakan hubungi narahubung LO terkait."}
};
/* narahubung LO terkait cabang tim; daftar diatur panitia di Dashboard > Konten Web > Pengumpulan */
function gLO(v){
  try{
    const all=(Array.isArray(CT.kumpulLO)?CT.kumpulLO:[]).filter(x=>x&&x.t);
    if(!all.length)return[];
    const ids=(CT.branches||[]).filter(b=>b&&b.on!==false&&gMatch({dataset:{bn:b.name||"",bid:b.id||""}},v)).map(b=>b.id);
    return all.filter(x=>!x.b||!ids.length||ids.includes(x.b))
  }catch(e){return[]}}
function gLOHtml(v){
  const L=gLO(v);
  if(!L.length)return"<p>Narahubung LO belum diisi panitia. Silakan cek bagian Narahubung di halaman Portal.</p>";
  return`<div class="lo">${L.map(x=>{
    const u=typeof toLink==="function"?toLink(x.u):"",inner=`<span class="lo-ic">${esc(x.ic||"💬")}</span><span class="lo-tx"><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:""}</span>`;
    return u?`<a class="lo-i" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${inner}</a>`:`<div class="lo-i">${inner}</div>`}).join("")}</div>`}
function gDetail(j){
  const key=String(j.status||"").toLowerCase(),st=G_ST[key];
  /* backend lama (belum versi 9) tidak mengirim status: tampilkan pesan umum + narahubung */
  if(!st)return`<div class="bad">Tim kamu ditemukan, tetapi belum berstatus <b>Verified</b>. Tunggu konfirmasi panitia atau cek informasi perbaikan dari panitia.</div><div class="gd"><h4>☎️ Narahubung LO terkait</h4>${gLOHtml(j)}</div>`;
  const note=String(j.keterangan||"").trim();
  return`<div class="gd"><h4>📋 Penjelasan</h4><p>${esc(st.d)}</p>
<h4>📌 Status sekarang</h4><p><span class="gs ${st.c}">${esc(st.l)}</span>${j.tim?` <small>· ${esc(j.tim)}${j.cabang?" ("+esc(j.cabang)+")":""}</small>`:""}</p>
<h4>📝 Keterangan dari panitia</h4><p>${note?gH(note):"<i>Belum ada keterangan dari panitia.</i>"}</p>
<h4>☎️ Narahubung LO terkait</h4>${gLOHtml(j)}</div>`}

async function gCheck(email,tim,silent){
  const b=document.getElementById("gb"),m=document.getElementById("gm");
  if(!silent){b.disabled=true;b.textContent="Memeriksa…";m.innerHTML=""}
  try{
    const r=await fetch(KONF.API+"?action=check&email="+encodeURIComponent(email)+"&tim="+encodeURIComponent(tim),{redirect:"follow"});
    const j=await r.json();
    if(!(j.v>=7))throw Error("Script Apps Script di server belum versi terbaru (masih ada kode lama). Panitia: hapus semua isi Apps Script, tempel hanya apps-script/Code.gs yang baru, lalu Deploy > New version.");
    if(!j.ok)throw Error(j.error||"Gagal memeriksa");
    if(j.verified){GATE.ok={email,tim:j.tim||tim,cabang:j.cabang||"",kode:j.kode||""};try{localStorage.setItem(GATE.KEY,JSON.stringify({email,tim}))}catch(e){}if(!silent&&typeof confetti==="function")confetti(60)}
    else{GATE.ok=null;try{localStorage.removeItem(GATE.KEY)}catch(e){}
      if(!silent)m.innerHTML=j.found?gDetail(j):`<div class="bad">Data tidak ditemukan. Pastikan email ketua dan nama tim persis sama dengan yang diisi di formulir pendaftaran.</div>`}
  }catch(e){GATE.ok=null;if(!silent)m.innerHTML=`<div class="bad">${esc(e.message||String(e))}</div>`}
  if(!silent){b.disabled=false;b.textContent="🔓 Cek & buka kunci"}
  gApply()}

(function(){
  const S=document.getElementById("subs"),G=document.getElementById("gate");if(!S||!G)return;
  const go=()=>{const e=document.getElementById("ge").value.trim(),t=document.getElementById("gt").value.trim();
    if(!/^\S+@\S+\.\S+$/.test(e))return toast("Isi email ketua dengan benar");if(!t)return toast("Isi nama tim");gCheck(e,t)};
  document.getElementById("gb").onclick=go;
  ["ge","gt"].forEach(i=>document.getElementById(i).onkeydown=ev=>{ev.stopPropagation();if(ev.key==="Enter")go()});
  document.getElementById("gx").onclick=()=>{GATE.ok=null;try{localStorage.removeItem(GATE.KEY)}catch(e){}document.getElementById("gm").innerHTML="";["ge","gt"].forEach(i=>document.getElementById(i).value="");gApply()};
  /* kartu dibangun ulang oleh cms.js setiap konten berubah: terapkan kunci lagi */
  new MutationObserver(gApply).observe(S,{childList:true,attributes:true,attributeFilter:["hidden"]});
  gApply();
  /* ingat verifikasi, tetapi periksa ulang ke sheet setiap halaman dibuka (bila dicabut, kunci menutup lagi) */
  try{const sv=JSON.parse(localStorage.getItem(GATE.KEY)||"null");if(sv&&sv.email&&sv.tim)gCheck(sv.email,sv.tim,true)}catch(e){}
})();
