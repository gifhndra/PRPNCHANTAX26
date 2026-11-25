/* ============================================================
   LOGIN PANITIA — 2 faktor yang harus cocok sebagai satu pasangan:
   (1) Akun Google (Google Identity Services)
   (2) Password pribadi panitia tersebut.

   Verifikasi dilakukan di server (Apps Script).
   Sukses -> token sesi 6 jam di sessionStorage.
   ============================================================ */

const AUTH = {
  SK: "prpn_sess",
  s: null,
  idt: null,
  gwho: null,

  load() {
    try {
      this.s = JSON.parse(sessionStorage.getItem(this.SK) || "null");
    } catch (e) {
      this.s = null;
    }
    return this.s;
  },

  save(s) {
    this.s = s;
    try {
      s
        ? sessionStorage.setItem(this.SK, JSON.stringify(s))
        : sessionStorage.removeItem(this.SK);
    } catch (e) {}
  },

  token() {
    return (this.s || this.load() || {}).token || "";
  },

  name() {
    return (this.s || this.load() || {}).name || "";
  },

  email() {
    return (this.s || this.load() || {}).email || "";
  },

  api() {
    try {
      return KONF.API;
    } catch (e) {
      return "";
    }
  },

  cid() {
    try {
      return KONF.GOOGLE_CLIENT_ID || "";
    } catch (e) {
      return "";
    }
  },

  async raw(body) {
    if (!this.api()) throw Error("Alamat Apps Script belum diisi");

    let r;
    try {
      r = await fetch(this.api(), {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(body),
        redirect: "follow"
      });
    } catch (e) {
      throw Error("Tidak bisa menghubungi server (cek internet / URL /exec)");
    }

    let j;
    try {
      j = await r.json();
    } catch (e) {
      throw Error(
        "Respons server tidak terbaca. Pastikan Apps Script sudah memakai Code.gs terbaru dan di-deploy ulang (New version)."
      );
    }

    return j;
  },

  /* Panggilan terautentikasi: otomatis menyertakan token sesi */
  async post(body) {
    const t = this.token();

    if (!t) {
      this.expired();
      throw Error("Belum masuk sebagai panitia");
    }

    const j = await this.raw(
      Object.assign({ token: t }, body)
    );

    // Penanganan sesi disesuaikan dengan respons Code.gs Version 8.
    if (
      j &&
      !j.ok &&
      /sesi panitia tidak valid|sesi tidak valid|sudah berakhir/i.test(
        j.error || ""
      )
    ) {
      this.expired();
      throw Error(j.error || "Sesi berakhir");
    }

    if (!j.ok) throw Error(j.error || "Permintaan ditolak");

    return j;
  },

  expired() {
    this.save(null);
    try {
      UNL = false;
    } catch (e) {}
  },

  async restore() {
    /* Pulihkan sesi setelah halaman dimuat ulang */
    if (!this.token()) return;

    try {
      await this.post({ action: "whoami" });
      UNL = true;
    } catch (e) {
      this.save(null);
    }
  },

  async logout() {
    const t = this.token();

    this.save(null);
    this.idt = null;
    UNL = false;

    try {
      if (t) {
        await this.raw({
          action: "logout",
          token: t
        });
      }
    } catch (e) {}

    try {
      google.accounts.id.disableAutoSelect();
    } catch (e) {}
  },

  jwt(t) {
    try {
      const b = t.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      return JSON.parse(
        decodeURIComponent(escape(atob(b)))
      );
    } catch (e) {
      return null;
    }
  },

  open() {
    if (UNL && this.token()) return openAdmin();

    const cid = this.cid();

    openM(`
      <h3>🔒 Akses Panitia</h3>
      <p class="au-p">
        Masuk butuh <b>dua hal yang harus cocok</b>:
        akun Google panitia dan password pribadi milik akun itu.
        Salah satu keliru, tertukar, atau typo = tidak bisa masuk.
      </p>

      <div class="au-step">
        <b>1 · Akun Google</b>
        <div id="gbtn" class="au-gb"></div>
        <div id="gwho" class="au-who" hidden></div>
      </div>

      <div class="au-step">
        <label for="apw"><b>2 · Password pribadi</b></label>
        <input
          id="apw"
          type="password"
          autocomplete="current-password"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Password milikmu sendiri"
          aria-label="Password panitia"
        >
      </div>

      <div id="ae" role="alert"></div>
      <button class="btn gold" id="ab" disabled>Masuk</button>
    `);

    const ae = $("#ae");
    const ab = $("#ab");
    const pw = $("#apw");
    const who = $("#gwho");
    const gb = $("#gbtn");

    const upd = () => {
      ab.disabled = !(this.idt && pw.value.length > 0);
    };

    const err = m => {
      ae.innerHTML = m
        ? `<div class="bad">${esc(m)}</div>`
        : "";
    };

    if (!cid || /^GANTI_/.test(cid)) {
      gb.innerHTML =
        '<div class="bad">Client ID Google belum dipasang di KONF.GOOGLE_CLIENT_ID.</div>';
      return;
    }

    const showWho = () => {
      const p = this.jwt(this.idt) || {};

      gb.hidden = true;
      who.hidden = false;

      who.innerHTML = `
        ✅ <b>${esc(p.email || "akun Google")}</b>
        <button class="btn mini" id="gsw" type="button">
          Ganti akun
        </button>
      `;

      $("#gsw").onclick = () => {
        this.idt = null;
        who.hidden = true;
        gb.hidden = false;

        try {
          google.accounts.id.disableAutoSelect();
        } catch (e) {}

        draw();
        upd();
      };

      setTimeout(() => pw.focus(), 60);
    };

    const draw = () => {
      gb.innerHTML = "";

      google.accounts.id.renderButton(gb, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 260,
        locale: "id"
      });
    };

    const init = () => {
      google.accounts.id.initialize({
        client_id: cid,
        auto_select: false,
        cancel_on_tap_outside: true,

        callback: r => {
          this.idt = r.credential;
          err("");
          showWho();
          upd();
        }
      });

      draw();
    };

    if (
      window.google &&
      google.accounts &&
      google.accounts.id
    ) {
      init();
    } else {
      gb.innerHTML =
        '<span class="au-who">Memuat Google…</span>';

      let n = 0;

      const iv = setInterval(() => {
        if (
          window.google &&
          google.accounts &&
          google.accounts.id
        ) {
          clearInterval(iv);
          init();
        } else if (++n > 80) {
          clearInterval(iv);

          gb.innerHTML =
            '<div class="bad">Tidak bisa memuat Google Sign-In. Cek koneksi internet / pemblokir iklan, lalu muat ulang.</div>';
        }
      }, 125);
    }

    pw.oninput = upd;

    const go = async () => {
      if (ab.disabled) return;

      err("");
      ab.disabled = true;
      ab.textContent = "Memeriksa…";

      try {
        const j = await this.raw({
          action: "login",
          idToken: this.idt,
          password: pw.value
        });

        if (!j.ok) {
          if (
            /Google/.test(j.error || "") &&
            /pilih akun|kedaluwarsa|tidak valid|dipakai/i.test(
              j.error
            )
          ) {
            this.idt = null;
            who.hidden = true;
            gb.hidden = false;

            try {
              draw();
            } catch (e) {}
          }

          pw.value = "";
          throw Error(j.error || "Gagal masuk");
        }

        this.save({
          token: j.token,
          name: j.name,
          email: j.email
        });

        this.idt = null;
        UNL = true;

        try {
          KS.loaded = false;
          KS.err = "";
        } catch (e) {}

        try {
          google.accounts.id.disableAutoSelect();
        } catch (e) {}

        toast("Selamat datang, " + (j.name || "panitia") + " 👋");
        openAdmin();

      } catch (e) {
        err(e.message || String(e));
        ab.textContent = "Masuk";
        upd();
        return;
      }

      ab.textContent = "Masuk";
    };

    ab.onclick = go;

    pw.onkeydown = e => {
      e.stopPropagation();
      if (e.key === "Enter") go();
    };
  }
};

AUTH.load();

window.addEventListener("load", () => {
  if (AUTH.token()) {
    setTimeout(() => AUTH.restore(), 400);
  }
});
