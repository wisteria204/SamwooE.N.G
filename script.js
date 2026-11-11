// 삼우E.N.G 웹사이트 JavaScript

// 전역 변수
let fixedDropdown = null;
const closeTimers = new WeakMap();
let currentSlide = 0;
let slideInterval;

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
  // 스타일(Tailwind)이 모두 적용된 뒤 한 번 더 측정해 헤더 높이 오차를 바로잡음
  window.addEventListener('load', updateSliderHeight);

  // ----- 헤더 스크롤 상태 -----
  const siteHeader = document.getElementById('site-header');
  function updateHeaderScrollState() {
    if (!siteHeader) return;
    if (window.scrollY > 8) siteHeader.classList.add('is-scrolled');
    else siteHeader.classList.remove('is-scrolled');
  }
  updateHeaderScrollState();
  window.addEventListener('scroll', updateHeaderScrollState, { passive: true });

  // ----- 스크롤 리빌 (섹션 진입 시 한 번만 표시) -----
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ----- 슬라이더 초기화 -----
  initSlider();

  // ----- 제품/공정 스크롤 리스트 -----
  initScrollLists();
  initRndMotion();

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

  // ----- [Fix #7] 키보드 이벤트 단일 핸들러로 통합 -----
  document.addEventListener('keydown', (e) => {
    // 모달 ESC 닫기
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      modalImg.src = '';
      return;
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
// 제품/공정 세로 스크롤 리스트
// 화면 중앙에 가장 가까운 항목이 '활성' 상태가 되어 선명하게 나타나고,
// 지나간 항목은 살짝 흐려집니다. (모바일 터치 스크롤도 동일하게 동작)
// =====================================================================
function initScrollLists() {
  const lists = document.querySelectorAll('.scroll-list');
  if (!lists.length) return;

  let ticking = false;

  function updateLists() {
    ticking = false;
    const vh = window.innerHeight;
    const center = vh / 2;

    lists.forEach(list => {
      if (list.offsetParent === null) return; // 숨겨진 섹션은 건너뜀
      const items = list.querySelectorAll('.scroll-item');
      const counter = list.querySelector('.scroll-counter-current');
      let best = null;
      let bestDist = Infinity;

      items.forEach(item => {
        const r = item.getBoundingClientRect();
        if (r.top < vh * 0.92) item.classList.add('is-seen');
        if (r.bottom > 0 && r.top < vh) {
          const dist = Math.abs(r.top + r.height / 2 - center);
          if (dist < bestDist) { bestDist = dist; best = item; }
        }
      });

      items.forEach(item => item.classList.toggle('is-active', item === best));
      if (best && counter) counter.textContent = best.dataset.num;
    });
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateLists);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  // 섹션이 표시될 때(클래스 변경) 즉시 갱신
  const mo = new MutationObserver(requestUpdate);
  document.querySelectorAll('main > section').forEach(sec => {
    mo.observe(sec, { attributes: true, attributeFilter: ['class'] });
  });

  requestUpdate();
}

// =====================================================================
// 연구개발: 카운트업 / 스크롤 연동 모션 / 공정 스토리
// =====================================================================
function initRndMotion() {
  const sec = document.getElementById('rnd');
  if (!sec) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopMQ = window.matchMedia('(min-width: 900px)');
  const hero = sec.querySelector('.rnd-hero');
  const bgword = sec.querySelector('.rnd-bgword');
  const heroFig = sec.querySelector('.rnd-hero-fig');
  const story = sec.querySelector('.story');
  const stage = story && story.querySelector('.story-stage');
  const steps = story ? Array.from(story.querySelectorAll('.story-step')) : [];
  const stageImgs = story ? Array.from(story.querySelectorAll('.stage-img')) : [];
  const dots = story ? Array.from(story.querySelectorAll('.stage-dots i')) : [];
  const badge = story && story.querySelector('.stage-badge');
  const badgeEn = story && story.querySelector('.stage-en');
  const badgeKo = story && story.querySelector('.stage-ko');
  const countEl = story && story.querySelector('.stage-count');

  let io = null;
  let armed = false;
  let currentIdx = -1;
  let ticking = false;

  function countUp(el) {
    const to = parseInt(el.dataset.to, 10) || 0;
    if (reduce) { el.textContent = String(to); return; }
    const dur = 1100;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  // 섹션이 보일 때마다 처음부터 다시 재생
  function arm() {
    if (armed) return;
    armed = true;
    sec.querySelectorAll('[data-in]').forEach(el => el.classList.remove('is-in'));
    sec.querySelectorAll('.countup').forEach(el => { el.textContent = '0'; });
    if (!('IntersectionObserver' in window)) {
      sec.querySelectorAll('[data-in]').forEach(el => el.classList.add('is-in'));
      sec.querySelectorAll('.countup').forEach(el => { el.textContent = el.dataset.to; });
      return;
    }
    io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-in');
        el.querySelectorAll('.countup').forEach(countUp);
        io.unobserve(el);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    sec.querySelectorAll('[data-in]').forEach(el => io.observe(el));
  }

  function disarm() {
    if (!armed) return;
    armed = false;
    if (io) { io.disconnect(); io = null; }
  }

  function setActive(i) {
    currentIdx = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    const st = steps[i];
    const stageNo = parseInt(st.dataset.stage, 10);
    stageImgs.forEach(img => img.classList.toggle('is-on', parseInt(img.dataset.stage, 10) === stageNo));
    dots.forEach((d, k) => d.classList.toggle('is-on', k + 1 === stageNo));
    if (badgeEn) badgeEn.textContent = st.dataset.en;
    if (badgeKo) badgeKo.textContent = st.dataset.ko;
    if (countEl) countEl.textContent = String(stageNo).padStart(2, '0') + ' / ' + String(stageImgs.length).padStart(2, '0');
    if (badge) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
  }

  function update() {
    ticking = false;
    if (sec.offsetParent === null) return;
    const vh = window.innerHeight;

    // 히어로 패럴랙스
    if (!reduce && hero) {
      const r = hero.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      if (bgword) bgword.style.transform = 'translate3d(' + ((0.5 - t) * 150).toFixed(1) + 'px,-50%,0)';
      if (heroFig) heroFig.style.setProperty('--fy', ((t - 0.5) * 36).toFixed(1) + 'px');
    }

    // 공정 스토리: 화면 중앙에 가장 가까운 단계를 활성화
    if (story && steps.length && stage) {
      const center = desktopMQ.matches ? vh * 0.5 : (stage.getBoundingClientRect().bottom + vh) / 2;
      let best = 0, bestDist = Infinity;
      steps.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      const f = steps[0].getBoundingClientRect();
      const l = steps[steps.length - 1].getBoundingClientRect();
      const a = f.top + f.height / 2;
      const z = l.top + l.height / 2;
      const p = z === a ? 0 : Math.max(0, Math.min(1, (center - a) / (z - a)));
      story.style.setProperty('--p', p.toFixed(3));
      if (best !== currentIdx) setActive(best);
    }
  }

  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  const mo = new MutationObserver(() => {
    if (sec.classList.contains('hidden-section')) { disarm(); }
    else { arm(); requestUpdate(); }
  });
  mo.observe(sec, { attributes: true, attributeFilter: ['class'] });

  if (!sec.classList.contains('hidden-section')) { arm(); requestUpdate(); }
}

// =====================================================================
// 전역 함수 export (HTML onclick 등에서 사용)
// =====================================================================
window.showSection = showSection;
window.toggleMobileSubmenu = toggleMobileSubmenu;
window.closeMobileMenu = closeMobileMenu;
