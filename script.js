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
  
    // 클릭 시 고정된 드롭다운도 닫기
    if (fixedDropdown) {
      fixedDropdown.classList.add('hidden');
      fixedDropdown.parentElement.classList.remove('fixed-open');
      fixedDropdown = null;
    }
  
    // 추가: 현재 클릭한 메뉴의 상위 드롭다운도 닫기
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
