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
  }, 500);
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
//showSection('main');

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
