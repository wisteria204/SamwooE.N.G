// 모바일 메뉴 관련 함수들
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');
  
  menu.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');
  
  menu.classList.add('hidden');
  menuIcon.classList.remove('hidden');
  closeIcon.classList.add('hidden');
  
  // 모든 서브메뉴 닫기 및 화살표 초기화
  const submenus = ['company', 'business', 'rnd', 'pr'];
  submenus.forEach(name => {
    const submenu = document.getElementById(name + '-submenu');
    const arrow = document.getElementById(name + '-arrow');
    if (submenu && arrow) {
      submenu.classList.add('hidden');
      arrow.classList.remove('rotate-180');
    }
  });
}

function toggleMobileSubmenu(name) {
  const submenu = document.getElementById(name + '-submenu');
  const arrow = document.getElementById(name + '-arrow');
  
  submenu.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
}

// 모바일 메뉴 버튼 이벤트
document.getElementById('mobile-menu-button').addEventListener('click', toggleMobileMenu);

// 모바일 로고 클릭 이벤트
document.getElementById('home-logo-mobile').addEventListener('click', () => {
  showSection('main');
  closeMobileMenu();
});

// 기존 코드
let fixedDropdown = null;
const closeTimers = new WeakMap();

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

  // PC 버전: 모든 드롭다운 메뉴 닫기
  const pcDropdowns = document.querySelectorAll('.group > div');
  pcDropdowns.forEach(dropdown => {
    if (dropdown.classList.contains('absolute')) {
      dropdown.classList.remove('opacity-100', 'visible');
      dropdown.classList.add('opacity-0', 'invisible');
    }
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

document.addEventListener('click', (e) => {
  const isInside = e.target.closest('li.group');
  if (!isInside && fixedDropdown) {
    fixedDropdown.classList.add('hidden');
    fixedDropdown.parentElement.classList.remove('fixed-open');
    fixedDropdown = null;
  }
});

// 로고 클릭 시 메인 섹션으로 이동
document.getElementById('home-logo').addEventListener('click', () => {
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
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 막기
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

// 화면 크기 변경 시 모바일 메뉴 초기화
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    closeMobileMenu();
  }
});