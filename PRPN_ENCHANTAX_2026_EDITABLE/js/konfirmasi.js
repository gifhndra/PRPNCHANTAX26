/* ============================================================
   DASHBOARD KONFIRMASI PENDAFTAR
   Terhubung ke Google Sheet lewat Google Apps Script (lihat apps-script/Code.gs).
   Alur: sheet (data isian peserta) -> dashboard -> panitia pilih Verified / Improvement / Rejected
         + keterangan + nama pengonfirmasi -> disimpan kembali ke sheet yang sama.
   ============================================================ */
const KONF={
  API:"https://script.google.com/macros/s/AKfycbyHhgRizGH4fSdF64TgP0kVqKOrTYuAmf6aXKZEeZCNUdgbTSAB_545wB0iRIbQZPqR/exec",
  /* Client ID OAuth Google (Web application) untuk login panitia; harus sama dengan GOOGLE_CLIENT_ID di Code.gs */
  GOOGLE_CLIENT_ID:"913127893846-8fhrpro22ftv8caft6iu38rq2ru3lq3v.apps.googleusercontent.com",
  SHEET:"https://docs.google.com/spreadsheets/d/1NPAU1kzwaTL8H_7C7cp2x3yMU5a3zyiOaUyjoT-Hf78/edit?usp=sharing",
  /* nama kolom konfirmasi di sheet (dibuat otomatis oleh Apps Script bila belum ada) */
  COLS:{st:"Status Konfirmasi",note:"Keterangan Konfirmasi",by:"Dikonfirmasi Oleh",at:"Waktu Konfirmasi"},
  STAT:{"":"Registered",verified:"Verified",improvement:"Improvement",rejected:"Rejected"},
  MIN_NOTE:10
};
const KS={R:[],L:[],missing:[],draft:{},loaded:false,loading:false,err:"",f:{lomba:"",st:"",q:""}};
const kStat=v=>{v=String(v||"").toLowerCase().trim();return /^(verified|terverifikasi)$/.test(v)?"verified":/^(improvement|perbaikan)$/.test(v)?"improvement":/^(rejected|ditolak)$/.test(v)?"rejected":""};
const kKey=()=>AUTH.token();
const kUrls=s=>esc(s).replace(/(https?:\/\/[^\s<]+)/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u.length>38?u.slice(0,36)+"…":u}</a>`);

/* petakan kolom sheet -> peran (otomatis dari judul kolom) */
function kMap(H){
  const C=KONF.COLS,conf=new Set(Object.values(C).map(x=>x.toLowerCase())),ix={};
  H.forEach((h,i)=>{const l=String(h).toLowerCase().trim();
    if(l===C.st.toLowerCase())ix.st=i;else if(l===C.note.toLowerCase())ix.note=i;else if(l===C.by.toLowerCase())ix.by=i;else if(l===C.at.toLowerCase())ix.at=i;
    if(conf.has(l))return;
    if(ix.ts==null&&/timestamp|waktu pengisian|cap waktu|submitted at|waktu submit/.test(l))ix.ts=i;
    else if(ix.tim==null&&/tim/.test(l)&&!/anggota|ketua/.test(l))ix.tim=i;
    else if(ix.sek==null&&/sekolah|kampus|instansi|institusi/.test(l))ix.sek=i;
    else if(ix.ketua==null&&/ketua/.test(l)&&!/hp|nomor|telepon|wa\b|email/.test(l))ix.ketua=i;
    else if(ix.lomba==null&&/lomba|cabang/.test(l))ix.lomba=i});
  return ix}

async function kCall(opts){return AUTH.post(opts.post||{action:"list"})}

async function kLoad(){
  KS.loading=true;KS.err="";kDraw();
  try{const j=await kCall({});KS.missing=j.missing||[];KS.L=j.sheets.map(t=>t.label);KS.R=[];
    j.sheets.forEach(t=>{const ix=kMap(t.headers);t.rows.forEach(r=>KS.R.push({k:t.name+"#"+r.r,s:t.name,label:t.label,r:r.r,c:r.c,H:t.headers,ix}))});
    KS.loaded=true;kRoster()}
  catch(e){KS.err=e.message||String(e)}
  KS.loading=false;kDraw()}

/* daftar tim terverifikasi dipakai formulir pengumpulan karya publik (CT.roster) */
async function kRoster(){
  try{CT.roster=await Promise.all(KS.R.filter(r=>r.ix.tim!=null&&r.ix.ketua!=null&&kStat(r.c[r.ix.st])==="verified").map(r=>sha(nk(r.c[r.ix.tim],r.c[r.ix.ketua]))));await persist("roster")}catch(e){}}

function admF(){
  $("#ap").innerHTML=`<div id="kf"></div>`;
  if(!AUTH.token()){kAskLogin();return}
  if(!KS.loading)kLoad()}   /* selalu ambil data terbaru dari sheet saat tab dibuka */

function kAskLogin(msg){
  $("#kf").innerHTML=`<h3>✅ Konfirmasi Pendaftar</h3><p style="color:var(--mut);font-size:14px">Sesi panitia belum aktif atau sudah berakhir. Masuk dengan <b>akun Google + password pribadi</b> panitia.</p>${msg?`<div class="bad">${esc(msg)}</div>`:""}<div class="row"><button class="btn gold" id="kkb">🔒 Masuk panitia</button></div>`;
  $("#kkb").onclick=()=>AUTH.open()}

function kView(){
  const F=KS.f,q=F.q.toLowerCase().trim();
  return KS.R.filter(r=>{const st=kCur(r).st;
    return(!F.lomba||r.label===F.lomba)&&(F.st===""||(F.st==="pending"?st==="":st===F.st))&&(!q||r.c.join(" ").toLowerCase().includes(q))})}
const kCur=r=>{const d=KS.draft[r.k],x=r.ix;return{st:d&&d.st!=null?d.st:kStat(r.c[x.st]),note:d&&d.note!=null?d.note:(r.c[x.note]||""),by:d&&d.by!=null?d.by:(r.c[x.by]||"")}};

function kDraw(){
  const box=$("#kf");if(!box)return;
  if(!AUTH.token()){kAskLogin();return}
  if(KS.loading&&!KS.loaded){box.innerHTML='<h3>✅ Konfirmasi Pendaftar</h3><div class="skel"></div>';return}
  if(KS.err&&!KS.loaded){box.innerHTML=`<h3>✅ Konfirmasi Pendaftar</h3><div class="bad">${esc(KS.err)}</div><div class="row"><button class="btn gold" id="kr">🔄 Coba lagi</button><button class="btn" id="kk2">🔒 Masuk ulang</button></div>`;
    $("#kr").onclick=kLoad;$("#kk2").onclick=()=>{AUTH.expired();kAskLogin()};return}
  const lomba=KS.L;
  box.innerHTML=`<div class="row"><button class="btn gold" id="kr">🔄 Muat ulang dari sheet</button><a class="btn" href="${esc(KONF.SHEET)}" target="_blank" rel="noopener noreferrer">📄 Buka Google Sheet</a><span class="au-who" style="align-self:center">👤 ${esc(AUTH.name())}</span><button class="btn" id="kk2">🚪 Keluar</button></div>
<div class="row"><select id="kfl" style="max-width:190px;margin:0" aria-label="Filter jenis lomba"><option value="">Semua Lomba</option>${lomba.map(l=>`<option>${esc(l)}</option>`).join("")}</select><select id="kfs" style="max-width:210px;margin:0" aria-label="Filter status"><option value="">Semua Status</option><option value="pending">Registered (belum dikonfirmasi)</option><option value="verified">Verified</option><option value="improvement">Improvement</option><option value="rejected">Rejected</option></select><input id="kfq" placeholder="Cari nama tim / sekolah / ketua…" style="max-width:280px;margin:0" value="${esc(KS.f.q)}"></div>
<p id="kc" style="color:var(--mut);font-size:13px;margin:6px 0"></p><p style="color:var(--mut);font-size:12px;margin:0 0 6px">Sumber data: tab Tally <b>Cerdas Cermat, Call for Paper, Creative</b> (jenis lomba mengikuti tab)</p>${KS.missing.length?`<div class="bad">Tab tidak ditemukan di spreadsheet: ${esc(KS.missing.join(", "))}</div>`:""}${KS.err?`<div class="bad">${esc(KS.err)}</div>`:""}
<div class="scr"><table id="kt" class="kt"></table></div>
<p style="color:var(--mut);font-size:13px">Setiap perubahan tersimpan ke Google Sheet (kolom <b>${esc(KONF.COLS.st)}</b>, <b>${esc(KONF.COLS.note)}</b>, <b>${esc(KONF.COLS.by)}</b>, <b>${esc(KONF.COLS.at)}</b>) dan dicatat di sheet <b>Riwayat Konfirmasi</b>. Improvement dan Rejected wajib diberi keterangan.</p>`;
  $("#kfl").value=KS.f.lomba;$("#kfs").value=KS.f.st;
  $("#kr").onclick=()=>{KS.draft={};kLoad()};$("#kk2").onclick=async()=>{await AUTH.logout();closeM();toast("Berhasil keluar")};
  $("#kfl").onchange=e=>{KS.f.lomba=e.target.value;kRows()};$("#kfs").onchange=e=>{KS.f.st=e.target.value;kRows()};$("#kfq").oninput=e=>{KS.f.q=e.target.value;kRows()};
  const T=$("#kt");
  T.onchange=e=>{const t=e.target,r=t.dataset.r;if(r&&t.dataset.f==="st"){kDr(r).st=t.value;kRows(true)}};
  T.oninput=e=>{const t=e.target,r=t.dataset.r;if(!r)return;if(t.dataset.f==="note")kDr(r).note=t.value;else if(t.dataset.f==="by")kDr(r).by=t.value};
  T.onclick=e=>{const b=e.target.closest("button[data-save]");if(b)kSave(b.dataset.save)};
  kRows()}

const kDr=r=>KS.draft[r]||(KS.draft[r]={});
function kRows(keepScroll){
  const T=$("#kt");if(!T)return;const L=kView(),sc=$(".scr");const top=sc?sc.scrollTop:0;
  const cnt=q=>KS.R.filter(r=>kStat(r.c[r.ix.st])===q).length;$("#kc").textContent=L.length+" dari "+KS.R.length+" pendaftar · Registered "+(KS.R.length-cnt("verified")-cnt("improvement")-cnt("rejected"))+" · Verified "+cnt("verified")+" · Improvement "+cnt("improvement")+" · Rejected "+cnt("rejected");
  const val=(r,i)=>i==null?"—":esc(r.c[i]||"—");
  T.innerHTML=`<tr><th>Waktu daftar</th><th>Nama tim</th><th>Sekolah/Kampus</th><th>Ketua</th><th>Jenis lomba</th><th>Riwayat data peserta</th><th>Konfirmasi</th><th>Keterangan</th><th>Dikonfirmasi oleh</th><th>Waktu konfirmasi</th><th></th></tr>`+
  (L.map(r=>{const x=r.ix,c=kCur(r),dirty=!!KS.draft[r.k]&&Object.keys(KS.draft[r.k]).length,skip=new Set([x.st,x.note,x.by,x.at]);
    const det=r.H.map((h,i)=>skip.has(i)||!String(r.c[i]||"").trim()?"":`<div><b>${esc(h)}:</b> ${kUrls(r.c[i])}</div>`).join("");
    const need=(c.st==="improvement"||c.st==="rejected");
    return `<tr><td>${val(r,x.ts)}</td><td><b>${val(r,x.tim)}</b></td><td>${val(r,x.sek)}</td><td>${val(r,x.ketua)}</td><td><b>${esc(r.label)}</b></td>
<td><details class="kd"><summary>Lihat isian</summary><div class="kdb">${det||"—"}</div></details></td>
<td><select data-r="${esc(r.k)}" data-f="st" aria-label="Konfirmasi"><option value="">Registered</option><option value="verified">Verified</option><option value="improvement">Improvement</option><option value="rejected">Rejected</option></select></td>
<td><textarea data-r="${esc(r.k)}" data-f="note" placeholder="${need?"Wajib diisi (min. "+KONF.MIN_NOTE+" karakter)":"Keterangan (opsional)"}" aria-label="Keterangan">${esc(c.note)}</textarea></td>
<td>${esc(r.c[x.by]||"")||`<i style="color:var(--mut)">otomatis: ${esc(AUTH.name())}</i>`}</td>
<td>${val(r,x.at)}</td><td><button class="btn gold" data-save="${esc(r.k)}" style="font-size:12px;padding:6px 14px;white-space:nowrap">${dirty?"💾 Simpan":"Simpan"}</button></td></tr>`}).join("")||`<tr><td colspan="11" class="empty">${KS.R.length?"Tidak ada data yang cocok dengan filter.":"Belum ada pendaftar di sheet. 📭"}</td></tr>`);
  T.querySelectorAll("select[data-f=st]").forEach(s=>{const r=KS.R.find(z=>z.k===s.dataset.r);s.value=kCur(r).st});
  if(sc)sc.scrollTop=top}

async function kSave(rn){
  const r=KS.R.find(z=>z.k===rn);if(!r)return;
  const c=kCur(r),old=kStat(r.c[r.ix.st]),E=[];
  const by=AUTH.name(),note=c.note.trim();   /* pengonfirmasi = akun yang login (server juga memaksa ini) */
  if((c.st==="improvement"||c.st==="rejected")&&note.length<KONF.MIN_NOTE)E.push("Keterangan wajib diisi (minimal "+KONF.MIN_NOTE+" karakter) untuk "+KONF.STAT[c.st]);
  if(c.st===old&&note===(r.c[r.ix.note]||""))E.push("Belum ada perubahan untuk disimpan");
  if(E.length)return toast(E[0]);
  const btn=document.querySelector(`button[data-save="${rn}"]`);if(btn){btn.disabled=true;btn.textContent="Menyimpan…"}
  try{
    const j=await kCall({post:{action:"confirm",sheet:r.s,row:r.r,sig:r.c.slice(0,4).join("|"),status:c.st,note,by}});
    r.c=j.cells;delete KS.draft[r.k];try{localStorage.setItem("prpn_adm",JSON.stringify(by))}catch(e){}
    toast("Tersimpan ke Google Sheet ✅");kRoster();kRows()}
  catch(e){toast("Gagal: "+(e.message||e));if(btn){btn.disabled=false;btn.textContent="💾 Simpan"}}}
