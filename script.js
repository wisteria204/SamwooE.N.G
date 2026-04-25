// 삼우E.N.G 웹사이트 JavaScript

// 전역 변수
let fixedDropdown = null;
const closeTimers = new WeakMap();
let currentSlide = 0;
let slideInterval;
let currentProductIndex = 0;
const totalProducts = 9;
let currentProcessIndex = 0;
const totalProcesses = 12;

// =====================================================================
// [Fix #4, #5] DOMContentLoaded 리스너를 단 하나로 통합
//              모든 DOM 참조 코드를 이 안에서 실행
// =====================================================================
document.addEventListener('DOMContentLoaded', function () {

  // ----- [Fix #2] 슬라이더 배경 이미지 Lazy Loading -----
  // 첫 번째 슬라이드(active)는 이미 인라인 스타일로 로드되어 있음
  // 나머지 슬라이드는 data-bg 속성을 이용해 지연 로드
  const lazySlides = document.querySelectorAll('.slide[data-bg]');
  const slideObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const slide = entry.target;
        slide.style.backgroundImage = `url('${slide.dataset.bg}')`;
        slide.removeAttribute('data-bg');
        observer.unobserve(slide);
      }
    });
  }, { rootMargin: '200px' }); // 200px 전에 미리 로드 시작
  lazySlides.forEach(slide => slideObserver.observe(slide));

  // ----- Lazy Loading (img[data-src]) -----
  const lazyImages = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  lazyImages.forEach(img => imageObserver.observe(img));

  // ----- [Fix #11] 슬라이더 높이를 JS로 동적 계산 -----
  function updateSliderHeight() {
    const nav = document.querySelector('header');
    const navHeight = nav ? nav.offsetHeight : 64;
    document.documentElement.style.setProperty('--nav-height', navHeight + 'px');
    const heroEl = document.querySelector('.slider-hero-height');
    if (heroEl) {
      heroEl.style.minHeight = `calc(100vh - ${navHeight}px)`;
    }
  }
  updateSliderHeight();
  window.addEventListener('resize', updateSliderHeight);

  // ----- 슬라이더 초기화 -----
  initSlider();

  // ----- 제품/공정 슬라이더 초기화 -----
  updateProductSlider();
  updateProcessSlider();

  // ----- 모바일 메뉴 버튼 이벤트 -----
  const mobileMenuBtn = document.getElementById('mobile-menu-button');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  }

  // ----- 로고 클릭 이벤트 -----
  const homeLogo = document.getElementById('home-logo');
  if (homeLogo) {
    homeLogo.addEventListener('click', () => showSection('main'));
  }

  const homeLogoRight = document.getElementById('home-logo-right');
  if (homeLogoRight) {
    homeLogoRight.addEventListener('click', () => showSection('main'));
  }

  const homeLogoMobile = document.getElementById('home-logo-mobile');
  if (homeLogoMobile) {
    homeLogoMobile.addEventListener('click', () => {
      showSection('main');
      closeMobileMenu();
    });
  }

  // ----- [Fix #14] 데스크톱 드롭다운 aria-expanded 동기화 -----
  const desktopDropdownBtns = document.querySelectorAll('[data-dropdown]');
  desktopDropdownBtns.forEach(btn => {
    const dropdownId = btn.getAttribute('data-dropdown');
    const dropdownEl = document.getElementById(dropdownId);
    if (!dropdownEl) return;

    const parent = btn.closest('.group');

    // hover로 열릴 때
    parent.addEventListener('mouseenter', () => {
      btn.setAttribute('aria-expanded', 'true');
    });
    parent.addEventListener('mouseleave', () => {
      btn.setAttribute('aria-expanded', 'false');
    });
    // 포커스로 열릴 때
    btn.addEventListener('focus', () => {
      btn.setAttribute('aria-expanded', 'true');
    });
    btn.addEventListener('blur', () => {
      // 드롭다운 내부로 포커스 이동 시 닫히지 않도록 약간 딜레이
      setTimeout(() => {
        if (!dropdownEl.contains(document.activeElement)) {
          btn.setAttribute('aria-expanded', 'false');
        }
      }, 150);
    });
    // 드롭다운 내부 링크 클릭 후 닫힘
    dropdownEl.querySelectorAll('[role="menuitem"]').forEach(item => {
      item.addEventListener('click', () => {
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  });

  // ----- 제품 슬라이더 버튼 -----
  const productNextBtn = document.querySelector('.product-next');
  const productPrevBtn = document.querySelector('.product-prev');
  if (productNextBtn && productPrevBtn) {
    productNextBtn.addEventListener('click', nextProduct);
    productPrevBtn.addEventListener('click', prevProduct);
  }

  // ----- 공정 슬라이더 버튼 -----
  const processNextBtn = document.querySelector('.process-next');
  const processPrevBtn = document.querySelector('.process-prev');
  if (processNextBtn && processPrevBtn) {
    processNextBtn.addEventListener('click', nextProcess);
    processPrevBtn.addEventListener('click', prevProcess);
  }

  // ----- [Fix #7] 키보드 이벤트 단일 핸들러로 통합 -----
  document.addEventListener('keydown', (e) => {
    const productsSection = document.getElementById('products');
    const processSection = document.getElementById('process');

    // 모달 ESC 닫기
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      modalImg.src = '';
      return;
    }

    // 제품 슬라이더 화살표 키
    if (productsSection && !productsSection.classList.contains('hidden-section')) {
      if (e.key === 'ArrowRight') nextProduct();
      else if (e.key === 'ArrowLeft') prevProduct();
    }

    // 공정 슬라이더 화살표 키
    if (processSection && !processSection.classList.contains('hidden-section')) {
      if (e.key === 'ArrowRight') nextProcess();
      else if (e.key === 'ArrowLeft') prevProcess();
    }

    // Tab 키 드롭다운 표시
    if (e.key === 'Tab') {
      const activeElement = document.activeElement;
      const dropdownParent = activeElement.closest('.group');
      if (dropdownParent) {
        const dropdown = dropdownParent.querySelector('.absolute');
        if (dropdown && dropdown.classList.contains('opacity-0')) {
          dropdown.classList.remove('opacity-0', 'invisible');
          dropdown.classList.add('opacity-100', 'visible');
        }
      }
    }
  });

  // ----- 슬라이더 마우스 호버 일시정지 -----
  const sliderContainer = document.querySelector('.slide-container');
  if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', stopAutoSlide);
    sliderContainer.addEventListener('mouseleave', startAutoSlide);
  }

  // ----- 드롭다운 외부 클릭 닫기 -----
  document.addEventListener('click', (e) => {
    const isInside = e.target.closest('li.group');
    if (!isInside && fixedDropdown) {
      fixedDropdown.classList.add('hidden');
      fixedDropdown.parentElement.classList.remove('fixed-open');
      fixedDropdown = null;
    }
  });

  // ----- 모달 이벤트 -----
  const galleryImages = document.querySelectorAll('.gallery-img');
  galleryImages.forEach(img => {
    img.addEventListener('click', () => {
      modalImg.src = img.dataset.full;
      modalImg.alt = img.alt;
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      modalCloseBtn.focus();
    });
  });

  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ----- 화면 크기 변경 시 모바일 메뉴 초기화 -----
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMobileMenu();
  });

  // ----- [Fix #15] popstate 이벤트 처리 (뒤로가기 지원) -----
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
      showSectionInternal(hash);
    } else {
      showSectionInternal('main');
    }
  });

  // ----- 페이지 최초 로드 시 hash 처리 -----
  const initialHash = window.location.hash.substring(1);
  if (initialHash && document.getElementById(initialHash)) {
    showSectionInternal(initialHash);
  } else {
    showSectionInternal('main');
  }

});

// =====================================================================
// 모바일 메뉴 함수
// =====================================================================
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');
  const menuButton = document.getElementById('mobile-menu-button');
  
  menu.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
  
  const isExpanded = !menu.classList.contains('hidden');
  menuButton.setAttribute('aria-expanded', isExpanded);
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');
  const menuButton = document.getElementById('mobile-menu-button');
  
  if (!menu) return;
  menu.classList.add('hidden');
  menuIcon.classList.remove('hidden');
  closeIcon.classList.add('hidden');
  menuButton.setAttribute('aria-expanded', 'false');
  
  const submenus = ['company', 'business', 'rnd', 'pr'];
  submenus.forEach(name => {
    const submenu = document.getElementById(name + '-submenu');
    const arrow = document.getElementById(name + '-arrow');
    if (submenu && arrow) {
      const button = submenu.previousElementSibling;
      submenu.classList.add('hidden');
      arrow.classList.remove('rotate-180');
      button.setAttribute('aria-expanded', 'false');
    }
  });
}

function toggleMobileSubmenu(name) {
  const submenu = document.getElementById(name + '-submenu');
  const arrow = document.getElementById(name + '-arrow');
  const button = submenu.previousElementSibling;
  
  submenu.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
  
  const isExpanded = !submenu.classList.contains('hidden');
  button.setAttribute('aria-expanded', isExpanded);
}

// =====================================================================
// 섹션 표시/숨김
// [Fix #15] showSection은 history.pushState 포함 (URL 변경)
//           showSectionInternal은 순수 표시만 (popstate 시 사용)
// =====================================================================
function showSectionInternal(id) {
  document.querySelectorAll('main > section').forEach(section => {
    if (section.id === 'main') {
      id === 'main'
        ? section.classList.remove('hidden-section')
        : section.classList.add('hidden-section');
    } else {
      section.id === id
        ? section.classList.remove('hidden-section')
        : section.classList.add('hidden-section');
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // PC 드롭다운 강제 닫기
  const pcDropdowns = document.querySelectorAll('.group > div.absolute');
  pcDropdowns.forEach(dropdown => {
    dropdown.classList.add('dropdown-hidden');
    setTimeout(() => dropdown.classList.remove('dropdown-hidden'), 500);
  });

  if (fixedDropdown) {
    fixedDropdown.classList.add('hidden');
    fixedDropdown.parentElement.classList.remove('fixed-open');
    fixedDropdown = null;
  }
}

function showSection(id) {
  showSectionInternal(id);

  // [Fix #15] history 관리
  if (window.location.hash.substring(1) !== id) {
    if (history.pushState) {
      history.pushState({ section: id }, '', '#' + id);
    } else {
      window.location.hash = id;
    }
  }
}

// =====================================================================
// 모달
// =====================================================================
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalCloseBtn = document.getElementById('modal-close');

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  modalImg.src = '';
}

// =====================================================================
// 히어로 슬라이더
// =====================================================================
function initSlider() {
  const indicators = document.querySelectorAll('.indicator');
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => goToSlide(index));
  });
  startAutoSlide();
}

function goToSlide(slideIndex) {
  const slides = document.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');
  
  slides[currentSlide].classList.remove('active');
  indicators[currentSlide].classList.remove('active');
  indicators[currentSlide].setAttribute('aria-selected', 'false');

  currentSlide = slideIndex;
  slides[currentSlide].classList.add('active');
  indicators[currentSlide].classList.add('active');
  indicators[currentSlide].setAttribute('aria-selected', 'true');
}

function nextSlide() {
  const slides = document.querySelectorAll('.slide');
  goToSlide((currentSlide + 1) % slides.length);
}

function startAutoSlide() {
  slideInterval = setInterval(nextSlide, 4000);
}

function stopAutoSlide() {
  clearInterval(slideInterval);
}

// =====================================================================
// 제품 슬라이더
// =====================================================================
function updateProductSlider() {
  const productSlides = document.querySelectorAll('.product-slide');
  const productDescriptions = document.querySelectorAll('.product-desc');
  
  productSlides.forEach((slide) => {
    const slideIndex = parseInt(slide.dataset.index);
    let relativePosition = slideIndex - currentProductIndex;
    
    if (relativePosition > totalProducts / 2) relativePosition -= totalProducts;
    else if (relativePosition < -totalProducts / 2) relativePosition += totalProducts;
    
    if (relativePosition === 0) {
      slide.style.transform = 'translateX(0) scale(1)';
      slide.style.opacity = '1';
      slide.style.zIndex = '10';
      slide.classList.add('active');
    } else if (relativePosition === -1) {
      slide.style.transform = 'translateX(-100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === 1) {
      slide.style.transform = 'translateX(100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === -2) {
      slide.style.transform = 'translateX(-200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else if (relativePosition === 2) {
      slide.style.transform = 'translateX(200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else {
      slide.style.transform = 'translateX(300%) scale(0.7)';
      slide.style.opacity = '0';
      slide.style.zIndex = '0';
      slide.classList.remove('active');
    }
  });

  productDescriptions.forEach((desc, index) => {
    if (index === currentProductIndex) {
      desc.classList.remove('hidden');
      desc.classList.add('block');
    } else {
      desc.classList.add('hidden');
      desc.classList.remove('block');
    }
  });
}

function nextProduct() {
  currentProductIndex = (currentProductIndex + 1) % totalProducts;
  updateProductSlider();
}

function prevProduct() {
  currentProductIndex = (currentProductIndex - 1 + totalProducts) % totalProducts;
  updateProductSlider();
}

// =====================================================================
// 공정 슬라이더
// =====================================================================
function updateProcessSlider() {
  const processSlides = document.querySelectorAll('.process-slide');
  const processDescriptions = document.querySelectorAll('.process-desc');
  
  processSlides.forEach((slide) => {
    const slideIndex = parseInt(slide.dataset.index);
    let relativePosition = slideIndex - currentProcessIndex;
    
    if (relativePosition > totalProcesses / 2) relativePosition -= totalProcesses;
    else if (relativePosition < -totalProcesses / 2) relativePosition += totalProcesses;
    
    if (relativePosition === 0) {
      slide.style.transform = 'translateX(0) scale(1)';
      slide.style.opacity = '1';
      slide.style.zIndex = '10';
      slide.classList.add('active');
    } else if (relativePosition === -1) {
      slide.style.transform = 'translateX(-100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === 1) {
      slide.style.transform = 'translateX(100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === -2) {
      slide.style.transform = 'translateX(-200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else if (relativePosition === 2) {
      slide.style.transform = 'translateX(200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else {
      slide.style.transform = 'translateX(300%) scale(0.7)';
      slide.style.opacity = '0';
      slide.style.zIndex = '0';
      slide.classList.remove('active');
    }
  });

  processDescriptions.forEach((desc, index) => {
    if (index === currentProcessIndex) {
      desc.classList.remove('hidden');
      desc.classList.add('block');
    } else {
      desc.classList.add('hidden');
      desc.classList.remove('block');
    }
  });
}

function nextProcess() {
  currentProcessIndex = (currentProcessIndex + 1) % totalProcesses;
  updateProcessSlider();
}

function prevProcess() {
  currentProcessIndex = (currentProcessIndex - 1 + totalProcesses) % totalProcesses;
  updateProcessSlider();
}

// =====================================================================
// 전역 함수 export (HTML onclick 등에서 사용)
// =====================================================================
window.showSection = showSection;
window.toggleMobileSubmenu = toggleMobileSubmenu;
window.closeMobileMenu = closeMobileMenu;
