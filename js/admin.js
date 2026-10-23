/**
 * ADMIN CONTROLLER - QUẢN TRỊ THIỆP CƯỚI NGUYỄN HOÀNG THIÊN BÌNH & KIỀU THU HÀ
 * Hỗ trợ 2 chế độ:
 *  - 'main': Trang chính (Có STK & Ảnh mới a2b.jpg) -> lưu vào data/main-data.json
 *  - 'binhha': Trang chú rể (Không STK & Ảnh cũ) -> lưu vào data/binhha-data.json
 * Mật khẩu đăng nhập: binhha2026
 */

const ADMIN_PASSWORD = "binhha2026";
let currentAdminPage = "main";
let weddingData = null;

document.addEventListener("DOMContentLoaded", () => {
  currentAdminPage = document.body?.dataset.adminPage || "main";
  initAuth();
  initTabs();
  loadData();
  setupHandlers();
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
  setVal("ceremony-tag", data.ceremony?.tag || "TIỆC MỪNG THÂN MẬT");
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

  setVal("bride-name", data.bride?.name);
  setVal("bride-father", data.bride?.father);
  setVal("bride-mother", data.bride?.mother);

  // 5. STK (chỉ trang main)
  if (currentAdminPage === "main") {
    setVal("gift-bank-name", data.gift?.bankName || "Techcombank");
    setVal("gift-account-name", data.gift?.accountName || "NGUYEN HOANG THIEN BINH");
    setVal("gift-account-number", data.gift?.accountNumber || "6099 1010 10");
    setVal("gift-qr-photo", data.gift?.qrPhoto || "img/qr-groom.jpg");
    setVal("gift-message", data.gift?.message);
  }

  // 6. Nhạc nền & Ảnh bìa
  setVal("hero-photo", data.hero?.photo || (currentAdminPage === "main" ? "img/hero-a2b.jpg" : "img/hero-groom.jpg"));
  setVal("music-title", data.music?.title || "Mối Duyên Vàng");
  setVal("music-url", data.music?.url || "audio/moi-duyen-vang.mp3");
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
    tag: getVal("ceremony-tag") || "TIỆC MỪNG THÂN MẬT",
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
  weddingData.groom = {
    name: getVal("groom-name") || "Nguyễn Hoàng Thiên Bình",
    role: "Chú Rể",
    photo: "img/groom.jpg",
    father: getVal("groom-father") || "Nguyễn Duy Hiển",
    mother: getVal("groom-mother") || "Phùng Thiên Hương"
  };

  weddingData.bride = {
    name: getVal("bride-name") || "Kiều Thu Hà",
    role: "Cô Dâu",
    photo: "img/bride.jpg",
    father: getVal("bride-father") || "Kiều Hưng",
    mother: getVal("bride-mother") || "Triệu Thị Chinh"
  };

  // STK
  if (currentAdminPage === "main") {
    weddingData.gift = {
      enabled: true,
      bankName: getVal("gift-bank-name") || "Techcombank",
      accountName: getVal("gift-account-name") || "NGUYEN HOANG THIEN BINH",
      accountNumber: getVal("gift-account-number") || "6099 1010 10",
      qrPhoto: getVal("gift-qr-photo") || "img/qr-groom.jpg",
      message: getVal("gift-message") || "Sự hiện diện hay tình cảm và lời chúc phúc từ phương xa của quý khách đều là niềm vinh hạnh to lớn đối với gia đình chúng tôi!"
    };
  } else {
    weddingData.gift = {
      enabled: false
    };
  }

  // Hero & Music
  const defaultPhoto = currentAdminPage === "main" ? "img/hero-a2b.jpg" : "img/hero-groom.jpg";
  weddingData.hero = {
    tag: getVal("ceremony-tag") || "TIỆC MỪNG THÂN MẬT",
    heading: "Thiệp Mừng Báo Hỷ",
    photo: getVal("hero-photo") || defaultPhoto
  };

  weddingData.music = {
    title: getVal("music-title") || "Mối Duyên Vàng",
    url: getVal("music-url") || "audio/moi-duyen-vang.mp3"
  };
}

/* ==========================================================================
   5. THIẾT LẬP CÁC SỰ KIỆN NÚT BẤM
   ========================================================================== */
function setupHandlers() {
  const storageKey = currentAdminPage === "main" ? "binhha_admin_main_data" : "binhha_admin_binhha_data";
  const jsonFilename = currentAdminPage === "main" ? "main-data.json" : "binhha-data.json";

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
        alert("Lỗi lưu trữ: " + err.message);
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

  // Nút Đồng bộ lên GitHub
  const btnSyncGithub = document.getElementById("btn-sync-github");
  if (btnSyncGithub) {
    btnSyncGithub.addEventListener("click", handleGitHubSync);
  }
}

/* ==========================================================================
   6. ĐỒNG BỘ LÊN GITHUB THÔNG QUA GITHUB API
   ========================================================================== */
async function handleGitHubSync() {
  collectFormData();

  const repo = "binhha-wedding/binhha-wedding.github.io";
  const jsonPath = currentAdminPage === "main" ? "data/main-data.json" : "data/binhha-data.json";

  const tokenPrompt = prompt(
    `🚀 XUẤT BẢN LÊN GITHUB PAGES\n\n` +
    `Dữ liệu sẽ được đẩy trực tiếp vào file '${jsonPath}' trên repo ${repo}.\n\n` +
    `Vui lòng nhập GitHub Personal Access Token (PAT) có quyền 'repo':`,
    localStorage.getItem("github_sync_token") || ""
  );

  if (!tokenPrompt) return;
  const token = tokenPrompt.trim();
  localStorage.setItem("github_sync_token", token);

  showToast("Đang kết nối GitHub và xuất bản...", 6000);

  try {
    // 1. Lấy SHA hiện tại của file
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${jsonPath}`, {
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

    // 3. Đẩy file lên GitHub
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${jsonPath}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Admin: Cập nhật cấu hình ${jsonPath} [skip ci]`,
        content: contentBase64,
        sha: sha || undefined,
        branch: "main"
      })
    });

    if (putRes.ok) {
      // Lưu luôn vào local storage
      const storageKey = currentAdminPage === "main" ? "binhha_admin_main_data" : "binhha_admin_binhha_data";
      localStorage.setItem(storageKey, JSON.stringify(weddingData));

      alert(
        `🎉 XUẤT BẢN THÀNH CÔNG!\n\n` +
        `File ${jsonPath} đã được đẩy lên GitHub thành công.\n` +
        `Khoảng 1-2 phút nữa GitHub Pages sẽ hoàn tất cập nhật cho toàn bộ khách mời!`
      );
      showToast("Xuất bản lên GitHub thành công!");
    } else {
      const errData = await putRes.json();
      alert(`❌ Lỗi xuất bản GitHub (${putRes.status}): ${errData.message || "Không xác định"}`);
    }
  } catch (err) {
    console.error("GitHub Sync Error:", err);
    alert(`❌ Lỗi kết nối mạng: ${err.message}`);
  }
}

/* ==========================================================================
   7. HÀM TIỆN ÍCH HỖ TRỢ
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
