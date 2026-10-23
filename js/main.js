/**
 * THIỆP CƯỚI ONLINE - GIAO DIỆN VƯỜN HOA (BOTANICAL SAGE GARDEN)
 * Cô dâu: Kiều Thu Hà & Chú rể: Nguyễn Hoàng Thiên Bình
 * Lễ Vu Quy: 09:00 ngày 28/11/2026 (20/10 Âm lịch)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Hiệu ứng hoa rơi (chỉ kích hoạt nếu trang có container #petals-container)
  if (document.getElementById("petals-container")) {
    initFallingPetals();
  }
  initDynamicData();
  initCountdown();
  initAudioPlayer();
  initNavigation();
  initLightbox();
  initRSVP();
  initCalendarButton();
  initGiftCopy();
  initGiftTabs();
  fitHeroNames();
  window.addEventListener("resize", fitHeroNames);
  if (document.fonts) {
    document.fonts.ready.then(fitHeroNames);
  }
});


/* ==========================================================================
   1. HIỆU ỨNG CÁNH HOA & LÁ SAGE BAY LỮNG LỜ
   ========================================================================== */
function initFallingPetals() {
  const container = document.getElementById("petals-container");
  if (!container) return;

  const petalSVGs = [
    // Soft petal
    `<svg width="18" height="24" viewBox="0 0 20 28" fill="#e8c7b8" opacity="0.8"><path d="M10 0 C18 6 20 18 10 28 C0 18 2 6 10 0 Z"/></svg>`,
    // Sage leaf
    `<svg width="16" height="26" viewBox="0 0 16 26" fill="#889c72" opacity="0.75"><path d="M8 0 C15 7 15 19 8 26 C1 19 1 7 8 0 Z"/></svg>`,
    // Blossom petal
    `<svg width="20" height="22" viewBox="0 0 20 20" fill="#f4ded4" opacity="0.85"><circle cx="10" cy="10" r="9"/></svg>`
  ];

  const maxPetals = window.innerWidth < 768 ? 14 : 24;

  for (let i = 0; i < maxPetals; i++) {
    createPetal(container, petalSVGs, true);
  }

  setInterval(() => {
    if (document.querySelectorAll(".petal").length < maxPetals) {
      createPetal(container, petalSVGs, false);
    }
  }, 1800);
}

function createPetal(container, svgs, initial) {
  const el = document.createElement("div");
  el.className = "petal";
  const svgIndex = Math.floor(Math.random() * svgs.length);
  el.innerHTML = svgs[svgIndex];

  const left = Math.random() * 100;
  const duration = 7 + Math.random() * 8; // 7s - 15s
  const delay = initial ? Math.random() * duration : 0;
  const size = 0.6 + Math.random() * 0.7;

  el.style.left = `${left}vw`;
  el.style.animationDuration = `${duration}s`;
  el.style.animationDelay = `-${delay}s`;
  el.style.transform = `scale(${size})`;

  container.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, (duration + delay) * 1000);
}

/* ==========================================================================
   2. ĐỒNG HỒ ĐẾM NGƯỢC (ĐẾN 09:00 NGÀY 28/11/2026)
   ========================================================================== */
function initCountdown() {
  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minutesEl = document.getElementById("cd-minutes");
  const secondsEl = document.getElementById("cd-seconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function update() {
    const targetDate = window.TARGET_WEDDING_DATETIME || new Date("2026-11-27T17:00:00+07:00").getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minutesEl.innerText = "00";
      secondsEl.innerText = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerText = String(days).padStart(2, "0");
    hoursEl.innerText = String(hours).padStart(2, "0");
    minutesEl.innerText = String(minutes).padStart(2, "0");
    secondsEl.innerText = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   3. TRÌNH PHÁT NHẠC NỀN (BEAUTIFUL IN WHITE)
   ========================================================================== */
window.currentMusicTitle = "Mối Duyên Vàng";

function initAudioPlayer() {
  const audio = document.getElementById("bg-music");
  const playBtn = document.getElementById("music-toggle-btn");
  const tooltip = document.getElementById("music-tooltip");

  if (!audio || !playBtn) return;

  let isPlaying = false;
  let hasInteracted = false;

  window.updateMusicDisplay = function() {
    if (!tooltip) return;
    if (isPlaying) {
      tooltip.innerText = `Đang phát: ${window.currentMusicTitle || "Mối Duyên Vàng"} ♫`;
    } else {
      tooltip.innerText = `Chạm để nghe: ${window.currentMusicTitle || "Mối Duyên Vàng"} ♫`;
    }
  };

  function playAudio() {
    audio.play().then(() => {
      isPlaying = true;
      playBtn.classList.add("spinning");
      if (tooltip) tooltip.innerText = `Đang phát: ${window.currentMusicTitle || "Mối Duyên Vàng"} ♫`;
    }).catch(err => {
      console.log("Autoplay waiting for user gesture:", err);
    });
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    playBtn.classList.remove("spinning");
    if (tooltip) tooltip.innerText = "Đã tạm dừng nhạc";
  }

  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  });

  // Tự động phát khi người dùng chạm hoặc cuộn lần đầu
  function firstInteractionTrigger() {
    if (!hasInteracted && !isPlaying) {
      hasInteracted = true;
      playAudio();
    }
  }

  window.addEventListener("click", firstInteractionTrigger, { once: true });
  window.addEventListener("touchstart", firstInteractionTrigger, { once: true });
  window.addEventListener("scroll", firstInteractionTrigger, { once: true });

  // Hiện tooltip 3s rồi ẩn
  setTimeout(() => {
    if (tooltip) tooltip.classList.add("visible");
    setTimeout(() => {
      if (tooltip) tooltip.classList.remove("visible");
    }, 4000);
  }, 1200);
}

/* ==========================================================================
   4. NAVIGATION VÀ MENU MOBILE
   ========================================================================== */
function initNavigation() {
  const menuBtn = document.getElementById("menu-toggle-btn");
  const drawer = document.getElementById("mobile-drawer");
  const links = document.querySelectorAll(".wd-menu-links a, .wd-mobile-links a");

  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => {
      const isOpen = drawer.classList.contains("open");
      if (isOpen) {
        drawer.classList.remove("open");
        menuBtn.classList.remove("open");
      } else {
        drawer.classList.add("open");
        menuBtn.classList.add("open");
      }
    });

    links.forEach(link => {
      link.addEventListener("click", () => {
        drawer.classList.remove("open");
        menuBtn.classList.remove("open");
      });
    });
  }

  // Active section highlight on scroll
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document.querySelectorAll(`.wd-menu-links a[href*=${sectionId}]`).forEach(el => {
          el.classList.add("active");
        });
      } else {
        document.querySelectorAll(`.wd-menu-links a[href*=${sectionId}]`).forEach(el => {
          el.classList.remove("active");
        });
      }
    });
  });
}

/* ==========================================================================
   5. LIGHTBOX XEM ẢNH PHÓNG TO
   ========================================================================== */
function initLightbox() {
  const modal = document.getElementById("lightbox-modal");
  const imgEl = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");
  const items = document.querySelectorAll(".gallery-item img");

  if (!modal || !imgEl) return;

  const images = Array.from(items).map(img => img.src);
  let currentIndex = 0;

  function showImage(index) {
    if (images.length === 0) return;
    currentIndex = (index + images.length) % images.length;
    imgEl.src = images[currentIndex];
    if (prevBtn) prevBtn.style.display = images.length > 1 ? "flex" : "none";
    if (nextBtn) nextBtn.style.display = images.length > 1 ? "flex" : "none";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function showSingleImage(src) {
    imgEl.src = src;
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  items.forEach((item, index) => {
    item.parentElement.addEventListener("click", () => {
      showImage(index);
    });
  });



  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.classList.contains("lightbox-content")) closeModal();
  });

  // Bấm ESC hoặc phím mũi tên
  window.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft" && images.length > 1) showImage(currentIndex - 1);
    if (e.key === "ArrowRight" && images.length > 1) showImage(currentIndex + 1);
  });

  // Hỗ trợ vuốt chạm trên điện thoại (touch swipe)
  let touchStartX = 0;
  let touchEndX = 0;

  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modal.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) {
      showImage(currentIndex + 1); // Vuốt sang trái -> Ảnh tiếp
    }
    if (touchEndX - touchStartX > 50) {
      showImage(currentIndex - 1); // Vuốt sang phải -> Ảnh trước
    }
  }, { passive: true });
}

/* ==========================================================================
   6. RSVP & SỔ LƯU BÚT LỜI CHÚC (LOCALSTORAGE + TÍCH HỢP GOOGLE SHEET)
   ========================================================================== */
function initRSVP() {
  const form = document.getElementById("rsvp-form");
  const alertEl = document.getElementById("rsvp-alert");
  const wishesList = document.getElementById("wishes-list");

  const isGroomPage = document.body && document.body.dataset.page === "groom";
  const storageKey = isGroomPage ? "wedding_wishes_groom_tb" : "wedding_wishes_th_tb";

  // Dữ liệu lời chúc mẫu ban đầu
  const initialWishes = isGroomPage ? [
    {
      name: "Hội Bạn Thân",
      role: "Chiến hữu",
      message: "Chúc mừng người anh em Thiên Bình đã chính thức đón được nàng dâu xinh đẹp Kiều Thu Hà về dinh! Chúc hai vợ chồng trăm năm hạnh phúc, sớm sinh quý tử nhé!",
      time: "Hôm nay"
    },
    {
      name: "Gia đình Bác Hùng",
      role: "Họ hàng nhà trai",
      message: "Chúc mừng hạnh phúc hai cháu! Chúc chú rể luôn là bờ vai vững chãi, hai cháu yêu thương hòa thuận, bách niên giai lão!",
      time: "Hôm qua"
    },
    {
      name: "Team Đồng Nghiệp",
      role: "Đồng nghiệp chú rể",
      message: "Chúc mừng anh Bình rước nàng về dinh thành công rực rỡ! Chúc tổ ấm nhỏ luôn tràn ngập tiếng cười, sự nghiệp ngày càng thăng hoa!",
      time: "2 ngày trước"
    }
  ] : [
    {
      name: "Bạn thân Thu Hà",
      role: "Bạn cô dâu",
      message: "Chúc cô dâu Thu Hà và chú rể Thiên Bình mãi mãi hạnh phúc, bách niên giai lão, cùng nhau đi qua mọi thăng trầm của cuộc sống!",
      time: "Hôm nay"
    },
    {
      name: "Gia đình Bác Hùng",
      role: "Họ hàng",
      message: "Mừng ngày vu quy của cháu Hà. Chúc hai cháu trăm năm tình viên mãn, bạc đầu nghĩa phu thê!",
      time: "Hôm qua"
    },
    {
      name: "Đồng nghiệp",
      role: "Đồng nghiệp",
      message: "Chúc mừng hạnh phúc hai bạn! Chúc một hành trình mới ngập tràn tiếng cười và yêu thương ngọt ngào.",
      time: "2 ngày trước"
    }
  ];

  // Lấy dữ liệu từ localStorage hoặc dùng mẫu
  let savedWishes = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      savedWishes = JSON.parse(raw);
    } else {
      savedWishes = initialWishes;
      localStorage.setItem(storageKey, JSON.stringify(savedWishes));
    }
  } catch (e) {
    savedWishes = initialWishes;
  }

  function renderWishes() {
    if (!wishesList) return;
    wishesList.innerHTML = savedWishes.map(item => `
      <div class="wish-card">
        <div class="wish-author">
          ${escapeHtml(item.name)}
          ${item.role ? `<span class="wish-role-tag">${escapeHtml(item.role)}</span>` : ""}
        </div>
        <p class="wish-message">"${escapeHtml(item.message)}"</p>
        <div class="wish-time">${item.time || "Vừa xong"}</div>
      </div>
    `).join("");
  }

  renderWishes();

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("guest-name");
      const roleInput = document.getElementById("guest-role");
      const attendInput = document.querySelector("input[name='attend']:checked");
      const messageInput = document.getElementById("guest-message");

      const name = nameInput ? nameInput.value.trim() : "";
      const role = roleInput ? roleInput.value : "Khách mời";
      const attend = attendInput ? attendInput.value : "Có";
      const message = messageInput ? messageInput.value.trim() : "";

      if (!name) {
        alert("Vui lòng nhập tên của bạn nhé!");
        return;
      }

      // Thêm vào danh sách lời chúc
      if (message) {
        savedWishes.unshift({
          name: name,
          role: role,
          message: message,
          time: "Vừa xong"
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(savedWishes));
        } catch (err) {}
        renderWishes();
      }

      // Hiển thị thông báo thành công
      if (alertEl) {
        alertEl.style.display = "block";
        const thankText = isGroomPage
          ? `Cảm ơn ${name} đã gửi lời chúc mừng đến chú rể Thiên Bình và gia đình! ❤️`
          : `Cảm ơn ${name} đã gửi lời chúc và xác nhận tham dự cùng gia đình! ❤️`;
        alertEl.innerText = thankText;
        setTimeout(() => {
          alertEl.style.display = "none";
        }, 5000);
      }

      form.reset();
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

/* ==========================================================================
   7. THÊM VÀO LỊCH (GOOGLE CALENDAR & .ICS)
   ========================================================================== */
function initCalendarButton() {
  const btn = document.getElementById("btn-add-calendar");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const title = encodeURIComponent(btn.getAttribute("data-title") || "Tiệc Mừng Nhà Gái: Kiều Thu Hà & Nguyễn Hoàng Thiên Bình");
    const details = encodeURIComponent(btn.getAttribute("data-details") || "Tiệc Mừng được tổ chức tại Nhà Gái. Rất hân hạnh được đón tiếp quý khách!");
    const location = encodeURIComponent(btn.getAttribute("data-location") || "Thôn Trung Hưng, xã Hợp Thịnh, thành phố Bắc Ninh");
    const dates = btn.getAttribute("data-dates") || "20261127T100000Z/20261127T140000Z";

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

    window.open(gcalUrl, "_blank");
  });
}

/* ==========================================================================
   8. TỰ ĐỘNG NẠP DỮ LIỆU ĐỘNG TỪ ADMIN / DATA JSON
   ========================================================================== */
async function initDynamicData() {
  const isBinhHaPage = window.location.pathname.includes("binhha.html") || 
                       window.location.pathname.includes("/binhha/") ||
                       window.location.pathname.endsWith("/binhha");
  const storageKey = isBinhHaPage ? "binhha_admin_binhha_data" : "binhha_admin_main_data";
  const jsonPath = isBinhHaPage ? `data/binhha-data.json?v=${Date.now()}` : `data/main-data.json?v=${Date.now()}`;

  let data = null;
  const localSaved = localStorage.getItem(storageKey);
  if (localSaved) {
    try {
      data = JSON.parse(localSaved);
    } catch (e) {}
  }

  if (!data) {
    try {
      const res = await fetch(jsonPath);
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {}
  }

  if (!data) return;

  // Cập nhật Nghi lễ & Thời gian
  if (data.ceremony) {
    const tagEl = document.querySelector(".hero-ceremony-tag");
    if (tagEl && data.ceremony.tag) {
      tagEl.innerText = data.ceremony.tag;
    }
    const heroDateEl = document.querySelector(".hero-date-badge");
    if (heroDateEl && data.ceremony.dateDisplay) heroDateEl.innerHTML = escapeHtml(data.ceremony.dateDisplay);
    const heroLunarEl = document.querySelector(".hero-lunar-date");
    if (heroLunarEl && data.ceremony.lunarDate) heroLunarEl.innerText = `(${data.ceremony.lunarDate})`;

    const cTimeEl = document.querySelector(".ceremony-time-large");
    if (cTimeEl && data.ceremony.timeDisplay) cTimeEl.innerText = data.ceremony.timeDisplay;
    const cLunarEl = document.querySelector(".ceremony-lunar-highlight");
    if (cLunarEl && data.ceremony.lunarDate) cLunarEl.innerText = `(Tức ngày ${data.ceremony.lunarDate})`;
    const venueNameEl = document.querySelector(".ceremony-venue-name");
    if (venueNameEl && data.ceremony.venueName) venueNameEl.innerText = data.ceremony.venueName;
    const venueAddrEl = document.querySelector(".ceremony-venue-address");
    if (venueAddrEl && data.ceremony.venueAddress) venueAddrEl.innerText = data.ceremony.venueAddress;
    const mapBtn = document.querySelector(".ceremony-actions a.btn-primary");
    if (mapBtn && data.ceremony.mapUrl) mapBtn.href = data.ceremony.mapUrl;
    const mapIframe = document.querySelector(".map-iframe-container iframe");
    if (mapIframe && data.ceremony.mapEmbedCoords) {
      mapIframe.src = `https://maps.google.com/maps?q=${data.ceremony.mapEmbedCoords}&hl=vi&z=16&output=embed`;
    }

    if (data.ceremony.datetime) {
      window.TARGET_WEDDING_DATETIME = new Date(data.ceremony.datetime).getTime();
    }
  }

  // Cập nhật Ảnh Hero nếu admin đổi
  if (data.hero && data.hero.photo) {
    const heroImgEl = document.querySelector("#hero-banner-img");
    if (heroImgEl) heroImgEl.src = data.hero.photo;
    const heroSecEl = document.querySelector(".hero-section");
    if (heroSecEl) {
      heroSecEl.style.backgroundImage = `url('${data.hero.photo}')`;
    }
  }

  // Cập nhật Thông điệp / Lời tựa
  if (data.quote) {
    const qTextEl = document.querySelector(".quote-text");
    if (qTextEl && data.quote.text) qTextEl.innerText = `“${data.quote.text}”`;
    const qAuthEl = document.querySelector(".quote-author");
    if (qAuthEl && data.quote.author) qAuthEl.innerText = data.quote.author;
  }

  // Cập nhật Lời cảm ơn Footer
  if (data.footer && data.footer.thanks) {
    const footerCopy = document.querySelector(".footer-copy");
    if (footerCopy) footerCopy.innerText = data.footer.thanks;
  }

  // Cập nhật STK (cho trang chính)
  if (data.gift && data.gift.enabled !== false) {
    const accNumberEl = document.getElementById("acc-groom-text");
    if (accNumberEl && data.gift.accountNumber) accNumberEl.innerText = data.gift.accountNumber;

    const copyBtn = document.querySelector(".btn-copy-acc");
    if (copyBtn && data.gift.accountNumber) {
      copyBtn.setAttribute("data-acc", data.gift.accountNumber.replace(/\s+/g, ""));
    }

    const qrImgEl = document.querySelector(".gift-qr-img");
    if (qrImgEl && data.gift.qrPhoto) qrImgEl.src = data.gift.qrPhoto;

    const giftMsgEl = document.querySelector(".gift-gratitude");
    if (giftMsgEl && data.gift.message) giftMsgEl.innerText = data.gift.message;
  }

  // Cập nhật Nhạc
  if (data.music) {
    if (data.music.title) {
      window.currentMusicTitle = data.music.title.replace(/\.[^/.]+$/, "");
    }
    if (data.music.url) {
      const audioEl = document.getElementById("bg-music");
      if (audioEl) {
        const currentSrc = audioEl.currentSrc || audioEl.src;
        if (!currentSrc.includes(data.music.url)) {
          const wasPlaying = !audioEl.paused;
          audioEl.src = data.music.url;
          audioEl.load();
          if (wasPlaying) {
            audioEl.play().catch(e => console.log("Play interrupted:", e));
          }
        }
      }
    }
    if (typeof window.updateMusicDisplay === "function") {
      window.updateMusicDisplay();
    }
  }

  // Cập nhật Album
  if (data.gallery && data.gallery.length > 0) {
    const gridEl = document.querySelector(".gallery-grid");
    if (gridEl) {
      gridEl.innerHTML = data.gallery.map(item => `
        <div class="gallery-item">
          <img src="${item.url}" alt="${escapeHtml(item.caption || 'Ảnh cưới')}" loading="lazy">
          <div class="gallery-overlay"><span>${escapeHtml(item.caption || '')}</span></div>
        </div>
      `).join("");
      initLightbox();
    }
  }

  // Tự động căn chỉnh tên chú rể trên một hàng
  setTimeout(fitHeroNames, 100);
}

/* ==========================================================================
   9. TỰ ĐỘNG CĂN CHỈNH TÊN CHÚ RỂ VÀ CÔ DÂU TRÊN 1 HÀNG
   ========================================================================== */
function fitHeroNames() {
  // 1. Hero banner names (Thu Hà nên duyên với Thiên Bình - trên 1 dòng duy nhất)
  const container = document.querySelector(".hero-names");
  if (container) {
    const names = container.querySelectorAll(".name");
    const connector = container.querySelector(".hero-connector");
    if (names.length >= 2) {
      names.forEach(el => {
        el.style.fontSize = "";
        el.style.whiteSpace = "nowrap";
      });
      if (connector) {
        connector.style.fontSize = "";
        connector.style.whiteSpace = "nowrap";
      }

      const availableWidth = Math.min(window.innerWidth - 24, 1050);

      let size = parseFloat(window.getComputedStyle(names[0]).fontSize);
      let iterations = 0;

      // Chỉ thu nhỏ nếu kích thước thực tế của dòng chữ vượt quá chiều rộng màn hình
      while (container.scrollWidth > availableWidth && size > 15 && iterations < 35) {
        size -= 0.5;
        names[0].style.fontSize = size + "px";
        names[1].style.fontSize = size + "px";
        if (connector) {
          connector.style.fontSize = Math.max(13, size * 0.58) + "px";
        }
        iterations++;
      }
    }
  }

  // 2. Couple section card names (Cô Dâu & Chú Rể)
  const personNames = document.querySelectorAll(".person-card .person-name");
  personNames.forEach(el => {
    // Reset font-size inline về rỗng để ăn theo CSS clamp chuẩn trước
    el.style.fontSize = "";
    el.style.whiteSpace = "nowrap";

    const card = el.closest(".person-card");
    if (!card) return;
    const cardStyle = window.getComputedStyle(card);
    const pLeft = parseFloat(cardStyle.paddingLeft) || 14;
    const pRight = parseFloat(cardStyle.paddingRight) || 14;
    const maxAvailableWidth = (card.clientWidth - pLeft - pRight) || (window.innerWidth - 48);

    let size = parseFloat(window.getComputedStyle(el).fontSize);
    let iterations = 0;
    while (el.scrollWidth > maxAvailableWidth && size > 22 && iterations < 20) {
      size -= 0.5;
      el.style.fontSize = size + "px";
      iterations++;
    }
  });
}

/* ==========================================================================
   10. SAO CHÉP SỐ TÀI KHOẢN MỪNG CƯỚI ONLINE
   ========================================================================== */
function initGiftCopy() {
  const copyBtns = document.querySelectorAll(".btn-copy-acc");
  if (!copyBtns.length) return;

  copyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target") || "acc-number-text";
      const targetEl = document.getElementById(targetId);
      const accNumber = targetEl ? targetEl.innerText.trim().replace(/\s+/g, '') : (btn.getAttribute("data-acc") || "109868921952");

      navigator.clipboard.writeText(accNumber).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Đã sao chép số tài khoản!</span>
        `;
        btn.classList.add("copied");

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove("copied");
        }, 3000);
      }).catch(err => {
        const dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.value = accNumber;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);

        btn.classList.add("copied");
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span>Đã sao chép: ${accNumber}</span>`;
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove("copied");
        }, 3000);
      });
    });
  });
}

/* ==========================================================================
   11. CHUYỂN ĐỔI TAB MỪNG CƯỚI (CHÚ RỂ & CÔ DÂU)
   ========================================================================== */
function initGiftTabs() {
  const tabBtns = document.querySelectorAll(".gift-tab-btn");
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetId = btn.getAttribute("data-target");
      document.querySelectorAll(".gift-tab-content").forEach(c => c.classList.remove("active"));
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
    });
  });
}




