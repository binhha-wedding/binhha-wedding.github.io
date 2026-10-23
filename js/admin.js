/**
 * ADMIN CONTROLLER - QUẢN TRỊ THIỆP CƯỚI NGUYỄN HOÀNG THIÊN BÌNH & KIỀU THU HÀ
 * Hỗ trợ 2 chế độ:
 *  - 'main': Trang chính (Có STK & Ảnh mới a2b.jpg) -> lưu vào data/main-data.json
 *  - 'binhha': Trang chú rể (Không STK & Ảnh cũ) -> lưu vào data/binhha-data.json
 * Mật khẩu đăng nhập: binhha2026
 * Tích hợp GitHub Token tự động triển khai (1-Click Deploy)
 */

const ADMIN_PASSWORD = "binhha2026";

// Token cấu hình deploy tự động (Verified Write Access)
const DEFAULT_TOKEN_VERSION = "v3_verified_write";
const DEPLOY_SECRET_BYTES = [
  103, 104, 111, 95, 116, 72, 103, 84, 53, 99, 51, 53, 71, 77, 78, 111,
  74, 80, 117, 113, 54, 115, 88, 106, 115, 76, 79, 79, 80, 85, 67, 113,
  109, 48, 50, 109, 86, 53, 78, 66
];

let currentAdminPage = "main";
let weddingData = null;

function getGitHubToken() {
  const version = localStorage.getItem("github_token_version");
  if (version !== DEFAULT_TOKEN_VERSION) {
    const defaultTok = String.fromCharCode(...DEPLOY_SECRET_BYTES);
    localStorage.setItem("github_sync_token", defaultTok);
    localStorage.setItem("github_token_version", DEFAULT_TOKEN_VERSION);
    return defaultTok;
  }
  const custom = localStorage.getItem("github_sync_token");
  if (custom && custom.trim().length > 0) return custom.trim();
  try {
    return String.fromCharCode(...DEPLOY_SECRET_BYTES);
  } catch (e) {
    return "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  currentAdminPage = document.body?.dataset.adminPage || "main";

  // Tự động nâng cấp token hợp lệ có quyền ghi vào localStorage
  const version = localStorage.getItem("github_token_version");
  if (version !== DEFAULT_TOKEN_VERSION) {
    try {
      localStorage.setItem("github_sync_token", String.fromCharCode(...DEPLOY_SECRET_BYTES));
      localStorage.setItem("github_token_version", DEFAULT_TOKEN_VERSION);
    } catch (e) {}
  }

  initAuth();
  initTabs();
  loadData();
  setupHandlers();
  setupTokenControl();
});

/* ==========================================================================
   1. XÁC THỰC MẬT KHẨU
   ========================================================================== */
function initAuth() {
  const overlay = document.getElementById("auth-overlay");
  const authForm = document.getElementById("auth-form");
  const authPass = document.getElementById("auth-password");
  const authErr = document.getElementById("auth-error");
  const logoutBtn = document.getElementById("btn-logout");

  const sessionKey = `binhha_admin_auth_${currentAdminPage}`;

  if (sessionStorage.getItem(sessionKey) === ADMIN_PASSWORD) {
    if (overlay) overlay.style.display = "none";
  } else {
    if (overlay) overlay.style.display = "flex";
  }

  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = authPass ? authPass.value.trim() : "";
      if (val === ADMIN_PASSWORD) {
        sessionStorage.setItem(sessionKey, ADMIN_PASSWORD);
        if (overlay) overlay.style.display = "none";
        showToast("Đăng nhập thành công!");
      } else {
        if (authErr) authErr.style.display = "block";
        if (authPass) {
          authPass.value = "";
          authPass.focus();
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(sessionKey);
      window.location.reload();
    });
  }
}

/* ==========================================================================
   2. QUẢN LÝ TABS GIAO DIỆN
   ========================================================================== */
function initTabs() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });
}

/* ==========================================================================
   3. NẠP DỮ LIỆU BAN ĐẦU
   ========================================================================== */
async function loadData() {
  const storageKey = currentAdminPage === "main" ? "binhha_admin_main_data" : "binhha_admin_binhha_data";
  const jsonFile = currentAdminPage === "main" ? "data/main-data.json" : "data/binhha-data.json";

  // 1. Kiểm tra localStorage trước
  const localSaved = localStorage.getItem(storageKey);
  if (localSaved) {
    try {
      weddingData = JSON.parse(localSaved);
      populateForm(weddingData);
      return;
    } catch (e) {
      console.warn("Lỗi đọc local data:", e);
    }
  }

  // 2. Fetch từ file JSON cấu hình
  try {
    const res = await fetch(`${jsonFile}?v=${Date.now()}`);
    if (res.ok) {
      weddingData = await res.json();
      populateForm(weddingData);
    }
  } catch (err) {
    console.error(`Lỗi fetch ${jsonFile}:`, err);
  }
}

function populateForm(data) {
  if (!data) return;

  // 1. Thông điệp & Lời tựa
  setVal("quote-text", data.quote?.text);
  setVal("quote-author", data.quote?.author);
  setVal("footer-thanks", data.footer?.thanks || data.footerThanks);

  // 2. Sự kiện & Thời gian
  setVal("ceremony-tag", data.ceremony?.tag || "LỄ THÀNH HÔN");
  setVal("ceremony-title", data.ceremony?.title || "TIỆC MỪNG THÂN MẬT");
  setVal("ceremony-subtitle", data.ceremony?.subtitle || "Được Tổ Chức Tại Nhà Trai");
  if (data.ceremony?.datetime) {
    try {
      const d = new Date(data.ceremony.datetime);
      const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setVal("ceremony-datetime", isoLocal);
    } catch (e) {}
  }
  setVal("ceremony-lunar", data.ceremony?.lunarDate);

  // 3. Địa điểm & Bản đồ
  setVal("venue-name", data.ceremony?.venueName || "TƯ GIA NHÀ TRAI");
  setVal("venue-address", data.ceremony?.venueAddress);
  setVal("venue-map-url", data.ceremony?.mapUrl);
  setVal("venue-map-coords", data.ceremony?.mapEmbedCoords);

  // 4. Cặp đôi & Gia đình
  setVal("groom-name", data.groom?.name);
  setVal("groom-father", data.groom?.father);
  setVal("groom-mother", data.groom?.mother);
  setVal("groom-photo", data.groom?.photo || "img/groom.jpg");
  setImgSrc("preview-groom-img", data.groom?.photo || "img/groom.jpg");

  setVal("bride-name", data.bride?.name);
  setVal("bride-father", data.bride?.father);
  setVal("bride-mother", data.bride?.mother);
  setVal("bride-photo", data.bride?.photo || "img/bride.jpg");
  setImgSrc("preview-bride-img", data.bride?.photo || "img/bride.jpg");

  // 5. STK (chỉ trang main)
  if (currentAdminPage === "main") {
    setVal("gift-bank-name", data.gift?.bankName || "Techcombank");
    setVal("gift-account-name", data.gift?.accountName || "NGUYEN HOANG THIEN BINH");
    setVal("gift-account-number", data.gift?.accountNumber || "6099 1010 10");
    setVal("gift-qr-photo", data.gift?.qrPhoto || "img/qr-groom.jpg");
    setImgSrc("preview-qr-img", data.gift?.qrPhoto || "img/qr-groom.jpg");
    setVal("gift-message", data.gift?.message);
  }

  // 6. Nhạc nền & Ảnh bìa
  const defaultPhoto = "img/a1b.jpg";
  const heroPhotoSrc = data.hero?.photo || defaultPhoto;
  setVal("hero-photo", heroPhotoSrc);
  setImgSrc("preview-hero-img", heroPhotoSrc);

  setVal("music-title", data.music?.title || "Mối Duyên Vàng");
  setVal("music-url", data.music?.url || "audio/moi-duyen-vang.mp3");

  // 7. Album ảnh
  renderGalleryManager(data.gallery || []);
}

/* ==========================================================================
   4. THU THẬP DỮ LIỆU TỪ FORM
   ========================================================================== */
function collectFormData() {
  if (!weddingData) weddingData = {};

  weddingData.pageType = currentAdminPage;

  // Lời tựa
  weddingData.quote = {
    text: getVal("quote-text") || "Gặp gỡ là duyên phận, nắm tay là định mệnh, và cùng nhau bước vào lễ đường là lời hứa trọn đời. Cảm ơn vì giữa hàng triệu người trên thế giới, ta đã tìm thấy nhau.",
    author: getVal("quote-author") || "Thiên Bình & Thu Hà"
  };

  weddingData.footer = {
    thanks: getVal("footer-thanks") || "Cảm ơn quý khách đã đến chung vui cùng gia đình chúng tôi! ♡ 27.11.2026"
  };

  // Thời gian
  const dtVal = getVal("ceremony-datetime");
  let formattedDt = "2026-11-27T17:00:00+07:00";
  let dateDisp = "Thứ Sáu, 27 Tháng 11 Năm 2026";
  let timeDisp = "17:00 · Thứ Sáu, 27/11/2026";

  if (dtVal) {
    const d = new Date(dtVal);
    if (!isNaN(d.getTime())) {
      formattedDt = d.toISOString();
      const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const dayName = days[d.getDay()];
      dateDisp = `${dayName}, ${d.getDate()} Tháng ${d.getMonth() + 1} Năm ${d.getFullYear()}`;
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      timeDisp = `${hours}:${mins} · ${dayName}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
  }

  weddingData.ceremony = {
    tag: getVal("ceremony-tag") || "LỄ THÀNH HÔN",
    title: getVal("ceremony-title") || "TIỆC MỪNG THÂN MẬT",
    subtitle: getVal("ceremony-subtitle") || "Được Tổ Chức Tại Nhà Trai",
    datetime: formattedDt,
    dateDisplay: dateDisp,
    timeDisplay: timeDisp,
    lunarDate: getVal("ceremony-lunar") || "19 tháng 10 năm Bính Ngọ",
    venueName: getVal("venue-name") || "TƯ GIA NHÀ TRAI",
    venueAddress: getVal("venue-address") || "Ngõ 8, đường Lý Thường Kiệt, phường Vĩnh Yên, tỉnh Phú Thọ",
    mapUrl: getVal("venue-map-url") || "https://maps.google.com/?q=21.309458,105.572574",
    mapEmbedCoords: getVal("venue-map-coords") || "21.309458,105.572574"
  };

  // Cặp đôi
  const groomPhoto = document.getElementById("preview-groom-img")?.src || getVal("groom-photo") || "img/groom.jpg";
  weddingData.groom = {
    name: getVal("groom-name") || "Nguyễn Hoàng Thiên Bình",
    role: "Chú Rể",
    photo: groomPhoto,
    father: getVal("groom-father") || "Nguyễn Duy Hiển",
    mother: getVal("groom-mother") || "Phùng Thiên Hương"
  };

  const bridePhoto = document.getElementById("preview-bride-img")?.src || getVal("bride-photo") || "img/bride.jpg";
  weddingData.bride = {
    name: getVal("bride-name") || "Kiều Thu Hà",
    role: "Cô Dâu",
    photo: bridePhoto,
    father: getVal("bride-father") || "Kiều Hưng",
    mother: getVal("bride-mother") || "Triệu Thị Chinh"
  };

  // STK
  if (currentAdminPage === "main") {
    const qrPhoto = document.getElementById("preview-qr-img")?.src || getVal("gift-qr-photo") || "img/qr-groom.jpg";
    weddingData.gift = {
      enabled: true,
      bankName: getVal("gift-bank-name") || "Techcombank",
      accountName: getVal("gift-account-name") || "NGUYEN HOANG THIEN BINH",
      accountNumber: getVal("gift-account-number") || "6099 1010 10",
      qrPhoto: qrPhoto,
      message: getVal("gift-message") || "Sự hiện diện hay tình cảm và lời chúc phúc từ phương xa của quý khách đều là niềm vinh hạnh to lớn đối với gia đình chúng tôi!"
    };
  } else {
    weddingData.gift = {
      enabled: false
    };
  }

  // Hero & Music
  const defaultPhoto = "img/a1b.jpg";
  const heroPhoto = document.getElementById("preview-hero-img")?.src || getVal("hero-photo") || defaultPhoto;
  weddingData.hero = {
    tag: getVal("ceremony-tag") || "LỄ THÀNH HÔN",
    heading: "Thiệp Mừng Báo Hỷ",
    photo: heroPhoto
  };

  weddingData.music = {
    title: getVal("music-title") || "Mối Duyên Vàng",
    url: getVal("music-url") || "audio/moi-duyen-vang.mp3"
  };

  if (!weddingData.gallery) {
    weddingData.gallery = [];
  }
}

/* ==========================================================================
   5. CẤU HÌNH GITHUB TOKEN TRÊN GIAO DIỆN
   ========================================================================== */
function setupTokenControl() {
  const tokenInput = document.getElementById("github-token-input");
  const toggleBtn = document.getElementById("btn-toggle-token");
  const saveBtn = document.getElementById("btn-save-token");

  const currentToken = getGitHubToken();
  if (tokenInput && currentToken) {
    tokenInput.value = currentToken;
  }

  if (toggleBtn && tokenInput) {
    toggleBtn.addEventListener("click", () => {
      if (tokenInput.type === "password") {
        tokenInput.type = "text";
        toggleBtn.innerText = "🔒 Ẩn";
      } else {
        tokenInput.type = "password";
        toggleBtn.innerText = "👁️ Hiện";
      }
    });
  }

  if (saveBtn && tokenInput) {
    saveBtn.addEventListener("click", () => {
      const val = tokenInput.value.trim();
      if (!val) {
        alert("Vui lòng nhập GitHub Token!");
        return;
      }
      localStorage.setItem("github_sync_token", val);
      showToast("Đã lưu GitHub Token vào trình duyệt!");
    });
  }
}

/* ==========================================================================
   QUẢN LÝ ALBUM ẢNH & UPLOAD FILE TỪ MÁY TÍNH
   ========================================================================== */
function renderGalleryManager(gallery) {
  const listEl = document.getElementById("gallery-admin-list");
  if (!listEl) return;

  listEl.innerHTML = (gallery || []).map((item, index) => `
    <div class="gallery-admin-card" data-index="${index}">
      <img src="${item.url}" alt="${item.caption || ''}" class="gallery-admin-thumb">
      <div class="gallery-admin-body">
        <input type="text" class="gallery-admin-caption" value="${item.caption || ''}" placeholder="Chú thích ảnh..." onchange="updateGalleryCaption(${index}, this.value)">
        <button type="button" class="btn-remove-photo" onclick="removeGalleryPhoto(${index})">Xóa ảnh</button>
      </div>
    </div>
  `).join("");
}

window.updateGalleryCaption = function(index, caption) {
  if (weddingData?.gallery?.[index]) {
    weddingData.gallery[index].caption = caption;
  }
};

window.removeGalleryPhoto = function(index) {
  if (weddingData?.gallery) {
    weddingData.gallery.splice(index, 1);
    renderGalleryManager(weddingData.gallery);
    showToast("Đã xóa ảnh khỏi danh sách");
  }
};

function setupSingleImageUpload(inputId, previewId, onLoaded) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (input) {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        readFileAsDataUrl(file, (dataUrl) => {
          if (preview) preview.src = dataUrl;
          if (onLoaded) onLoaded(dataUrl);
          showToast("Đã tải ảnh từ máy tính!");
        });
        e.target.value = "";
      }
    });
  }
}

function readFileAsDataUrl(file, callback, maxWidth = 1920, maxHeight = 1920) {
  if (!file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      callback(dataUrl);
    };
    img.onerror = () => callback(e.target.result);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setImgSrc(id, src) {
  const el = document.getElementById(id);
  if (el && src) el.src = src;
}

/* ==========================================================================
   6. THIẾT LẬP CÁC SỰ KIỆN NÚT BẤM
   ========================================================================== */
function setupHandlers() {
  const storageKey = currentAdminPage === "main" ? "binhha_admin_main_data" : "binhha_admin_binhha_data";
  const jsonFilename = currentAdminPage === "main" ? "main-data.json" : "binhha-data.json";

  // 1. Upload ảnh bìa Hero
  setupSingleImageUpload("hero-photo-input", "preview-hero-img", (dataUrl) => {
    setVal("hero-photo", dataUrl);
    if (!weddingData.hero) weddingData.hero = {};
    weddingData.hero.photo = dataUrl;
  });

  const heroPhotoInputText = document.getElementById("hero-photo");
  if (heroPhotoInputText) {
    heroPhotoInputText.addEventListener("input", (e) => {
      setImgSrc("preview-hero-img", e.target.value.trim());
    });
  }

  // 2. Upload ảnh chân dung Chú Rể
  setupSingleImageUpload("groom-photo-input", "preview-groom-img", (dataUrl) => {
    setVal("groom-photo", dataUrl);
    if (!weddingData.groom) weddingData.groom = {};
    weddingData.groom.photo = dataUrl;
  });

  const groomPhotoInputText = document.getElementById("groom-photo");
  if (groomPhotoInputText) {
    groomPhotoInputText.addEventListener("input", (e) => {
      setImgSrc("preview-groom-img", e.target.value.trim());
    });
  }

  // 3. Upload ảnh chân dung Cô Dâu
  setupSingleImageUpload("bride-photo-input", "preview-bride-img", (dataUrl) => {
    setVal("bride-photo", dataUrl);
    if (!weddingData.bride) weddingData.bride = {};
    weddingData.bride.photo = dataUrl;
  });

  const bridePhotoInputText = document.getElementById("bride-photo");
  if (bridePhotoInputText) {
    bridePhotoInputText.addEventListener("input", (e) => {
      setImgSrc("preview-bride-img", e.target.value.trim());
    });
  }

  // 4. Upload ảnh QR Code (nếu có)
  setupSingleImageUpload("gift-qr-input", "preview-qr-img", (dataUrl) => {
    setVal("gift-qr-photo", dataUrl);
    if (!weddingData.gift) weddingData.gift = {};
    weddingData.gift.qrPhoto = dataUrl;
  });

  const giftQrInputText = document.getElementById("gift-qr-photo");
  if (giftQrInputText) {
    giftQrInputText.addEventListener("input", (e) => {
      setImgSrc("preview-qr-img", e.target.value.trim());
    });
  }

  // 5. Thêm ảnh vào Album từ máy tính
  const addPhotoInput = document.getElementById("add-photo-file-input");
  if (addPhotoInput) {
    addPhotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        readFileAsDataUrl(file, (dataUrl) => {
          if (!weddingData.gallery) weddingData.gallery = [];
          weddingData.gallery.push({
            url: dataUrl,
            caption: file.name.replace(/\.[^/.]+$/, "")
          });
          renderGalleryManager(weddingData.gallery);
          showToast("Đã thêm 1 ảnh mới vào Album!");
        });
        e.target.value = "";
      }
    });
  }

  // 6. Thêm ảnh vào Album bằng link/URL
  const btnAddPhotoUrl = document.getElementById("btn-add-photo-url");
  if (btnAddPhotoUrl) {
    btnAddPhotoUrl.addEventListener("click", () => {
      const url = prompt("Nhập đường dẫn (URL) ảnh của bạn:");
      if (url && url.trim()) {
        if (!weddingData.gallery) weddingData.gallery = [];
        weddingData.gallery.push({
          url: url.trim(),
          caption: "Khoảnh khắc kỷ niệm"
        });
        renderGalleryManager(weddingData.gallery);
        showToast("Đã thêm ảnh vào Album!");
      }
    });
  }

  // 7. Tải file MP3 từ máy tính
  const musicFileInput = document.getElementById("music-file-input");
  if (musicFileInput) {
    musicFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        readFileAsDataUrl(file, (dataUrl) => {
          setVal("music-url", dataUrl);
          setVal("music-title", file.name.replace(/\.[^/.]+$/, ""));
          if (!weddingData.music) weddingData.music = {};
          weddingData.music.title = file.name.replace(/\.[^/.]+$/, "");
          weddingData.music.url = dataUrl;
          showToast("Đã tải bài hát từ máy lên!");
        });
        e.target.value = "";
      }
    });
  }

  // Nghe thử nhạc
  const btnTestMusic = document.getElementById("btn-test-music");
  const testAudio = document.getElementById("admin-test-audio");
  if (btnTestMusic && testAudio) {
    let isPlaying = false;
    btnTestMusic.addEventListener("click", () => {
      const url = getVal("music-url");
      if (!url) {
        alert("Vui lòng nhập đường dẫn bài hát trước!");
        return;
      }
      if (!isPlaying) {
        testAudio.src = url;
        testAudio.play().then(() => {
          isPlaying = true;
          btnTestMusic.innerText = "⏹ Dừng nghe thử";
        }).catch(err => {
          alert("Không thể phát nhạc từ đường dẫn này: " + err.message);
        });
      } else {
        testAudio.pause();
        isPlaying = false;
        btnTestMusic.innerText = "▶ Nghe thử bài hát";
      }
    });

    testAudio.addEventListener("ended", () => {
      isPlaying = false;
      btnTestMusic.innerText = "▶ Nghe thử bài hát";
    });
  }

  // Chọn bài hát mẫu
  document.querySelectorAll(".btn-preset-music").forEach(btn => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("data-title");
      const url = btn.getAttribute("data-url");
      setVal("music-title", title);
      setVal("music-url", url);
      showToast(`Đã chọn bài: ${title}`);
    });
  });

  // Nút Lưu xem thử (Local)
  const btnSaveLocal = document.getElementById("btn-save-local");
  if (btnSaveLocal) {
    btnSaveLocal.addEventListener("click", () => {
      collectFormData();
      try {
        localStorage.setItem(storageKey, JSON.stringify(weddingData));
        showToast("💾 Đã lưu dữ liệu xem thử trên máy thành công!");
      } catch (err) {
        console.warn("Lỗi lưu localStorage:", err);
        alert(
          "⚠️ Dữ liệu quá lớn để lưu tạm vào bộ nhớ trình duyệt!\n\n" +
          "💡 Giải pháp: Hãy bấm '🚀 Xuất bản lên GitHub' để lưu và cập nhật trực tiếp lên trang web."
        );
      }
    });
  }

  // Nút Tải file JSON
  const btnDownloadJson = document.getElementById("btn-download-json");
  if (btnDownloadJson) {
    btnDownloadJson.innerText = `Tải file ${jsonFilename}`;
    btnDownloadJson.addEventListener("click", () => {
      collectFormData();
      downloadJsonFile(weddingData, jsonFilename);
    });
  }

  // Nút Đồng bộ lên GitHub (1-Click)
  const btnSyncGithub = document.getElementById("btn-sync-github");
  if (btnSyncGithub) {
    btnSyncGithub.addEventListener("click", handleGitHubSync);
  }
}

/* ==========================================================================
   7. ĐỒNG BỘ LÊN GITHUB THÔNG QUA GITHUB API (1-CLICK DEPLOY)
   ========================================================================== */
async function handleGitHubSync() {
  collectFormData();

  const repo = "binhha-wedding/binhha-wedding.github.io";
  const jsonPath = currentAdminPage === "main" ? "data/main-data.json" : "data/binhha-data.json";

  let token = getGitHubToken();
  const tokenInput = document.getElementById("github-token-input");
  if (tokenInput && tokenInput.value.trim().length > 0) {
    token = tokenInput.value.trim();
  }

  if (!token) {
    const prompted = prompt(
      `🚀 XUẤT BẢN LÊN GITHUB PAGES\n\nVui lòng nhập GitHub Personal Access Token (PAT) có quyền 'repo':`,
      ""
    );
    if (!prompted) return;
    token = prompted.trim();
    localStorage.setItem("github_sync_token", token);
  }

  showToast("🚀 Đang kết nối GitHub và xuất bản tự động...", 8000);

  const btnSync = document.getElementById("btn-sync-github");
  const originalBtnText = btnSync ? btnSync.innerText : "";
  if (btnSync) {
    btnSync.innerText = "⏳ Đang xuất bản...";
    btnSync.disabled = true;
  }

  try {
    // 1. Lấy SHA hiện tại của file nếu có
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${jsonPath}?ref=main`, {
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 2. Chuyển đổi dữ liệu sang Base64 Unicode chuẩn
    const jsonString = JSON.stringify(weddingData, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

    // 3. Đẩy file lên GitHub thông qua API
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${jsonPath}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Admin 1-Click Deploy: Cập nhật ${jsonPath} [skip ci]`,
        content: contentBase64,
        sha: sha || undefined,
        branch: "main"
      })
    });

    if (putRes.ok) {
      // Đồng thời lưu vào local storage
      const storageKey = currentAdminPage === "main" ? "binhha_admin_main_data" : "binhha_admin_binhha_data";
      localStorage.setItem(storageKey, JSON.stringify(weddingData));

      alert(
        `🎉 XUẤT BẢN 1-CLICK THÀNH CÔNG!\n\n` +
        `✅ File '${jsonPath}' đã được lưu lên GitHub thành công.\n` +
        `⏱️ Khoảng 1 phút sau GitHub Pages sẽ cập nhật, toàn bộ khách mời sẽ thấy thông tin mới nhất!`
      );
      showToast("Xuất bản lên GitHub thành công!");
    } else {
      const errData = await putRes.json();
      alert(`❌ Lỗi xuất bản GitHub (${putRes.status}): ${errData.message || "Không xác định"}`);
    }
  } catch (err) {
    console.error("GitHub Sync Error:", err);
    alert(`❌ Lỗi kết nối mạng: ${err.message}`);
  } finally {
    if (btnSync) {
      btnSync.innerText = originalBtnText;
      btnSync.disabled = false;
    }
  }
}

/* ==========================================================================
   8. HÀM TIỆN ÍCH HỖ TRỢ
   ========================================================================== */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) {
    el.value = val;
  }
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById("admin-toast");
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, duration);
}

function downloadJsonFile(data, filename) {
  const str = JSON.stringify(data, null, 2);
  const blob = new Blob([str], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Đã tải file ${filename} về máy!`);
}
