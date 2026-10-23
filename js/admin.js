/**
 * ADMIN CONTROLLER - THIỆP CƯỚI ONLINE (habinh2026)
 * Quản lý thay đổi toàn bộ thông tin, ảnh, nhạc thiệp cưới
 */

const ADMIN_PASSWORD = "habinh2026";
let weddingData = null;

document.addEventListener("DOMContentLoaded", () => {
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

  // Kiểm tra session hiện tại
  if (sessionStorage.getItem("admin_auth") === ADMIN_PASSWORD) {
    if (overlay) overlay.style.display = "none";
  } else {
    if (overlay) overlay.style.display = "flex";
  }

  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = authPass ? authPass.value.trim() : "";
      if (val === ADMIN_PASSWORD) {
        sessionStorage.setItem("admin_auth", ADMIN_PASSWORD);
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
      sessionStorage.removeItem("admin_auth");
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
  // 1. Kiểm tra localStorage trước
  const localSaved = localStorage.getItem("admin_wedding_data");
  if (localSaved) {
    try {
      weddingData = JSON.parse(localSaved);
      populateForm(weddingData);
      return;
    } catch (e) {
      console.warn("Lỗi đọc local data:", e);
    }
  }

  // 2. Nếu chưa có, fetch từ data/wedding-data.json
  try {
    const res = await fetch(`data/wedding-data.json?v=${Date.now()}`);
    if (res.ok) {
      weddingData = await res.json();
      populateForm(weddingData);
    } else {
      console.warn("Chưa tải được wedding-data.json, sử dụng dữ liệu mặc định");
    }
  } catch (err) {
    console.error("Lỗi fetch wedding-data.json:", err);
  }
}

function populateForm(data) {
  if (!data) return;

  // Cô dâu & Nhà gái
  setVal("bride-name", data.bride?.name);
  setVal("bride-father", data.bride?.father);
  setVal("bride-mother", data.bride?.mother);
  setImgSrc("preview-bride-img", data.bride?.photo);

  // Chú rể & Nhà trai
  setVal("groom-name", data.groom?.name);
  setVal("groom-father", data.groom?.father);
  setVal("groom-mother", data.groom?.mother);
  setImgSrc("preview-groom-img", data.groom?.photo);

  // Lời tựa
  setVal("quote-text", data.quote?.text);
  setVal("quote-author", data.quote?.author);

  // Thời gian & Sự kiện
  setVal("ceremony-tag", data.ceremony?.tag);
  setVal("ceremony-title", data.ceremony?.title);
  setVal("ceremony-subtitle", data.ceremony?.subtitle);
  setVal("ceremony-datetime", data.ceremony?.datetime?.substring(0, 16));
  setVal("ceremony-lunar", data.ceremony?.lunarDate);
  setVal("venue-name", data.ceremony?.venueName);
  setVal("venue-address", data.ceremony?.venueAddress);
  setVal("venue-map-url", data.ceremony?.mapUrl);

  // Ảnh bìa chính (Hero)
  setImgSrc("preview-hero-img", data.hero?.photo);

  // Nhạc nền
  setVal("music-url", data.music?.url);
  setVal("music-title", data.music?.title);

  // Album ảnh
  renderGalleryManager(data.gallery || []);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.value = val;
}

function setImgSrc(id, src) {
  const el = document.getElementById(id);
  if (el && src) el.src = src;
}

/* ==========================================================================
   4. QUẢN LÝ ALBUM ẢNH
   ========================================================================== */
function renderGalleryManager(gallery) {
  const listEl = document.getElementById("gallery-admin-list");
  if (!listEl) return;

  listEl.innerHTML = gallery.map((item, index) => `
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

/* ==========================================================================
   5. XỬ LÝ SỰ KIỆN TẢI ẢNH & NHẠC TỪ MÁY
   ========================================================================== */
function setupHandlers() {
  // Upload ảnh bìa Hero
  setupSingleImageUpload("hero-photo-input", "preview-hero-img", (dataUrl) => {
    if (!weddingData.hero) weddingData.hero = {};
    weddingData.hero.photo = dataUrl;
  });

  // Upload ảnh chân dung Cô dâu
  setupSingleImageUpload("bride-photo-input", "preview-bride-img", (dataUrl) => {
    if (!weddingData.bride) weddingData.bride = {};
    weddingData.bride.photo = dataUrl;
  });

  // Upload ảnh chân dung Chú rể
  setupSingleImageUpload("groom-photo-input", "preview-groom-img", (dataUrl) => {
    if (!weddingData.groom) weddingData.groom = {};
    weddingData.groom.photo = dataUrl;
  });

  // Thêm ảnh mới vào Album
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
      }
    });
  }

  // Thêm ảnh bằng URL
  const btnAddPhotoUrl = document.getElementById("btn-add-photo-url");
  if (btnAddPhotoUrl) {
    btnAddPhotoUrl.addEventListener("click", () => {
      const url = prompt("Nhập đường dẫn (URL) ảnh của bạn:");
      if (url) {
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

  // Tải file MP3 từ máy tính
  const audioFileInput = document.getElementById("music-file-input");
  if (audioFileInput) {
    audioFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        readFileAsDataUrl(file, (dataUrl) => {
          weddingData.music = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            url: dataUrl
          };
          setVal("music-url", dataUrl);
          setVal("music-title", file.name);
          showToast("Đã tải bài hát từ máy lên!");
        });
      }
    });
  }

  // Nghe thử nhạc
  const btnTestMusic = document.getElementById("btn-test-music");
  const testAudioEl = document.getElementById("admin-test-audio");
  if (btnTestMusic && testAudioEl) {
    let isTesting = false;
    btnTestMusic.addEventListener("click", () => {
      const url = document.getElementById("music-url")?.value;
      if (!url) {
        alert("Vui lòng chọn hoặc tải file nhạc trước!");
        return;
      }
      if (isTesting) {
        testAudioEl.pause();
        btnTestMusic.innerText = "▶ Nghe thử bài hát";
        isTesting = false;
      } else {
        testAudioEl.src = url;
        testAudioEl.play();
        btnTestMusic.innerText = "⏸ Dừng phát nhạc";
        isTesting = true;
      }
    });
  }

  // Chọn nhanh bài hát có sẵn
  const presetMusicBtns = document.querySelectorAll(".btn-preset-music");
  presetMusicBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const title = btn.getAttribute("data-title");
      const url = btn.getAttribute("data-url");
      setVal("music-title", title);
      setVal("music-url", url);
      if (weddingData) {
        weddingData.music = { title, url };
      }
      showToast(`Đã chọn bài: ${title}`);
    });
  });

  // Nút Lưu thay đổi (Local preview)
  const btnSaveLocal = document.getElementById("btn-save-local");
  if (btnSaveLocal) {
    btnSaveLocal.addEventListener("click", () => {
      collectFormData();
      try {
        localStorage.setItem("admin_wedding_data", JSON.stringify(weddingData));
        showToast("Đã lưu dữ liệu vào trình duyệt thành công!");
      } catch (err) {
        console.warn("Lỗi lưu localStorage:", err);
        alert(
          "⚠️ Dữ liệu quá lớn để lưu tạm vào trình duyệt (do dung lượng bài hát MP3 vượt mức 5MB)!\n\n" +
          "💡 Giải pháp: Hãy bấm '🚀 Xuất bản lên GitHub' hoặc chọn bài hát có sẵn/link MP3 trực tuyến."
        );
      }
    });
  }

  // Nút Tải file JSON
  const btnDownloadJson = document.getElementById("btn-download-json");
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener("click", () => {
      collectFormData();
      downloadJsonFile(weddingData, "wedding-data.json");
    });
  }

  // Nút Đồng bộ lên GitHub
  const btnSyncGithub = document.getElementById("btn-sync-github");
  if (btnSyncGithub) {
    btnSyncGithub.addEventListener("click", handleGitHubSync);
  }
}

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
          showToast("Đã cập nhật ảnh!");
        });
      }
    });
  }
}

function readFileAsDataUrl(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsDataURL(file);
}

/* ==========================================================================
   6. THU THẬP DỮ LIỆU TỪ CÁC Ô NHẬP LIỆU
   ========================================================================== */
function collectFormData() {
  if (!weddingData) weddingData = {};

  // Cô dâu
  weddingData.bride = {
    name: getVal("bride-name") || "Kiều Thu Hà",
    role: "Cô Dâu",
    photo: document.getElementById("preview-bride-img")?.src || "img/bride.jpg",
    father: getVal("bride-father") || "Kiều Hưng",
    mother: getVal("bride-mother") || "Triệu Thị Chinh"
  };

  // Chú rể
  weddingData.groom = {
    name: getVal("groom-name") || "Nguyễn Hoàng Thiên Bình",
    role: "Chú Rể",
    photo: document.getElementById("preview-groom-img")?.src || "img/groom.jpg",
    father: getVal("groom-father") || "Nguyễn Duy Hiển",
    mother: getVal("groom-mother") || "Phùng Thiên Hương"
  };

  // Lời tựa
  weddingData.quote = {
    text: getVal("quote-text") || "",
    author: getVal("quote-author") || ""
  };

  // Lễ cưới
  const dtVal = getVal("ceremony-datetime");
  let formattedDt = "2026-11-28T09:00:00+07:00";
  let dateDisp = "Thứ Bảy, 28 Tháng 11 Năm 2026";
  let timeDisp = "09:00 · Thứ Bảy, 28/11/2026";

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
    tag: getVal("ceremony-tag") || "Lễ Vu Quy",
    title: getVal("ceremony-title") || "LỄ VU QUY",
    subtitle: getVal("ceremony-subtitle") || "Tiệc Mừng Tổ Chức Tại Nhà Gái",
    datetime: formattedDt,
    dateDisplay: dateDisp,
    timeDisplay: timeDisp,
    lunarDate: getVal("ceremony-lunar") || "20 tháng 10 năm Bính Ngọ",
    venueName: getVal("venue-name") || "TƯ GIA NHÀ GÁI",
    venueAddress: getVal("venue-address") || "Thôn Trung Hưng, xã Hợp Thịnh, thành phố Bắc Ninh",
    mapUrl: getVal("venue-map-url") || "https://maps.app.goo.gl/4cpB2ekW9P5ouQrS6",
    mapEmbedCoords: "21.3123181,105.9177815"
  };

  // Hero
  weddingData.hero = {
    tag: getVal("ceremony-tag") || "Lễ Vu Quy",
    heading: "Thiệp Mừng Báo Hỷ",
    photo: document.getElementById("preview-hero-img")?.src || "img/hero-banner.jpg"
  };

  // Music
  weddingData.music = {
    title: getVal("music-title") || "Beautiful in White - Shane Filan",
    url: getVal("music-url") || "audio/beautiful-in-white.mp3"
  };
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
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

/* ==========================================================================
   7. ĐỒNG BỘ TRỰC TIẾP LÊN GITHUB VIA GITHUB API
   ========================================================================== */
async function handleGitHubSync() {
  collectFormData();

  // Nhắc nhập token hoặc lấy từ cache
  let token = localStorage.getItem("github_sync_token");
  if (!token) {
    token = prompt(
      "Để xuất bản trực tiếp lên habinh-wedding.github.io cho tất cả khách mời:\n" +
      "Vui lòng dán GitHub Personal Access Token (PAT) có quyền 'repo':\n" +
      "(Token này chỉ lưu trong trình duyệt của bạn)"
    );
    if (!token) return;
    localStorage.setItem("github_sync_token", token.trim());
  }

  showToast("Đang đồng bộ dữ liệu lên GitHub...");

  const repoOwner = "habinh-wedding";
  const repoName = "habinh-wedding.github.io";
  const filePath = "data/wedding-data.json";
  const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

  try {
    // 1. Lấy SHA hiện tại của file trên repo
    let sha = "";
    const getRes = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Mã hóa nội dung sang Base64 Unicode
    const jsonString = JSON.stringify(weddingData, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

    // 3. Gửi request PUT để commit
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Cập nhật thông tin thiệp cưới từ Admin Dashboard",
        content: contentBase64,
        sha: sha || undefined
      })
    });

    if (putRes.ok) {
      showToast("🎉 Đã xuất bản lên GitHub thành công! Web sẽ cập nhật sau 1 phút.");
      alert("Xuất bản thành công! Website habinh-wedding.github.io sẽ tự động hiển thị nội dung mới sau khoảng 1-2 phút.");
    } else {
      const errJson = await putRes.json();
      alert("Lỗi từ GitHub: " + (errJson.message || "Không thể cập nhật"));
      localStorage.removeItem("github_sync_token");
    }
  } catch (err) {
    alert("Không thể kết nối đến GitHub: " + err.message);
  }
}

function showToast(msg) {
  const toast = document.getElementById("admin-toast");
  if (!toast) return;
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}
