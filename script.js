document.addEventListener("DOMContentLoaded", function () {
  const typewriter = document.getElementById("typewriter");
  if (!typewriter) return;
  const words = [
    "Find your perfect background",
    "Discover stunning wallpapers",
    "Refresh your desktop style",
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 80;
  let pauseTime = 1200;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      typewriter.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 400);
      } else {
        setTimeout(type, typingSpeed / 2);
      }
    } else {
      typewriter.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === currentWord.length) {
        isDeleting = true;
        setTimeout(type, pauseTime);
      } else {
        setTimeout(type, typingSpeed);
      }
    }
  }
  type();
});
if (typeof require !== "undefined") {
  const { ipcRenderer } = require("electron");
  document.getElementById("minimize").addEventListener("click", () => {
    ipcRenderer.invoke("window-minimize");
  });
  document.getElementById("maximize").addEventListener("click", () => {
    ipcRenderer.invoke("window-maximize");
  });
  document.getElementById("close").addEventListener("click", () => {
    ipcRenderer.invoke("window-close");
  });
}

const PEXELS_API_KEY =
  "dPPil6pJZEUQRg8Kdj8hot8HcjpMT5qDPE7cKMOl5CkNmt3b78IozZnj";
const IMAGES_PER_PAGE = 40;

let currentPage = 1;
let totalImages = 0;
let isLoading = false;
let hasMoreImages = true;
let currentFilters = {
  category: "",
  orientation: "all",
  size: "all",
  color: "",
};

const backgroundsDiv = document.getElementById("backgrounds");
const loadingIndicator = document.getElementById("loading-indicator");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");

const filterButtons = document.querySelectorAll(".filter-button");
const popups = document.querySelectorAll(".popup");
const closeButtons = document.querySelectorAll(".popup-close");
const filterOptions = document.querySelectorAll(".filter-option");
const colorOptions = document.querySelectorAll(".color-option");

let currentActivePopup = null;

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) {
    currentFilters.category = query;
    resetAndFetch();
  }
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentFilters.category = "";
  resetAndFetch();
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const popup = button.parentElement.querySelector(".popup");

    if (currentActivePopup && currentActivePopup !== popup) {
      closePopup(currentActivePopup);
      filterButtons.forEach((btn) => btn.classList.remove("active"));
    }

    if (popup.classList.contains("show")) {
      closePopup(popup);
      button.classList.remove("active");
    } else {
      openPopup(popup);
      button.classList.add("active");
      currentActivePopup = popup;
    }
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const popup = button.closest(".popup");
    closePopup(popup);
    filterButtons.forEach((btn) => btn.classList.remove("active"));
  });
});

filterOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const siblings = option.parentElement.querySelectorAll(".filter-option");
    siblings.forEach((sibling) => sibling.classList.remove("selected"));

    option.classList.add("selected");

    const popup = option.closest(".popup");
    const filterType = popup.id.replace("Popup", "");
    const button = document.querySelector(`[data-filter="${filterType}"]`);
    const labelSpan = button.querySelector(".filter-label");

    if (
      option.getAttribute("data-value") === "all" ||
      (filterType === "category" && option.textContent.trim() === "Category")
    ) {
      labelSpan.textContent =
        filterType.charAt(0).toUpperCase() + filterType.slice(1);
      currentFilters[filterType] = "";
    } else {
      labelSpan.textContent = option.textContent.trim();
      currentFilters[filterType] = option.getAttribute("data-value");
    }

    setTimeout(() => {
      closePopup(popup);
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      resetAndFetch();
    }, 200);
  });
});

colorOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const siblings = option.parentElement.querySelectorAll(".color-option");
    siblings.forEach((sibling) => sibling.classList.remove("selected"));

    option.classList.add("selected");

    const colorValue = option.getAttribute("data-value");
    const button = document.querySelector(`[data-filter="color"]`);
    const labelSpan = button.querySelector(".filter-label");

    labelSpan.textContent = option.title;
    currentFilters.color = colorValue;

    setTimeout(() => {
      const popup = option.closest(".popup");
      closePopup(popup);
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      resetAndFetch();
    }, 200);
  });
});

function openPopup(popup) {
  popup.classList.add("show");
}

function closePopup(popup) {
  popup.classList.remove("show");
  currentActivePopup = null;
}

document.addEventListener("click", (e) => {
  if (
    currentActivePopup &&
    !currentActivePopup.contains(e.target) &&
    !e.target.closest(".filter-button")
  ) {
    closePopup(currentActivePopup);
    filterButtons.forEach((btn) => btn.classList.remove("active"));
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentActivePopup) {
    closePopup(currentActivePopup);
    filterButtons.forEach((btn) => btn.classList.remove("active"));
  }
});

function buildSearchQuery() {
  let query = currentFilters.category;
  if (!query || query.trim() === "") {
    query = "wallpaper";
  }
  if (currentFilters.color) {
    query += ` ${currentFilters.color}`;
  }
  return query.trim();
}

function buildApiUrl(page = 1) {
  const baseUrl = "https://api.pexels.com/v1/search";
  const params = new URLSearchParams({
    query: buildSearchQuery(),
    per_page: IMAGES_PER_PAGE,
    page: page,
  });

  if (currentFilters.orientation && currentFilters.orientation !== "all") {
    params.append("orientation", currentFilters.orientation);
  }

  if (currentFilters.size && currentFilters.size !== "all") {
    params.append("size", currentFilters.size);
  }

  if (currentFilters.color) {
    params.append("color", currentFilters.color);
  }

  return `${baseUrl}?${params.toString()}`;
}

async function fetchImages(append = false) {
  if (isLoading || !hasMoreImages) return;

  isLoading = true;
  loadingIndicator.style.display = "block";

  if (!append) {
    currentPage = 1;
    hasMoreImages = true;
  }

  try {
    const response = await fetch(buildApiUrl(currentPage), {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      const photos =
        currentPage === 1 && !append ? data.photos.slice(5) : data.photos;
      displayImages(photos, append);
      currentPage++;

      const totalPages = Math.ceil(data.total_results / IMAGES_PER_PAGE);
      hasMoreImages = currentPage <= totalPages && currentPage <= 100;
    } else {
      hasMoreImages = false;
      if (!append && totalImages === 0) {
        showNoResultsMessage();
      }
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    hasMoreImages = false;
    if (!append && totalImages === 0) {
      showErrorMessage(error.message);
    }
  }

  isLoading = false;
  loadingIndicator.style.display = "none";
}

function displayImages(photos, append = false) {
  if (!append) {
    backgroundsDiv.innerHTML = "";
    totalImages = 0;
  }

  photos.forEach((photo) => {
    const imageDiv = document.createElement("div");
    imageDiv.className = "background-item";
    imageDiv.dataset.originalUrl = photo.src.original;

    imageDiv.innerHTML = `
      <img src="${photo.src.medium}" alt="${
      photo.alt || "Wallpaper image"
    }" loading="lazy" decoding="async">
      <div class="download-overlay">
        <div class="overlay-actions">
          <div class="circle-btn download-icon" title="Download image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </div>
          <div class="circle-btn set-wallpaper-icon" title="Set as wallpaper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-6v2h2a1 1 0 010 2H8a1 1 0 010-2h2v-2H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 2v8h14V7H5zm3 6l2-3 2 3h-4z"/>
            </svg>
          </div>
        </div>
      </div>
    `;

    backgroundsDiv.appendChild(imageDiv);
    totalImages++;
  });
}

function createImageElement(photo) {
  const img = document.createElement("img");
  img.alt = photo.alt || "Background Image";
  img.loading = "lazy";

  img.dataset.src = photo.src.medium;
  img.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+";

  imageObserver.observe(img);

  img.onerror = () => {
    img.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2U3NGMzYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==";
  };

  return img;
}

const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        observer.unobserve(img);
      }
    }
  });
});

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download image. Please try again.");
  }
}

function showNoResultsMessage() {
  backgroundsDiv.innerHTML = `
    <div class="error-message">
      <h3>No images found</h3>
      <p>Try adjusting your filters or search for different terms.</p>
      <button class="retry-btn" onclick="resetFilters()">Reset Filters</button>
    </div>
  `;
}

function showErrorMessage(error) {
  backgroundsDiv.innerHTML = `
    <div class="error-message">
      <h3>Error loading images</h3>
      <p>Please check your internet connection and try again.</p>
      <p><small>Error: ${error}</small></p>
      <button class="retry-btn" onclick="fetchImages()">Retry</button>
    </div>
  `;
}

function resetFilters() {
  currentFilters = {
    category: "",
    orientation: "all",
    size: "all",
    color: "",
  };

  filterButtons.forEach((button) => {
    const filterType = button.getAttribute("data-filter");
    const labelSpan = button.querySelector(".filter-label");
    labelSpan.textContent =
      filterType.charAt(0).toUpperCase() + filterType.slice(1);
  });

  document
    .querySelectorAll(".filter-option.selected, .color-option.selected")
    .forEach((option) => {
      option.classList.remove("selected");
    });

  resetAndFetch();
}

function resetAndFetch() {
  totalImages = 0;
  currentPage = 1;
  hasMoreImages = true;
  backgroundsDiv.innerHTML = "";
  fetchImages();
}

const sentinel = document.getElementById("scroll-sentinel");
if (sentinel) {
  const bottomObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoading && hasMoreImages) {
          Promise.resolve().then(() => fetchImages(true));
        }
      });
    },
    { root: null, rootMargin: "1500px 0px 1500px 0px", threshold: 0 }
  );
  bottomObserver.observe(sentinel);
}

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C"))
  ) {
    e.preventDefault();
    return false;
  }
});

function isDark(color) {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

document.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", function () {
    document
      .querySelectorAll(".color-option")
      .forEach((opt) => opt.classList.remove("selected"));
    this.classList.add("selected");
  });
});

document.querySelectorAll(".color-option").forEach((option) => {
  option.addEventListener("click", function () {
    const color = this.dataset.color;
    const colorName = this.dataset.value;
    const filterButton = document.querySelector(
      '.filter-button[data-filter="color"]'
    );

    document
      .querySelectorAll(".color-option")
      .forEach((opt) => opt.classList.remove("selected"));

    this.classList.add("selected");

    filterButton.classList.add("active");
    filterButton.style.setProperty("--selected-color", color);
    filterButton.querySelector(
      ".filter-label"
    ).textContent = `Color: ${colorName}`;
  });
});

function initializeApp() {
  fetchImages();
}

document.addEventListener("DOMContentLoaded", initializeApp);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

document.addEventListener("click", async (e) => {
  const isDownloadClick = e.target.closest(".download-icon");
  const isSetClick = e.target.closest(".set-wallpaper-icon");
  if (!isDownloadClick && !isSetClick) return;
  e.stopPropagation();

  const backgroundItem = e.target.closest(".background-item");
  if (!backgroundItem) return;

  const img = backgroundItem.querySelector("img");
  if (!img) return;

  const { ipcRenderer } = require("electron");

  try {
    backgroundItem.classList.add("downloading");
    const originalUrl = backgroundItem.dataset.originalUrl || img.src;

    if (isDownloadClick) {
      await ipcRenderer.invoke("show-save-dialog", {
        url: originalUrl,
        defaultPath: `wallpaper-${Date.now()}.jpg`,
      });
      showDownloadSuccess();
    } else if (isSetClick) {
      const result = await ipcRenderer.invoke("set-wallpaper", {
        url: originalUrl,
      });
      if (!result || !result.success) {
        throw new Error(result?.error || "Failed to set wallpaper");
      }
      showWallpaperSuccess();
    }
  } catch (error) {
    console.error("Action failed:", error);
    showDownloadError();
    backgroundItem.classList.add("download-error");
    setTimeout(() => {
      backgroundItem.classList.remove("download-error");
    }, 2000);
  } finally {
    backgroundItem.classList.remove("downloading");
  }
});

function showDownloadSuccess() {
  const notification = document.createElement("div");
  notification.className = "download-notification success";
  notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="notification-text">
                <div class="notification-title">Download Complete!</div>
                <div class="notification-subtitle">Image saved successfully</div>
            </div>
        </div>
        <div class="notification-progress"></div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function showWallpaperSuccess() {
  const notification = document.createElement("div");
  notification.className = "download-notification success";
  notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-6v2h2a1 1 0 010 2H8a1 1 0 010-2h2v-2H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 2v8h14V7H5zm3 6l2-3 2 3h-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="notification-text">
                <div class="notification-title">Wallpaper Set!</div>
                <div class="notification-subtitle">Desktop background updated</div>
            </div>
        </div>
        <div class="notification-progress"></div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function showDownloadError() {
  const notification = document.createElement("div");
  notification.className = "download-notification error";
  notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="notification-text">
                <div class="notification-title">Action Failed</div>
                <div class="notification-subtitle">Please try again later</div>
            </div>
        </div>
        <div class="notification-progress error-progress"></div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}
