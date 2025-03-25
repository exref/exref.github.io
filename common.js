// 공통 컴포넌트 관리 파일
document.addEventListener('DOMContentLoaded', function () {
    initializeUI();
});

function initializeUI() {
    // 현재 페이지 확인
    const currentPath = window.location.pathname;
    const isLottoPage = currentPath.includes('/lotto/');
    const isSmi2srtPage = currentPath.includes('/smi2srt/');

    // 메뉴바 생성 및 삽입
    createMenuBar(isLottoPage ? '로또번호 생성기' : 'SMI &gt; SRT');

    // 슬라이드 메뉴 생성 및 삽입
    createSlideMenu(isLottoPage, isSmi2srtPage);

    // 메뉴 오버레이 생성 및 삽입
    createMenuOverlay();

    // 광고 배너 생성 및 삽입
    createAdBanner();

    // 메뉴 이벤트 설정 (약간의 지연 후 실행)
    setTimeout(setupMenuEvents, 100);
}

// 메뉴바 생성 함수
function createMenuBar(title) {
    const menuBar = document.createElement('header');
    menuBar.className = 'menu-bar';
    menuBar.setAttribute('role', 'banner');
    menuBar.setAttribute('id', 'mainMenuBar');

    menuBar.innerHTML = `
        <div class="menu-container">
            <h1>${title}</h1>
            <button class="menu-button" id="mainMenuButton" aria-label="메뉴 열기"><span class="material-icons">menu</span></button>
        </div>
    `;

    // body의 첫 번째 자식으로 추가
    document.body.insertBefore(menuBar, document.body.firstChild);
}

// 슬라이드 메뉴 생성 함수
function createSlideMenu(isLottoPage, isSmi2srtPage) {
    const slideMenu = document.createElement('aside');
    slideMenu.className = 'slide-menu';
    slideMenu.setAttribute('aria-hidden', 'true');
    slideMenu.setAttribute('id', 'mainSlideMenu');

    slideMenu.innerHTML = `
        <div class="slide-menu-header">
            <button class="close-menu" id="closeMenuButton" aria-label="메뉴 닫기"><span class="material-icons">close</span></button>
        </div>
        <nav class="menu-items" role="navigation" aria-label="메인 메뉴">
            <a href="/lotto/" class="menu-item ${isLottoPage ? 'active' : ''}" ${isLottoPage ? 'aria-current="page"' : ''}>
                <span class="material-icons menu-icon">casino</span>
                <span class="menu-text">로또번호 생성기</span>
            </a>
            <a href="/smi2srt/" class="menu-item ${isSmi2srtPage ? 'active' : ''}" ${isSmi2srtPage ? 'aria-current="page"' : ''}>
                <span class="material-icons menu-icon">change_circle</span>
                <span class="menu-text">SMI to SRT</span>
            </a>
        </nav>
    `;

    // 메뉴바 다음에 추가
    const menuBar = document.querySelector('.menu-bar');
    if (menuBar) {
        document.body.insertBefore(slideMenu, menuBar.nextSibling);
    } else {
        document.body.insertBefore(slideMenu, document.body.firstChild);
    }
}

// 메뉴 오버레이 생성 함수
function createMenuOverlay() {
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    menuOverlay.setAttribute('aria-hidden', 'true');
    menuOverlay.setAttribute('id', 'mainMenuOverlay');

    // body에 직접 추가
    document.body.appendChild(menuOverlay);
}

// 광고 배너 생성 함수
function createAdBanner() {
    const adBanner = document.createElement('div');
    adBanner.className = 'ad-banner';

    adBanner.innerHTML = `
        <div class="ad-container">
            <!-- 광고 배너 공간 -->
        </div>
    `;

    // body에 직접 추가
    document.body.appendChild(adBanner);
}

// 메뉴 이벤트 설정 함수
function setupMenuEvents() {
    console.log('메뉴 이벤트 설정 중...');

    const menuBtn = document.getElementById('mainMenuButton');
    const closeBtn = document.getElementById('closeMenuButton');
    const slideMenu = document.getElementById('mainSlideMenu');
    const overlay = document.getElementById('mainMenuOverlay');

    if (menuBtn && closeBtn && slideMenu && overlay) {
        console.log('메뉴 요소 찾음, 이벤트 연결 중...');

        menuBtn.addEventListener('click', function () {
            console.log('메뉴 버튼 클릭됨');
            slideMenu.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        closeBtn.addEventListener('click', function () {
            console.log('닫기 버튼 클릭됨');
            closeMenu(slideMenu, overlay);
        });

        overlay.addEventListener('click', function () {
            console.log('오버레이 클릭됨');
            closeMenu(slideMenu, overlay);
        });

        console.log('메뉴 이벤트 설정 완료');
    } else {
        console.error('메뉴 요소를 찾을 수 없음:', {
            menuBtn: !!menuBtn,
            closeBtn: !!closeBtn,
            slideMenu: !!slideMenu,
            overlay: !!overlay
        });
    }
}

function closeMenu(slideMenu, overlay) {
    slideMenu.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// 슬라이드 메뉴 관련 기능
document.addEventListener('DOMContentLoaded', function () {
    console.log("메뉴 스크립트 초기화");

    // 메뉴 관련 요소 참조
    const menuButton = document.getElementById('menuButton');
    const slideMenu = document.getElementById('slideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenu = document.getElementById('closeMenu');

    // 요소 존재 확인 
    if (!menuButton) {
        console.error("메뉴 버튼을 찾을 수 없습니다!");
        return;
    }

    if (!slideMenu) {
        console.error("슬라이드 메뉴를 찾을 수 없습니다!");
        return;
    }

    if (!menuOverlay) {
        console.error("메뉴 오버레이를 찾을 수 없습니다!");
        return;
    }

    // 메뉴 버튼 클릭 이벤트
    menuButton.addEventListener('click', function () {
        console.log("메뉴 버튼 클릭");
        slideMenu.classList.add('open');
        menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    });

    // 닫기 버튼 클릭 이벤트
    if (closeMenu) {
        closeMenu.addEventListener('click', function () {
            slideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    }

    // 오버레이 클릭 이벤트 
    menuOverlay.addEventListener('click', function () {
        slideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
}); 