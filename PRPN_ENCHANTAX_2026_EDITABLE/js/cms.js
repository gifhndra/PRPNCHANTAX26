/* =====================================================================
   cms.js  —  Seluruh konten website diatur dari Dashboard Panitia
   Dimuat SETELAH js/app.js. Menimpa renderer lama dengan versi dinamis
   dan menambah tab "🛠️ Konten Web" di panel panitia.
   Penyimpanan memakai persist() milik app.js (database bila aktif,
   selain itu localStorage) + ekspor/impor data/content.json.
   ===================================================================== */

/* ---------- util ---------- */
function toLink(v){v=String(v||"").trim();if(!v)return"";if(/^(https?:\/\/|mailto:|tel:)/i.test(v))return v;
  if(/^@[\w.]{2,}$/.test(v))return"https://instagram.com/"+v.slice(1);
  const dg=v.replace(/[\s().-]/g,"");if(/^\+?\d{8,15}$/.test(dg)){let n=dg.replace(/^\+/,"");if(n[0]==="0")n="62"+n.slice(1);return"https://wa.me/"+n}
  if(/^\/\//.test(v))return"https:"+v;if(/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v))return"https://"+v;return""}
const nl2br=s=>esc(s).replace(/\n/g,"<br>");
const slug=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24);
function imgData(file,max=480){return new Promise((res,rej)=>{if(!file)return rej(Error("Pilih gambar dulu"));
  if(!/^image\//.test(file.type))return rej(Error("File harus berupa gambar"));
  const fr=new FileReader();fr.onerror=()=>rej(Error("Gagal membaca file"));
  fr.onload=()=>{if(file.type==="image/svg+xml"||file.type==="image/gif")return file.size>300000?rej(Error("SVG/GIF maksimal 300 KB")):res(fr.result);
    const im=new Image();im.onerror=()=>rej(Error("Gambar tidak dapat dibaca"));
    im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
      const x=c.getContext("2d");x.drawImage(im,0,0,c.width,c.height);const alpha=/png|webp/.test(file.type);
      let o=alpha?c.toDataURL("image/webp",.85):c.toDataURL("image/jpeg",.82);if(alpha&&!/^data:image\/webp/.test(o))o=c.toDataURL("image/png");res(o)};
    im.src=fr.result};fr.readAsDataURL(file)})}
const imgUp=f=>imgData(f,900);
async function cmsDownload(name,text){const b=new Blob([text],{type:"application/json"});
  try{const d=await claude.use("downloads");if(d){await d.save({filename:name,data:b});return}}catch(e){}
  try{const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}catch(e){await saveFile(name,text,"application/json")}}

/* ---------- sinkronisasi cabang lomba -> LB ---------- */
function syncLB(){Object.keys(LB).forEach(k=>delete LB[k]);(CT.branches||[]).forEach(b=>{if(b&&b.id){LB[b.id]=b.name||b.id;if(!WIN[b.id])WIN[b.id]=[[],[],[]]}})}
const actBr=()=>(CT.branches||[]).filter(b=>b&&b.on!==false);

/* ---------- 1. Informasi umum ---------- */
function applyGen(){const g=CT.gen||{},set=(s,v)=>{const e=$(s);if(e&&v!=null&&v!=="")e.textContent=v};
  set(".brand",g.brand);set("#hero .wel",g.welcome);set("#hero .ttl",g.title);set("#hero .hero-in .sub",g.tagline);set("footer",g.footer);
  if(g.title)document.title=g.title+" – Portal Pendaftaran"}
let cmsAb=0;
tab=function(i){if(!AB[i])i=0;const a=AB[i];if(!a)return;cmsAb=i;const[t,d,c,m]=a;
  $("#pane").innerHTML=`<h3>${esc(t)}</h3><p>${nl2br(d)}</p><div class="chips">${(c||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>`;
  const p=$("#pane");p.style.animation="none";p.offsetWidth;p.style.animation="";$("#am").dataset.c=m;crop();$$("#tabs button").forEach((b,j)=>b.classList.toggle("on",cmsAb===j))};
function buildAbout(){const g=CT.gen||{},cr=["95,5,100,160","80,175,115,165","335,5,110,160","330,180,115,160"];
  AB=(g.about||[]).map((a,i)=>[a.t||"",a.d||"",a.c||[],cr[i%cr.length]]);
  AB.push(["Cabang Lomba",g.branchIntro||"",actBr().map(b=>b.name),cr[2]]);
  $("#tabs").innerHTML=AB.map((a,i)=>`<button data-t="${i}">${esc(a[0])}</button>`).join("");
  $$("#tabs button").forEach(b=>b.onclick=()=>tab(+b.dataset.t));tab(Math.min(cmsAb,AB.length-1))}

/* ---------- 2. Cabang lomba (kartu pendaftaran + pengumpulan) ---------- */
function pickCat(c,fromUser){const r=$("#reg");$$(".cat").forEach(x=>{x.classList.remove("sel");$(".pick",x).textContent="Ketuk untuk memilih"});
  c.classList.add("sel");$(".pick",c).textContent="✓ Terpilih";cat=c.dataset.c;r.removeAttribute("disabled");r.textContent="Daftar "+$("h3",c).textContent+" →";
  const b=(CT.branches||[]).find(x=>x.id===cat);go(r,toLink(b&&b.daftar));if(fromUser)c.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"})}
function buildCats(){const T=$("#track"),act=actBr(),keep=cat;
  T.innerHTML=act.map(b=>`<div class="card cat" data-c="${esc(b.id)}"><div class="ic">${esc(b.ic)}</div><h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p><span class="pick">Ketuk untuk memilih</span></div>`).join("")||'<div class="empty">Belum ada cabang lomba yang aktif.</div>';
  $$(".cat",T).forEach(c=>c.onclick=()=>{if(mv){mv=0;return}pickCat(c,true)});
  const r=$("#reg"),k=keep&&$$(".cat",T).find(c=>c.dataset.c===keep);
  if(k)pickCat(k,false);else{cat=null;r.setAttribute("disabled","");r.textContent="Pilih cabang dulu ☝️";go(r,"")}}
function buildSubs(){const S=$("#subs");S.innerHTML="";const act=actBr();
  act.forEach(b=>{const d=document.createElement("div");d.className="card sub-c";d.dataset.bid=b.id||"";d.dataset.bn=b.name||"";
    d.innerHTML=`<h3>${esc(b.ic)} ${esc(b.name)}</h3>${CK.map(c=>`<label class="ck"><input type="checkbox"> ${c}</label>`).join("")}<div class="meter"><i></i></div><a class="btn gold" disabled>Kumpulkan ${esc(b.name)} ✈️</a>`;
    const a=$(".btn",d),cs=$$("input",d);go(a,toLink(b.kumpul));
    cs.forEach(c=>c.onchange=()=>{const n=cs.filter(x=>x.checked).length;$(".meter i",d).style.width=n/3*100+"%";if(n===3)a.removeAttribute("disabled");else a.setAttribute("disabled","")});
    a.addEventListener("click",()=>{const p=document.createElement("div");p.className="plane";p.textContent="✈️";const r=a.getBoundingClientRect();p.style.left=r.left+"px";p.style.top=r.top+"px";document.body.append(p);
      requestAnimationFrame(()=>{p.style.transform="translate(60vw,-70vh) rotate(-20deg) scale(.3)";p.style.opacity=0});setTimeout(()=>p.remove(),2100)});S.append(d)});
  S.hidden=!act.some(b=>toLink(b.kumpul))}

/* ---------- 3. Tautan, narahubung ---------- */
function applyLinks(){$$("[data-link]").forEach(a=>{const k=a.dataset.link;if(CT.links&&k in CT.links)go(a,toLink(CT.links[k]))})}
function renderContacts(){const C=$(".cons");if(!C)return;
  C.innerHTML=(CT.contacts||[]).map((c,i)=>`<a class="card con" data-i="${i}"><div class="ic">${esc(c.ic||"📞")}</div><h3>${esc(c.t)}</h3><small>${esc(c.s)}</small></a>`).join("")||'<div class="empty">Narahubung belum diisi panitia.</div>';
  $$(".con",C).forEach(a=>go(a,toLink(CT.contacts[+a.dataset.i].u)))}

/* ---------- 4. Info: dokumen persyaratan + penilaian ---------- */
renderInfo=function(){$$("#itabs button").forEach(b=>b.classList.toggle("on",b.dataset.i===it));const P=$("#ipane");
  if(it==="req")P.innerHTML=(CT.req||[]).map((r,i)=>{const u=toLink(r.l);
    return`<details ${i?"":"open"}><summary>${esc(r.t)}</summary><p>${r.d?nl2br(r.d):(u?"":"<i>Belum diisi panitia.</i>")}</p>${u?`<p><a class="btn" href="${esc(u)}" target="_blank" rel="noopener noreferrer">📎 ${esc(r.lt||"Buka dokumen")}</a></p>`:""}</details>`}).join("")||'<div class="empty">Persyaratan belum diisi panitia.</div>';
  else{const act=actBr();if(!act.some(b=>b.id===ic))ic=act[0]?act[0].id:"";const rows=CT.crit[ic]||[],tot=rows.reduce((s,r)=>s+(+r.w||0),0);
    P.innerHTML=`<div class="tabs">${act.map(b=>`<button class="${ic===b.id?"on":""}" data-k="${esc(b.id)}">${esc(b.name)}</button>`).join("")}</div>`+
    (rows.map(r=>`<div class="rrow"><b>${esc(r.i)}</b> <span style="float:right">${r.w==null||r.w===""?"—":esc(r.w)+"%"}</span><div class="rb"><i style="width:${+r.w||0}%"></i></div></div>`).join("")||'<div class="empty">Belum ada rubrik.</div>')+
    (tot?`<p class="note" style="color:var(--mut);font-size:13px">Total bobot: <b>${tot}%</b></p>`:"")}
  $$("#ipane .tabs button").forEach(b=>b.onclick=()=>{ic=b.dataset.k;renderInfo()})};

/* ---------- 5. Juri & mitra ---------- */
renderTim=function(){$("#judges").innerHTML=(CT.judges||[]).map(j=>`<div class="card jc"><div class="av">${j.p?`<img src="${esc(j.p)}" alt="Foto ${esc(j.n)}" loading="lazy">`:esc((j.n||"?")[0])}</div><b>${esc(j.n)}</b><small>${esc(j.r)}</small><small>${esc(j.o)}</small><small>${esc(j.x)}</small></div>`).join("")||'<div class="empty">Dewan juri belum diumumkan.</div>';
  $("#spons").innerHTML=Object.keys(CT.spons||{}).map(g=>`<div style="grid-column:1/-1;text-align:left;font:700 15px Fredoka;color:var(--wine)">${esc(g)}</div>`+CT.spons[g].map(s=>{const u=toLink(s.u),inner=s.l?`<img src="${esc(s.l)}" alt="${esc(s.n)}" loading="lazy" style="max-width:100%;max-height:60px">`:esc(s.n);
    return u?`<a class="lg" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${inner}</a>`:`<div class="lg">${inner}</div>`}).join("")).join("")};

/* ---------- 6. Materi pendukung: animasi "deal" — semua kartu langsung terlihat ---------- */
let dealQ="";
function buildDeal(){const H=$("#deal");if(!H)return;const M=CT.materi||[],sr=$("#dsr");
  H.innerHTML=M.map((m,i)=>`<article class="card dcard" data-q="${esc((m.t+" "+m.d).toLowerCase())}" style="--i:${i};--rot:${((i%3)-1)*2.2+(i%2?.8:-.8)}deg"><div class="dglow"></div><div class="dic">${esc(m.ic||"📄")}</div><h3>${esc(m.t)}</h3><p>${esc(m.d)}</p><a class="btn" data-mi="${i}">${esc(m.b||"Buka materi")}</a></article>`).join("")||'<div class="empty">Materi belum ditambahkan panitia.</div>';
  $$(".dcard",H).forEach(c=>{go($(".btn",c),toLink(M[+$(".btn",c).dataset.mi].u));
    c.onpointermove=e=>{if(e.pointerType==="touch")return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.setProperty("--rx",(-y*10).toFixed(1)+"deg");c.style.setProperty("--ry",(x*12).toFixed(1)+"deg");c.style.setProperty("--gx",(x+.5)*100+"%");c.style.setProperty("--gy",(y+.5)*100+"%")};
    c.onpointerleave=()=>{c.style.setProperty("--rx","0deg");c.style.setProperty("--ry","0deg")}});
  if(sr){sr.hidden=M.length<7;sr.oninput=()=>{dealQ=sr.value.toLowerCase().trim();$$(".dcard",H).forEach(c=>c.hidden=!!dealQ&&!c.dataset.q.includes(dealQ))}}
  H.classList.remove("go");const r=H.getBoundingClientRect();if(r.height>0&&r.top<innerHeight&&r.bottom>0)playDeal()}
function playDeal(){const H=$("#deal");if(!H)return;const cs=$$(".dcard",H);if(!cs.length)return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){H.classList.add("go");cs.forEach(c=>c.classList.add("done"));return}
  H.classList.remove("go");cs.forEach(c=>c.classList.remove("done"));
  const hr=H.getBoundingClientRect(),cx=hr.left+hr.width/2,cy=hr.top+Math.min(hr.height/2,260);
  cs.forEach((c,i)=>{const r=c.getBoundingClientRect();c.style.setProperty("--fx",(cx-(r.left+r.width/2))+"px");c.style.setProperty("--fy",(cy-(r.top+r.height/2))+"px");c.style.setProperty("--fr",((i%2?1:-1)*(8+(i*7)%22))+"deg");
    c.onanimationend=e=>{if(e.animationName==="dealIn")c.classList.add("done")}});
  void H.offsetWidth;H.classList.add("go")}
{const H=$("#deal");if(H&&"IntersectionObserver"in window){new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!H.classList.contains("go"))playDeal()}),{threshold:.2}).observe(H)}
 const nx=$("#nx");if(nx)nx.onclick=()=>{playDeal();confetti(40)}}

/* ---------- terapkan semua ---------- */
function cmsApply(){applyGen();buildAbout();buildCats();buildSubs();applyLinks();renderContacts();buildDeal()}
{const _a=applyCT;applyCT=function(){syncLB();_a();cmsApply()}}
syncLB();cmsApply();

/* =====================================================================
   EDITOR: tab "🛠️ Konten Web" di dashboard panitia
   ===================================================================== */
let CMS_T="gen";
const CMS_TABS=[["gen","🏠 Umum"],["ev","📅 Timeline"],["br","🏁 Cabang"],["rq","📎 Dokumen & Syarat"],["cr","⚖️ Penilaian"],["jr","👩‍⚖️ Dewan Juri"],["sp","🤝 Mitra"],["fq","❓ FAQ"],["ct","☎️ Narahubung"],["mt","📚 Materi"],["an","🏆 Pengumuman"],["lk","🔗 Tautan"],["bk","💾 Cadangan"]];
const GO_OPT=[["","(tidak ada)"],["daftar","Pendaftaran"],["kumpul","Pengumpulan karya"],["materi","Materi pendukung"],["info","Ketentuan & penilaian"],["berita","Berita"],["jadwal","Timeline"],["tim","Juri & mitra"],["juara","Pengumuman juara"],["faq","FAQ"],["kontak","Narahubung"]];
const nowWIB=(addDays=0,end=false)=>{const d=new Date(Date.now()+addDays*864e5),s=d.toLocaleString("sv-SE",{timeZone:"Asia/Jakarta"}).replace(" ","T").slice(0,10);return s+(end?"T23:59:59":"T00:00:00")};

/* ----- pembuat field generik ----- */
function cfField(f,v){const id=f.k,L=f.l?`<label>${esc(f.l)}${f.h?` <span class="hint">${esc(f.h)}</span>`:""}</label>`:"",ph=f.ph?` placeholder="${esc(f.ph)}"`:"";
  switch(f.t){
    case"area":return L+`<textarea data-f="${id}"${ph}>${esc(v??"")}</textarea>`;
    case"lines":return L+`<textarea data-f="${id}"${ph}>${esc((v||[]).join("\n"))}</textarea>`;
    case"check":return`<label class="cchk"><input type="checkbox" data-f="${id}" ${v?"checked":""}> ${esc(f.l)}</label>`;
    case"sel":return L+`<select data-f="${id}">${f.o.map(([a,b])=>`<option value="${esc(a)}" ${a===(v||"")?"selected":""}>${esc(b)}</option>`).join("")}</select>`;
    case"dt":return L+`<input type="datetime-local" step="1" data-f="${id}" value="${esc(String(v||"").slice(0,19))}">`;
    case"num":return L+`<input type="number" min="0" max="100" step="any" data-f="${id}"${ph} value="${v==null?"":esc(v)}">`;
    case"img":{const isD=/^data:/.test(v||"");return L+`<div class="imgf"><span class="pv">${v?`<img src="${esc(v)}" alt="">`:"🖼️"}</span><div><input type="hidden" data-f="${id}" value="${esc(v||"")}"><input class="iurl" placeholder="Tempel URL gambar…" value="${isD?"":esc(v||"")}"><div class="row" style="justify-content:flex-start;margin:0"><label class="btn mini up">⬆️ Unggah<input type="file" accept="image/*" hidden></label><button type="button" class="btn mini clr">Hapus</button></div></div></div>`}
    default:return L+`<input data-f="${id}"${ph} value="${esc(v??"")}">`}}
function cfRead(root,fields,base){const o={...(base||{})};fields.forEach(f=>{const e=$(`[data-f="${f.k}"]`,root);if(!e)return;
  if(f.t==="check")o[f.k]=e.checked;else if(f.t==="lines")o[f.k]=e.value.split("\n").map(x=>x.trim()).filter(Boolean);
  else if(f.t==="num"){const t=e.value.trim();o[f.k]=t===""?null:+t}else o[f.k]=e.value.trim()});return o}
function cfBindImg(root){$$(".imgf",root).forEach(b=>{const h=$('input[type="hidden"]',b),u=$(".iurl",b),pv=$(".pv",b),
  set=v=>{h.value=v;pv.innerHTML=v?`<img src="${esc(v)}" alt="">`:"🖼️"};
  u.oninput=()=>set(u.value.trim());$(".clr",b).onclick=()=>{u.value="";set("")};
  $('input[type="file"]',b).onchange=async e=>{const f=e.target.files[0];if(!f)return;try{set(await imgData(f,b.dataset.max?+b.dataset.max:480));u.value="";toast("Gambar siap — jangan lupa Simpan ✅")}catch(x){toast(x.message)}e.target.value=""}})}

/* ----- editor daftar (tambah / hapus / urut) ----- */
function cfList(host,o){let st=(o.items||[]).map(x=>JSON.parse(JSON.stringify(x))),op=st.map(()=>false);
  const render=()=>{host.innerHTML=st.map((it,i)=>`<details class="ci" data-ix="${i}" ${op[i]?"open":""}><summary><span class="ct">${o.num===false?"":`<b>${i+1}.</b> `}${esc(o.title(it)||"(belum diberi nama)")}</span><span class="ca"><button type="button" class="mini" data-a="up" title="Naik">↑</button><button type="button" class="mini" data-a="dn" title="Turun">↓</button><button type="button" class="mini" data-a="rm" title="Hapus">✕</button></span></summary><div class="cb">${o.fields.map(f=>cfField(f,it[f.k])).join("")}</div></details>`).join("")||`<div class="empty">${esc(o.empty||"Belum ada item.")}</div>`;
    cfBindImg(host);$$(".ci",host).forEach(ci=>{const i=+ci.dataset.ix;$$("[data-a]",ci).forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();collect();const a=b.dataset.a;
      if(a==="rm"){if(st.length<=(o.min||0))return toast("Minimal harus ada "+(o.min||0)+" item");if(!confirm("Hapus item ini?"))return;st.splice(i,1);op.splice(i,1)}
      else{const j=a==="up"?i-1:i+1;if(j<0||j>=st.length)return;[st[i],st[j]]=[st[j],st[i]];[op[i],op[j]]=[op[j],op[i]]}render()})})};
  const collect=()=>{const cs=$$(".ci",host);if(!cs.length&&st.length)return st;const n=cs.map(ci=>cfRead(ci,o.fields,st[+ci.dataset.ix]));const no=cs.map(ci=>ci.open);st=n;op=no;return st};
  render();return{get:()=>collect().map(x=>({...x})),add:()=>{collect();st.push(typeof o.blank==="function"?o.blank():JSON.parse(JSON.stringify(o.blank)));op=op.map(()=>false);op.push(true);render();$$(".ci",host).pop().scrollIntoView({behavior:"smooth",block:"nearest"})},sortBy:fn=>{collect();const z=st.map((x,i)=>[x,op[i]]).sort((a,b)=>fn(a[0],b[0]));st=z.map(x=>x[0]);op=z.map(x=>x[1]);render()}}}

async function cmsSave(pairs,okMsg){for(const[k,v]of pairs){const j=JSON.stringify(v);if(j.length>900000){toast("Data '"+k+"' terlalu besar (>900 KB). Perkecil foto atau pakai URL gambar.");return false}}
  pairs.forEach(([k,v])=>{CT[k]=v});await svc(...pairs.map(p=>p[0]));return true}
const cmsBar=(add,extra="")=>`<div class="row cbar"><button class="btn mini" id="cadd">＋ ${esc(add)}</button>${extra}<button class="btn gold" id="csave">💾 Simpan & terapkan</button></div>`;

/* ----- host admin ----- */
function admC(){$("#ap").innerHTML=`<div class="cms-sub">${CMS_TABS.map(([k,l])=>`<button class="${CMS_T===k?"on":""}" data-s="${k}">${l}</button>`).join("")}</div><p class="cms-note">Semua perubahan tampil di website setelah menekan <b>Simpan & terapkan</b>${DB?" (tersimpan untuk semua pengunjung).":". <b>Database tidak aktif</b>: tersimpan di browser ini — gunakan tab 💾 Cadangan untuk menerbitkan."}</p><div id="cmsb"></div>`;
  $$(".cms-sub button").forEach(b=>b.onclick=()=>{CMS_T=b.dataset.s;admC()});(CMSE[CMS_T]||CMSE.gen)($("#cmsb"))}
const CMSE={};

/* 🏠 Umum */
CMSE.gen=h=>{const g=CT.gen||{};
  h.innerHTML=`<h4>Informasi umum website</h4>${[["brand","Nama di header"],["welcome","Teks sapaan (hero)"],["title","Judul utama"],["tagline","Tagline / tema"],["footer","Teks footer"]].map(([k,l])=>cfField({k,l,t:"text"},g[k])).join("")}
  <h4>Bagian "Tentang"</h4><p class="cms-note">Tiap kartu menjadi satu tombol tab. Tab terakhir "Cabang Lomba" dibuat otomatis dari menu 🏁 Cabang.</p><div id="abl"></div><label>Pengantar tab Cabang Lomba</label><textarea data-f="branchIntro">${esc(g.branchIntro||"")}</textarea>${cmsBar("Tambah tab Tentang")}`;
  const L=cfList($("#abl",h),{items:g.about||[],title:x=>x.t,min:1,fields:[{k:"t",l:"Judul tab",t:"text"},{k:"d",l:"Deskripsi",t:"area"},{k:"c",l:"Label/chip",h:"(satu per baris)",t:"lines"}],blank:{t:"Tab baru",d:"",c:[]}});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v={...g};["brand","welcome","title","tagline","footer"].forEach(k=>v[k]=$(`[data-f="${k}"]`,h).value.trim());v.branchIntro=$('textarea[data-f="branchIntro"]',h).value.trim();v.about=L.get();if(await cmsSave([["gen",v]]))admC()}};

/* 📅 Timeline */
CMSE.ev=h=>{h.innerHTML=`<h4>Timeline lomba</h4><p class="cms-note">Urutkan dari tahap paling awal. Centang <b>Tahap pengumpulan karya</b> pada satu tahap: tanggalnya dipakai sebagai buka/tutup pengumpulan.</p><div id="evl"></div>${cmsBar("Tambah tahap",'<button class="btn mini" id="csort">↕ Urutkan per tanggal</button>')}`;
  const L=cfList($("#evl",h),{items:CT.ev,title:x=>(x.i||"")+" "+(x.k||""),min:1,fields:[{k:"k",l:"Nama tahap",t:"text"},{k:"i",l:"Ikon (emoji)",t:"text"},{k:"s",l:"Mulai (WIB)",t:"dt"},{k:"e",l:"Berakhir (WIB)",t:"dt"},{k:"d",l:"Deskripsi",t:"area"},{k:"req",l:"Persyaratan tahap ini",h:"(satu per baris)",t:"lines"},{k:"go",l:"Tombol menuju bagian",t:"sel",o:GO_OPT},{k:"gl",l:"Label tombol",t:"text",ph:"mis. Daftar sekarang"},{k:"role",l:"Tahap pengumpulan karya (dipakai sebagai batas waktu)",t:"check"}],
    blank:()=>({k:"Tahap baru",i:"📌",s:nowWIB(0),e:nowWIB(7,true),d:"",req:[],go:"berita",gl:"Lihat info"})});
  $("#cadd").onclick=L.add;$("#csort").onclick=()=>L.sortBy((a,b)=>String(a.s).localeCompare(String(b.s)));
  $("#csave").onclick=async()=>{const v=L.get().map(x=>{x.role=x.role?"submit":"";if(!x.role)delete x.role;if(x.s&&x.s.length===16)x.s+=":00";if(x.e&&x.e.length===16)x.e+=":00";return x});
    for(const x of v){if(!x.k)return toast("Nama tahap wajib diisi");if(!x.s||!x.e)return toast("Tanggal mulai & berakhir wajib diisi untuk: "+x.k);if(D(x.e)<=D(x.s))return toast("Tanggal berakhir harus setelah mulai: "+x.k)}
    let seen=0;v.forEach(x=>{if(x.role){if(seen)delete x.role;seen=1}});if(!seen&&v.length>1)v[1].role="submit";else if(!seen)v[0].role="submit";
    if(await cmsSave([["ev",v]]))admC()}};

/* 🏁 Cabang */
CMSE.br=h=>{h.innerHTML=`<h4>Cabang lomba</h4><p class="cms-note">Nama, ikon, dan deskripsi tampil di kartu pendaftaran & tab "Tentang". Matikan centang <b>Tampilkan</b> untuk menyembunyikan cabang tanpa menghapus data juara/penilaiannya.</p><div id="brl"></div>${cmsBar("Tambah cabang")}`;
  const L=cfList($("#brl",h),{items:CT.branches,title:x=>(x.ic||"")+" "+(x.name||"")+(x.on===false?"  (disembunyikan)":""),min:1,fields:[{k:"name",l:"Nama cabang",t:"text"},{k:"ic",l:"Ikon (emoji)",t:"text"},{k:"desc",l:"Deskripsi",t:"area"},{k:"on",l:"Tampilkan di halaman pendaftaran",t:"check"},{k:"daftar",l:"Tautan formulir pendaftaran",h:"(Google Form dll.)",t:"text",ph:"https://forms.gle/…"},{k:"kumpul",l:"Tautan formulir pengumpulan",h:"(opsional)",t:"text",ph:"https://forms.gle/…"}],
    blank:()=>({id:"",name:"Cabang baru",ic:"🏅",desc:"",on:true,daftar:"",kumpul:""})});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v=L.get(),used=new Set(v.map(x=>x.id).filter(Boolean));
    for(const x of v){if(!x.name)return toast("Nama cabang wajib diisi");if(!x.id){let b=slug(x.name)||"cabang",n=b,k=2;while(used.has(n))n=b+"-"+k++;x.id=n;used.add(n)}}
    const crit={...CT.crit},win={...CT.winners};v.forEach(x=>{if(!crit[x.id])crit[x.id]=[];if(!win[x.id])win[x.id]=[[],[],[]]});
    if(await cmsSave([["branches",v],["crit",crit],["winners",win]]))admC()}};

/* 📎 Dokumen & Syarat */
CMSE.rq=h=>{h.innerHTML=`<h4>Dokumen & persyaratan pendaftaran</h4><p class="cms-note">Tambah/kurangi sesuai kebutuhan. Isi <b>Tautan file</b> bila ada dokumen yang bisa dibuka peserta (Google Drive, PDF, dll.) — tombol otomatis muncul.</p><div id="rql"></div>${cmsBar("Tambah dokumen / syarat")}`;
  const L=cfList($("#rql",h),{items:CT.req,title:x=>x.t,fields:[{k:"t",l:"Judul",t:"text"},{k:"d",l:"Penjelasan",t:"area"},{k:"l",l:"Tautan file",h:"(opsional)",t:"text",ph:"https://drive.google.com/…"},{k:"lt",l:"Label tombol",t:"text",ph:"Buka dokumen"}],blank:{t:"Dokumen baru",d:"",l:"",lt:""}});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v=L.get();for(const x of v){if(!x.t)return toast("Judul wajib diisi");if(x.l&&!toLink(x.l))return toast("Tautan tidak valid: "+x.t)}if(await cmsSave([["req",v]]))admC()}};

/* ⚖️ Penilaian */
let CRW=null,CRK="";
CMSE.cr=h=>{if(!CRW)CRW=JSON.parse(JSON.stringify(CT.crit));if(!LB[CRK])CRK=Object.keys(LB)[0];
  h.innerHTML=`<h4>Ketentuan & kriteria penilaian</h4><div class="tabs">${Object.keys(LB).map(k=>`<button class="${CRK===k?"on":""}" data-k="${esc(k)}">${esc(LB[k])}</button>`).join("")}</div><div id="crl"></div><p class="cms-note" id="crt"></p>${cmsBar("Tambah indikator")}`;
  const L=cfList($("#crl",h),{items:CRW[CRK]||[],title:x=>x.i+(x.w!=null&&x.w!==""?` (${x.w}%)`:""),fields:[{k:"i",l:"Indikator penilaian",t:"text"},{k:"w",l:"Bobot (%)",t:"num",ph:"mis. 25"}],blank:{i:"Indikator baru",w:null}});
  const tot=()=>{const s=L.get().reduce((a,r)=>a+(+r.w||0),0);$("#crt").innerHTML="Total bobot cabang ini: <b>"+s+"%</b>"+(s&&s!==100?" — idealnya 100%":"");};tot();h.addEventListener("input",tot);
  $$(".tabs button",h).forEach(b=>b.onclick=()=>{CRW[CRK]=L.get();CRK=b.dataset.k;admC()});
  $("#cadd").onclick=()=>{L.add();tot()};$("#csave").onclick=async()=>{CRW[CRK]=L.get();for(const k of Object.keys(CRW))if(!LB[k]&&!(CRW[k]||[]).length)delete CRW[k];
    for(const k of Object.keys(CRW))for(const r of CRW[k]){if(!r.i)return toast("Nama indikator wajib diisi ("+(LB[k]||k)+")");if(r.w!=null&&(r.w<0||r.w>100))return toast("Bobot harus 0–100")}
    if(await cmsSave([["crit",CRW]])){CRW=null;admC()}}};

/* 👩‍⚖️ Juri */
CMSE.jr=h=>{h.innerHTML=`<h4>Dewan juri</h4><div id="jrl"></div>${cmsBar("Tambah juri")}`;
  const L=cfList($("#jrl",h),{items:CT.judges,title:x=>x.n,fields:[{k:"n",l:"Nama",t:"text"},{k:"r",l:"Jabatan",t:"text"},{k:"o",l:"Institusi",t:"text"},{k:"x",l:"Pengalaman / keterangan",t:"area"},{k:"p",l:"Foto",t:"img"}],blank:{n:"Nama Juri",r:"",o:"",x:"",p:""}});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v=L.get();if(v.some(x=>!x.n))return toast("Nama juri wajib diisi");if(await cmsSave([["judges",v]]))admC()}};

/* 🤝 Mitra */
CMSE.sp=h=>{let G=Object.keys(CT.spons||{}).map(g=>({g,items:CT.spons[g].map(x=>({...x}))}));const F=[{k:"n",l:"Nama mitra",t:"text"},{k:"l",l:"Logo",t:"img"},{k:"u",l:"Tautan (opsional)",t:"text",ph:"https://…"}];let Ls=[];
  const draw=()=>{h.innerHTML=`<h4>Sponsor & partner</h4><p class="cms-note">Buat kelompok (mis. Sponsor, Media Partner) lalu tambahkan mitra beserta logonya.</p>${G.map((g,gi)=>`<div class="cg" data-gi="${gi}"><div class="row" style="justify-content:flex-start;gap:8px"><input class="gname" value="${esc(g.g)}" placeholder="Nama kelompok"><button class="btn mini" data-a="addi">＋ Mitra</button><button class="btn mini" data-a="rmg">Hapus kelompok</button></div><div class="gl"></div></div>`).join("")}${cmsBar("Tambah kelompok")}`;
    Ls=$$(".cg",h).map((c,gi)=>cfList($(".gl",c),{items:G[gi].items,title:x=>x.n,num:false,fields:F,blank:{n:"Mitra baru",l:"",u:""},empty:"Belum ada mitra di kelompok ini."}));
    $$(".cg",h).forEach((c,gi)=>{$('[data-a="addi"]',c).onclick=()=>Ls[gi].add();$('[data-a="rmg"]',c).onclick=()=>{sync();if(!confirm("Hapus kelompok ini beserta isinya?"))return;G.splice(gi,1);draw()}});
    $("#cadd").onclick=()=>{sync();G.push({g:"Kelompok baru",items:[]});draw()};$("#csave").onclick=save};
  const sync=()=>{G=$$(".cg",h).map((c,gi)=>({g:$(".gname",c).value.trim(),items:Ls[gi].get()}))};
  const save=async()=>{sync();const o={};for(const g of G){if(!g.g)return toast("Nama kelompok wajib diisi");if(o[g.g])return toast("Nama kelompok tidak boleh kembar: "+g.g);if(g.items.some(x=>!x.n))return toast("Nama mitra wajib diisi");o[g.g]=g.items}if(await cmsSave([["spons",o]]))admC()};draw()};

/* ❓ FAQ */
CMSE.fq=h=>{h.innerHTML=`<h4>Pertanyaan umum (FAQ)</h4><div id="fql"></div>${cmsBar("Tambah pertanyaan")}`;
  const L=cfList($("#fql",h),{items:CT.faq,title:x=>x.q,fields:[{k:"q",l:"Pertanyaan",t:"text"},{k:"a",l:"Jawaban",t:"area"}],blank:{q:"Pertanyaan baru?",a:""}});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v=L.get();if(v.some(x=>!x.q||!x.a))return toast("Pertanyaan dan jawaban wajib diisi");if(await cmsSave([["faq",v]]))admC()}};

/* ☎️ Narahubung */
CMSE.ct=h=>{h.innerHTML=`<h4>Narahubung</h4><p class="cms-note">Kolom tautan boleh berisi URL, <b>nomor WhatsApp</b> (08… / 62…), atau <b>@akun Instagram</b> — otomatis diubah menjadi tautan.</p><div id="ctl"></div>${cmsBar("Tambah narahubung")}`;
  const L=cfList($("#ctl",h),{items:CT.contacts,title:x=>(x.ic||"")+" "+x.t,fields:[{k:"ic",l:"Ikon (emoji)",t:"text"},{k:"t",l:"Judul",t:"text",ph:"mis. WhatsApp Admin"},{k:"s",l:"Keterangan yang tampil",t:"text",ph:"mis. Nama · 0812…"},{k:"u",l:"Tautan / nomor / @akun",t:"text"}],blank:{ic:"💬",t:"Kontak baru",s:"",u:""}});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v=L.get();for(const x of v){if(!x.t)return toast("Judul wajib diisi");if(x.u&&!toLink(x.u))return toast("Tautan/nomor tidak dikenali: "+x.t)}if(await cmsSave([["contacts",v]]))admC()}};

/* 📚 Materi */
CMSE.mt=h=>{h.innerHTML=`<h4>Materi pendukung</h4><p class="cms-note">Semua kartu langsung tampil di halaman Pengumpulan dengan animasi "dibagikan" — peserta tidak perlu mencari satu per satu.</p><div id="mtl"></div>${cmsBar("Tambah materi")}`;
  const L=cfList($("#mtl",h),{items:CT.materi,title:x=>(x.ic||"")+" "+x.t,fields:[{k:"ic",l:"Ikon (emoji)",t:"text"},{k:"t",l:"Judul materi",t:"text"},{k:"d",l:"Deskripsi singkat",t:"area"},{k:"u",l:"Tautan file",t:"text",ph:"https://drive.google.com/…"},{k:"b",l:"Label tombol",t:"text",ph:"Buka di Drive"}],blank:{ic:"📄",t:"Materi baru",d:"",u:"",b:"Buka di Drive"}});
  $("#cadd").onclick=L.add;$("#csave").onclick=async()=>{const v=L.get();for(const x of v){if(!x.t)return toast("Judul materi wajib diisi");if(x.u&&!toLink(x.u))return toast("Tautan tidak valid: "+x.t)}if(await cmsSave([["materi",v]]))admC()}};

/* 🏆 Pengumuman: teks animasi pengumuman per kategori + seluruh isi layar "Hasil lengkap" */
CMSE.an=h=>{const A=ANN(),hl=A.hl,F=(k,l,t,hint,ph)=>cfField({k,l,t:t||"text",h:hint,ph},hl[k]);
  const catKeys=Object.keys(LB);
  h.innerHTML=`<h4>Per kategori (dipakai di animasi pengumuman & layar Hasil lengkap)</h4><p class="cms-note">Satu kartu per cabang lomba. <b>Nama pada plakat</b> mengikuti nama cabang di menu 🏁 Cabang.</p>
  ${catKeys.map(k=>{const c=A.cat[k]||{};return`<details class="ci" data-k="${esc(k)}" open><summary><span class="ct">${esc(LB[k])}</span></summary><div class="cb">${cfField({k:"long",l:"Sub-judul kategori",h:"(tampil di bawah nama kategori saat animasi, mis. Lomba Esai)",t:"text"},c.long)}${cfField({k:"desc",l:"Deskripsi kategori",h:"(kalimat penjelas di animasi pengumuman; kosongkan bila tidak perlu)",t:"area"},c.desc)}${cfField({k:"tag",l:"Kalimat sorotan di layar Hasil lengkap",t:"text"},c.tag)}</div></details>`}).join("")}
  <h4>Animasi pengumuman</h4>${cfField({k:"catKick",l:"Label di atas nama kategori",h:"({n} = urutan, {total} = jumlah kategori)",t:"text"},A.rv.catKick)}
  <h4>Layar "Hasil lengkap" — judul</h4>${F("kicker","Teks kecil di atas judul")}${F("title","Judul")}${F("sub","Kalimat pembuka","area")}
  <h4>Layar "Hasil lengkap" — kartu juara</h4>${[1,2,3].map(n=>F("r"+n,"Label Juara "+n)).join("")}${[1,2,3].map(n=>F("c"+n,"Keterangan di bawah Juara "+n)).join("")}${F("scoreLabel","Kata sebelum nilai","text","(mis. Nilai → \"Nilai 99\")")}${F("soon","Teks nama bila juara belum diisi")}${F("soonInst","Teks institusi bila juara belum diisi")}${F("tagDefault","Kalimat sorotan cadangan","text","(dipakai bila kategori tidak punya kalimat sorotan)")}
  <h4>Layar "Hasil lengkap" — penutup</h4>${F("note","Kalimat penutup","area")}${F("replay","Label tombol putar ulang")}${F("close","Label tombol tutup")}
  <div class="row cbar"><button class="btn mini" id="crst">↩️ Kembalikan teks bawaan</button><button class="btn gold" id="csave">💾 Simpan & terapkan</button></div>`;
  $("#csave").onclick=async()=>{const v={hl:{},rv:{},cat:{}};
    Object.keys(DEF.ann.hl).forEach(k=>{const e=$(`[data-f="${k}"]`,h);if(e)v.hl[k]=e.value.trim()});
    const ck=$('[data-f="catKick"]',h);v.rv.catKick=(ck&&ck.value.trim())||DEF.ann.rv.catKick;
    $$(".ci[data-k]",h).forEach(ci=>{v.cat[ci.dataset.k]=cfRead(ci,[{k:"long",t:"text"},{k:"desc",t:"area"},{k:"tag",t:"text"}],{})});
    if(!v.hl.title)return toast("Judul Hasil lengkap wajib diisi");
    if(await cmsSave([["ann",v]]))admC()};
  $("#crst").onclick=async()=>{if(!confirm("Kembalikan semua teks pengumuman ke bawaan?"))return;if(await cmsSave([["ann",JSON.parse(JSON.stringify(DEF.ann))]]))admC()}};

/* 🔗 Tautan */
CMSE.lk=h=>{const l=CT.links||{};h.innerHTML=`<h4>Tautan akses cepat (halaman Pendaftaran)</h4>${[["handbook","📘 Handbook"],["twibbon","🖼️ Twibbon"],["poster","🎨 Poster"]].map(([k,t])=>cfField({k,l:t,t:"text",ph:"https://…"},l[k])).join("")}<div class="row cbar"><button class="btn gold" id="csave">💾 Simpan & terapkan</button></div>`;
  $("#csave").onclick=async()=>{const v={};for(const k of["handbook","twibbon","poster"]){const x=$(`[data-f="${k}"]`,h).value.trim();if(x&&!toLink(x))return toast("Tautan tidak valid: "+k);v[k]=x}if(await cmsSave([["links",v]]))admC()}};

/* 💾 Cadangan */
CMSE.bk=h=>{h.innerHTML=`<h4>Cadangan & penerbitan konten</h4>
  <p class="cms-note">${DB?"Database aktif: perubahan langsung dilihat semua pengunjung.":"<b>Database tidak aktif.</b> Perubahan hanya tersimpan di browser panitia ini. Agar pengunjung melihatnya: unduh <code>content.json</code>, letakkan di folder <code>data/</code> website, lalu unggah ulang situs."}</p>
  <div class="row" style="justify-content:flex-start"><button class="btn" id="bex">⬇️ Unduh content.json</button><label class="btn" style="cursor:pointer">⬆️ Impor content.json<input id="bim" type="file" accept=".json,application/json" hidden></label><button class="btn mini" id="brs">↩️ Hapus perubahan lokal browser ini</button></div><div id="bmsg"></div>`;
  $("#bex").onclick=()=>{const o={};Object.keys(DEF).forEach(k=>{if(!["certs","roster"].includes(k))o[k]=CT[k]});o.set={...CT.set};delete o.set.adminHash;cmsDownload("content.json",JSON.stringify(o,null,1))};
  $("#bim").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text()),ks=Object.keys(j).filter(k=>k in DEF&&!["certs","roster"].includes(k));if(!ks.length)throw Error("Tidak ada data yang dikenali");if(!confirm("Timpa "+ks.length+" bagian konten ("+ks.join(", ")+")?"))return;ks.forEach(k=>{CT[k]=k==="set"?{...j.set,adminHash:CT.set.adminHash}:j[k]});await svc(...ks);admC()}catch(x){toast("Impor gagal: "+x.message)}};
  $("#brs").onclick=()=>{if(!confirm("Hapus semua perubahan konten yang tersimpan di browser ini?"))return;Object.keys(DEF).forEach(k=>{try{localStorage.removeItem("prpn_c_"+k)}catch(e){}});location.reload()}};
