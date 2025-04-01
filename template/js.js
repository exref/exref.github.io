/**
 * 템플릿 공통 JavaScript 파일
 * 페이지 로드 시 메뉴와 UI 초기화를 관리합니다.
 */

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function () {
    loadMenu();
    setupMenuEvents();
    setupRippleEffect();
    setupCurrentYear();
});

/**
 * 메뉴 데이터 로드 및 메뉴 항목 생성
 */
async function loadMenu() {
    try {
        // 메뉴 데이터 가져오기
        const response = await fetch('../template/menu.json');
        if (!response.ok) {
            throw new Error('메뉴 데이터를 불러오는데 실패했습니다.');
        }

        const menuData = await response.json();

        // 현재 페이지 ID 확인
        const currentPageId = window.currentPageId || '';

        // 메뉴 항목 생성
        const menuContainer = document.getElementById('dynamicMenuItems');
        if (!menuContainer) return;

        menuContainer.innerHTML = '';

        menuData.menuItems.forEach(item => {
            const isActive = item.id === currentPageId;

            const menuItem = document.createElement('a');
            menuItem.href = item.url;
            menuItem.className = `menu-item${isActive ? ' active' : ''}`;
            if (isActive) {
                menuItem.setAttribute('aria-current', 'page');
            }

            menuItem.innerHTML = `
                <span class="material-icons menu-icon">${item.icon}</span>
                <span class="menu-text">${item.title}</span>
            `;

            menuContainer.appendChild(menuItem);
        });
    } catch (error) {
        console.error('메뉴 로드 오류:', error);
        // 오류 발생 시 기본 메뉴 표시 (선택 사항)
        fallbackMenu();
    }
}

/**
 * 메뉴 로드 실패 시 기본 메뉴 표시
 */
function fallbackMenu() {
    const menuContainer = document.getElementById('dynamicMenuItems');
    if (!menuContainer) return;

    menuContainer.innerHTML = `
        <a href="../lotto" class="menu-item">
            <span class="material-icons menu-icon">casino</span>
            <span class="menu-text">로또번호생성기</span>
        </a>
        <a href="../smi2srt" class="menu-item">
            <span class="material-icons menu-icon">subtitles</span>
            <span class="menu-text">SMI to SRT</span>
        </a>
    `;
}

/**
 * 메뉴 이벤트 설정
 */
function setupMenuEvents() {
    const menuButton = document.getElementById('menuButton');
    const closeMenu = document.getElementById('closeMenu');
    const slideMenu = document.getElementById('slideMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    if (menuButton && closeMenu && slideMenu && menuOverlay) {
        // 메뉴 버튼 클릭 이벤트
        menuButton.addEventListener('click', function () {
            slideMenu.classList.add('open');
            menuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        // 닫기 버튼 클릭 이벤트
        closeMenu.addEventListener('click', function () {
            closeMenuHandler();
        });

        // 오버레이 클릭 이벤트
        menuOverlay.addEventListener('click', function () {
            closeMenuHandler();
        });
    }

    function closeMenuHandler() {
        slideMenu.classList.remove('open');
        menuOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * 리플 효과 설정
 * 버튼에 물결 효과를 적용합니다.
 */
function setupRippleEffect() {
    const buttons = document.querySelectorAll('.generate-button, .reset-button, .menu-button, .close-menu');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * 현재 연도 설정
 * 푸터의 연도를 현재 연도로 업데이트합니다.
 */
function setupCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * 메시지 표시 함수
 * 사용자에게 알림 메시지를 표시합니다.
 * @param {string} message - 표시할 메시지 내용
 * @param {number} [duration=3000] - 메시지 표시 시간(밀리초)
 */
function showMessage(message, duration = 3000) {
    const messageArea = document.getElementById('messageArea');

    if (!messageArea) return;

    // 메인 컨텐츠의 높이를 확인
    const mainContent = document.querySelector('.main-content');
    const mainContentHeight = mainContent ? mainContent.offsetHeight : 0;

    // 메시지 위치 설정
    if (mainContentHeight > 1000) {
        messageArea.style.top = '500px';
        messageArea.style.transform = 'translateX(-50%)';
    } else {
        messageArea.style.top = '50%';
        messageArea.style.transform = 'translate(-50%, -50%)';
    }

    // 메시지 내용 설정 및 표시
    messageArea.textContent = message;
    messageArea.style.opacity = '0';
    messageArea.style.display = 'block';

    // 페이드 인 애니메이션
    setTimeout(() => {
        messageArea.style.opacity = '1';
    }, 10);

    // 지정된 시간 후 메시지 숨기기
    setTimeout(() => {
        // 페이드 아웃 애니메이션
        messageArea.style.opacity = '0';

        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 300);
    }, duration);
} 