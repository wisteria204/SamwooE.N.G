// 삼우E.N.G 웹사이트 JavaScript

console.log('Script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  console.log('Slides found:', document.querySelectorAll('.slide').length);
  console.log('Gallery images found:', document.querySelectorAll('.gallery-img').length);
});

// 전역 변수
let fixedDropdown = null;
const closeTimers = new WeakMap();
let currentSlide = 0;
let slideInterval;
let currentProductIndex = 0; // 시작은 product01 (인덱스 0)
const totalProducts = 9;
// 공정 슬라이더 관련 변수
let currentProcessIndex = 0;
const totalProcesses = 12;

// Lazy Loading 구현
document.addEventListener('DOMContentLoaded', function() {
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
});

// 모바일 메뉴 관련 함수들
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');
  const menuButton = document.getElementById('mobile-menu-button');
  
  menu.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
  
  // aria-expanded 업데이트
  const isExpanded = !menu.classList.contains('hidden');
  menuButton.setAttribute('aria-expanded', isExpanded);
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');
  const menuButton = document.getElementById('mobile-menu-button');
  
  menu.classList.add('hidden');
  menuIcon.classList.remove('hidden');
  closeIcon.classList.add('hidden');
  menuButton.setAttribute('aria-expanded', 'false');
  
  // 모든 서브메뉴 닫기 및 화살표 초기화
  const submenus = ['company', 'business', 'rnd', 'pr'];
  submenus.forEach(name => {
    const submenu = document.getElementById(name + '-submenu');
    const arrow = document.getElementById(name + '-arrow');
    const button = submenu.previousElementSibling;
    if (submenu && arrow) {
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
  
  // aria-expanded 업데이트
  const isExpanded = !submenu.classList.contains('hidden');
  button.setAttribute('aria-expanded', isExpanded);
}

// 섹션 표시/숨김 기능
function showSection(id) {
  // 모든 섹션 숨기고, 선택한 섹션만 보여줌
  document.querySelectorAll('main > section').forEach(section => {
    section.id === id
      ? section.classList.remove('hidden-section')
      : section.classList.add('hidden-section');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // URL hash가 이미 원하는 id면 변경하지 않음 (불필요한 history 변경 방지)
  if(window.location.hash.substring(1) !== id) {
    if(history.pushState) {
      history.pushState(null, null, '#' + id);
    } else {
      window.location.hash = id;
    }
  }

  // PC 버전: 모든 드롭다운 메뉴 강제로 닫기
  const pcDropdowns = document.querySelectorAll('.group > div.absolute');
  pcDropdowns.forEach(dropdown => {
    dropdown.classList.add('dropdown-hidden');
    // 잠시 후 클래스 제거하여 hover 기능 복원
    setTimeout(() => {
      dropdown.classList.remove('dropdown-hidden');
    }, 500);
  });

  // 드롭다운 닫기 (기존 코드)
  if (fixedDropdown) {
    fixedDropdown.classList.add('hidden');
    fixedDropdown.parentElement.classList.remove('fixed-open');
    fixedDropdown = null;
  }
  const allDropdowns = document.querySelectorAll('.dropdown');
  allDropdowns.forEach(dropdown => {
    dropdown.classList.add('hidden');
    if (dropdown.parentElement.classList.contains('fixed-open')) {
      dropdown.parentElement.classList.remove('fixed-open');
    }
  });
}

function hoverDropdown(el) {
  if (!el.classList.contains('fixed-open')) {
    const dropdown = el.querySelector('.dropdown');
    dropdown.classList.remove('hidden');
  }
  cancelCloseDropdown(el);
}

function scheduleCloseDropdown(el) {
  if (el.classList.contains('fixed-open')) return;
  const dropdown = el.querySelector('.dropdown');
  const timer = setTimeout(() => {
    dropdown.classList.add('hidden');
  }, 800);
  closeTimers.set(el, timer);
}

function cancelCloseDropdown(el) {
  const timer = closeTimers.get(el);
  if (timer) {
    clearTimeout(timer);
    closeTimers.delete(el);
  }
}

function toggleFixedDropdown(button) {
  const parent = button.parentElement;
  const dropdown = parent.querySelector('.dropdown');

  if (parent.classList.contains('fixed-open')) {
    dropdown.classList.add('hidden');
    parent.classList.remove('fixed-open');
    fixedDropdown = null;
  } else {
    if (fixedDropdown) {
      fixedDropdown.classList.add('hidden');
      fixedDropdown.parentElement.classList.remove('fixed-open');
    }
    dropdown.classList.remove('hidden');
    parent.classList.add('fixed-open');
    fixedDropdown = dropdown;
  }
}

// 슬라이더 관련 함수들
function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');
  
  // 인디케이터 클릭 이벤트
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
    });
  });

  // 자동 슬라이드 시작
  startAutoSlide();
}

function goToSlide(slideIndex) {
  const slides = document.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');
  
  // 현재 활성 슬라이드와 인디케이터 비활성화
  slides[currentSlide].classList.remove('active');
  indicators[currentSlide].classList.remove('active');
  indicators[currentSlide].setAttribute('aria-selected', 'false');

  // 새 슬라이드와 인디케이터 활성화
  currentSlide = slideIndex;
  slides[currentSlide].classList.add('active');
  indicators[currentSlide].classList.add('active');
  indicators[currentSlide].setAttribute('aria-selected', 'true');
}

function nextSlide() {
  const slides = document.querySelectorAll('.slide');
  const nextIndex = (currentSlide + 1) % slides.length;
  goToSlide(nextIndex);
}

function startAutoSlide() {
  slideInterval = setInterval(nextSlide, 4000); // 4초마다 자동 전환
}

function stopAutoSlide() {
  clearInterval(slideInterval);
}

// 제품 슬라이더 함수들
function updateProductSlider() {
  const productSlides = document.querySelectorAll('.product-slide');
  const productDescriptions = document.querySelectorAll('.product-desc');
  
  productSlides.forEach((slide, index) => {
    const slideIndex = parseInt(slide.dataset.index);
    
    // 현재 인덱스를 기준으로 상대적 위치 계산
    let relativePosition = slideIndex - currentProductIndex;
    
    // 순환 구조를 위한 위치 조정
    if (relativePosition > totalProducts / 2) {
      relativePosition -= totalProducts;
    } else if (relativePosition < -totalProducts / 2) {
      relativePosition += totalProducts;
    }
    
    // 위치별 스타일 적용
    if (relativePosition === 0) {
      // 중앙 (현재 활성 이미지)
      slide.style.transform = 'translateX(0) scale(1)';
      slide.style.opacity = '1';
      slide.style.zIndex = '10';
      slide.classList.add('active');
    } else if (relativePosition === -1) {
      // 왼쪽 (이전 이미지)
      slide.style.transform = 'translateX(-100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === 1) {
      // 오른쪽 (다음 이미지)
      slide.style.transform = 'translateX(100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === -2) {
      // 왼쪽 두번째
      slide.style.transform = 'translateX(-200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else if (relativePosition === 2) {
      // 오른쪽 두번째
      slide.style.transform = 'translateX(200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else {
      // 보이지 않는 위치
      slide.style.transform = 'translateX(300%) scale(0.7)';
      slide.style.opacity = '0';
      slide.style.zIndex = '0';
      slide.classList.remove('active');
    }
  });
  
  // 설명 텍스트 업데이트
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

// 모바일 메뉴 버튼 이벤트
document.getElementById('mobile-menu-button').addEventListener('click', toggleMobileMenu);

// 모바일 로고 클릭 이벤트
document.getElementById('home-logo-mobile').addEventListener('click', () => {
  showSection('main');
  closeMobileMenu();
});

// 로고 클릭 시 메인 섹션으로 이동 (왼쪽)
document.getElementById('home-logo').addEventListener('click', () => {
  showSection('main');
});

// 로고 클릭 시 메인 섹션으로 이동 (오른쪽)
document.getElementById('home-logo-right').addEventListener('click', () => {
  showSection('main');
});

// 페이지 로드 시 처음 보여줄 섹션
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1);
  if(hash && document.getElementById(hash)) {
    showSection(hash);
  } else {
    showSection('main'); // 기본 메인 화면
  }
  
  // 슬라이더 초기화
  initSlider();
  // 제품 슬라이더 초기화 추가
  updateProductSlider();
  updateProcessSlider();
});

// 드롭다운 외부 클릭 시 닫기
document.addEventListener('click', (e) => {
  const isInside = e.target.closest('li.group');
  if (!isInside && fixedDropdown) {
    fixedDropdown.classList.add('hidden');
    fixedDropdown.parentElement.classList.remove('fixed-open');
    fixedDropdown = null;
  }
});

// 모달 관련 변수
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalCloseBtn = document.getElementById('modal-close');
const galleryImages = document.querySelectorAll('.gallery-img');

// 갤러리 이미지 클릭 시 모달 열기
galleryImages.forEach(img => {
  img.addEventListener('click', () => {
    modalImg.src = img.dataset.full; // data-full 속성에서 큰 이미지 경로 사용
    modalImg.alt = img.alt; // alt 텍스트도 복사
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 막기
    
    // 포커스 트랩 설정
    modalCloseBtn.focus();
  });
});

// X버튼 클릭 시 모달 닫기
modalCloseBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  modalImg.src = ''; // 이미지 src 비우기 (선택)
});

// 모달 배경(빈 공간) 클릭 시 닫기
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    modalImg.src = '';
  }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    modalImg.src = '';
  }
});

// 화면 크기 변경 시 모바일 메뉴 초기화
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    closeMobileMenu();
  }
});

// 키보드 네비게이션 개선
document.addEventListener('keydown', (e) => {
  // Tab 키로 드롭다운 메뉴 네비게이션
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

// 공정 슬라이더 버튼 이벤트
const processNextBtn = document.querySelector('.process-next');
const processPrevBtn = document.querySelector('.process-prev');

if (processNextBtn && processPrevBtn) {
  processNextBtn.addEventListener('click', nextProcess);
  processPrevBtn.addEventListener('click', prevProcess);

  document.addEventListener('keydown', (e) => {
    // 공정 슬라이더 화살표 키 네비게이션
    const processSection = document.getElementById('process');
    if (processSection && !processSection.classList.contains('hidden-section')) {
      if (e.key === 'ArrowRight') {
        nextProcess();
      } else if (e.key === 'ArrowLeft') {
        prevProcess();
      }
    }
  });
}



// 제품 슬라이더 코드
const productNextBtn = document.querySelector('.product-next');
const productPrevBtn = document.querySelector('.product-prev');

if (productNextBtn && productPrevBtn) {
  productNextBtn.addEventListener('click', nextProduct);  // 오른쪽 버튼 → 다음 제품
productPrevBtn.addEventListener('click', prevProduct);  // 왼쪽 버튼 → 이전 제품
  
  // 키보드 네비게이션 (제품 슬라이더가 보일 때)
  document.addEventListener('keydown', (e) => {
    const productsSection = document.getElementById('products');
    if (!productsSection.classList.contains('hidden-section')) {
      if (e.key === 'ArrowRight') {
        nextProduct();
      } else if (e.key === 'ArrowLeft') {
        prevProduct();
      }
    }
  });
}

// 슬라이더에 마우스 호버 시 자동 슬라이드 일시정지
const sliderContainer = document.querySelector('.slide-container');
if (sliderContainer) {
  sliderContainer.addEventListener('mouseenter', stopAutoSlide);
  sliderContainer.addEventListener('mouseleave', startAutoSlide);
}

// 공정 슬라이더 함수들
function updateProcessSlider() {
  const processSlides = document.querySelectorAll('.process-slide');
  const processDescriptions = document.querySelectorAll('.process-desc');
  
  processSlides.forEach((slide, index) => {
    const slideIndex = parseInt(slide.dataset.index);
    
    // 현재 인덱스를 기준으로 상대적 위치 계산
    let relativePosition = slideIndex - currentProcessIndex;
    
    // 순환 구조를 위한 위치 조정
    if (relativePosition > totalProcesses / 2) {
      relativePosition -= totalProcesses;
    } else if (relativePosition < -totalProcesses / 2) {
      relativePosition += totalProcesses;
    }
    
    // 위치별 스타일 적용
    if (relativePosition === 0) {
      // 중앙 (현재 활성 이미지)
      slide.style.transform = 'translateX(0) scale(1)';
      slide.style.opacity = '1';
      slide.style.zIndex = '10';
      slide.classList.add('active');
    } else if (relativePosition === -1) {
      // 왼쪽 (이전 이미지)
      slide.style.transform = 'translateX(-100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === 1) {
      // 오른쪽 (다음 이미지)
      slide.style.transform = 'translateX(100%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '2';
      slide.classList.remove('active');
    } else if (relativePosition === -2) {
      // 왼쪽 두번째
      slide.style.transform = 'translateX(-200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else if (relativePosition === 2) {
      // 오른쪽 두번째
      slide.style.transform = 'translateX(200%) scale(0.7)';
      slide.style.opacity = '0.3';
      slide.style.zIndex = '1';
      slide.classList.remove('active');
    } else {
      // 보이지 않는 위치
      slide.style.transform = 'translateX(300%) scale(0.7)';
      slide.style.opacity = '0';
      slide.style.zIndex = '0';
      slide.classList.remove('active');
    }
  });
  
  // 설명 텍스트 업데이트
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

// 전역 함수로 export (HTML에서 onclick 등으로 사용)
window.showSection = showSection;
window.toggleMobileSubmenu = toggleMobileSubmenu;
window.closeMobileMenu = closeMobileMenu;