class LottoGame {
    constructor() {
        this.selectedNumbers = new Set();
        this.userSelectedNumbers = new Set();
        this.isGenerating = false;
        this.isNumbersFinalized = false;
        this.autoSelectedNumbers = new Set(); // 자동 선택된 번호 추적
        this.isAnimating = false; // 애니메이션 진행 중 상태 추적
        this.animationTimeouts = []; // 애니메이션 타임아웃 ID 저장 배열
        this.messageTimeouts = []; // 메시지 타임아웃 ID 저장 배열
        this.initializeGrid();
        this.setupEventListeners();
        this.initializeMessageArea();
        this.setupRippleEffect();
        this.initializeEmptyCircles();
        this.clearMatchResult(); // 일치 결과 초기화
        this.updatePageTitle(); // SEO를 위한 페이지 타이틀 업데이트
        this.setupStructuredData(); // 구조화된 데이터 설정
    }

    // SEO 관련 메서드
    updatePageTitle() {
        // 동적으로 페이지 타이틀 업데이트
        document.title = `로또 번호 자동 선택기 - 무료 로또번호 생성 서비스 | ${new Date().toLocaleDateString('ko-KR')}`;
    }

    setupStructuredData() {
        // 구조화된 데이터 동적 업데이트 (필요시)
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            const data = JSON.parse(jsonLd.textContent);
            data.dateModified = new Date().toISOString();
            jsonLd.textContent = JSON.stringify(data, null, 2);
        }
    }

    initializeGrid() {
        const grid = document.querySelector('.numbers-grid');
        for (let i = 1; i <= 45; i++) {
            const cell = document.createElement('div');
            cell.className = 'number-cell';
            cell.textContent = i;
            cell.setAttribute('data-number', i.toString().padStart(2, '0'));
            grid.appendChild(cell);
        }

        // 수평 구분선 추가
        this.addNumbersDivider();
    }

    addNumbersDivider() {
        const lottoPaper = document.querySelector('.lotto-paper');
        const numbersGrid = document.querySelector('.numbers-grid');
        const selectedNumbers = document.querySelector('.selected-numbers');

        // 기존 구분선이 있으면 제거
        const existingDivider = document.querySelector('.numbers-divider');
        if (existingDivider) {
            existingDivider.remove();
        }

        // 새 구분선 생성
        const divider = document.createElement('div');
        divider.className = 'numbers-divider';

        // 구분선 삽입
        lottoPaper.insertBefore(divider, selectedNumbers);
    }

    setupEventListeners() {
        // 번호 셀 클릭 이벤트
        document.querySelectorAll('.number-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                this.handleCellClick(cell);
            });
        });

        // 번호생성 버튼 클릭 이벤트
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.handleGenerate();
        });

        // 초기화 버튼 클릭 이벤트 - 리플 효과 없이 처리
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => {
            this.handleReset();
        });
    }

    handleGenerate() {
        // 애니메이션 진행 중이면 이전 애니메이션 중단
        if (this.isAnimating) {
            this.clearAnimations();
        }

        // 초기화 버튼이 비활성화 상태인지 확인하고 필요한 경우 활성화
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn.disabled && !this.isAnimating) {
            this.enableResetButton();
        }

        // 번호가 이미 확정된 상태에서 다시 번호생성을 누른 경우
        if (this.isNumbersFinalized) {
            // 자동으로 초기화 후 번호생성 진행
            this.resetAndGenerate();
            return;
        }

        if (this.isGenerating) {
            // 번호결정 버튼을 누른 경우
            if (this.userSelectedNumbers.size + this.autoSelectedNumbers.size === 6) {
                this.finalizeNumbers();
            } else {
                // 취소된 자동 선택 번호가 있는 경우 다시 자동 선택
                this.regenerateRemainingNumbers();
            }
        } else {
            // 번호생성 버튼을 누른 경우
            if (this.userSelectedNumbers.size === 6) {
                // 사용자가 이미 6개 번호를 선택한 경우 바로 확정
                this.finalizeNumbers();
            } else {
                // 일치 결과 초기화
                this.clearMatchResult();
                this.generateNumbers();
            }
        }
    }

    // 초기화 후 번호생성을 진행하는 함수
    resetAndGenerate() {
        // 애니메이션 중단
        this.clearAnimations();

        // 초기화 로직
        this.selectedNumbers = new Set();
        this.userSelectedNumbers = new Set();
        this.autoSelectedNumbers = new Set();
        this.isGenerating = false;
        this.isNumbersFinalized = false;
        this.isAnimating = false;

        // 모든 셀 선택 해제
        document.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.remove('auto-selected');
        });

        // 빈 동그라미 6개로 초기화
        this.initializeEmptyCircles();

        // 버튼 상태 초기화
        document.getElementById('generateBtn').textContent = '번호생성';
        document.getElementById('generateBtn').classList.remove('active');
        document.getElementById('generateBtn').classList.remove('disabled');

        // 초기화 버튼 활성화
        this.enableResetButton();

        // 일치 결과 초기화
        this.clearMatchResult();

        // 번호 자동생성 진행
        this.generateNumbers();
    }

    // 모든 애니메이션 타임아웃 제거 함수
    clearAnimations() {
        // 저장된 모든 타임아웃 ID 제거
        this.animationTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.animationTimeouts = []; // 배열 초기화
        this.isAnimating = false; // 애니메이션 상태 초기화

        // 초기화 버튼 활성화 - 애니메이션 중단 시에도 버튼이 활성화되도록 함
        this.enableResetButton();
    }

    generateNumbers() {
        // 사용자가 선택한 번호 유지
        const userSelectedNumbers = Array.from(this.userSelectedNumbers);
        this.autoSelectedNumbers = new Set(); // 자동 선택 번호 초기화

        // 사용자 선택 번호를 제외한 나머지 번호 자동 생성
        const remainingCount = 6 - this.userSelectedNumbers.size;
        const allNumbers = new Set(userSelectedNumbers);

        // 중복되지 않는 번호 생성
        while (allNumbers.size < 6) {
            const randomNum = Math.floor(Math.random() * 45) + 1;
            if (!allNumbers.has(randomNum)) {
                allNumbers.add(randomNum);
            }
        }

        this.animateNumberSelection(Array.from(allNumbers));
        this.isGenerating = true;
        document.getElementById('generateBtn').textContent = '번호결정';
        document.getElementById('generateBtn').classList.add('active');

        // 애니메이션 진행 중에는 초기화 버튼 비활성화
        this.disableResetButton();
    }

    // 초기화 버튼 비활성화 함수
    disableResetButton() {
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.classList.add('disabled');
        resetBtn.disabled = true;
    }

    // 초기화 버튼 활성화 함수
    enableResetButton() {
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.classList.remove('disabled');
        resetBtn.disabled = false;
    }

    updateGenerateButtonState() {
        const generateBtn = document.getElementById('generateBtn');
        const totalSelected = this.userSelectedNumbers.size + this.autoSelectedNumbers.size;

        if (this.isGenerating) {
            // 번호생성 후 상태
            if (totalSelected === 6) {
                // 6개 모두 선택된 경우 - 번호결정 버튼 활성화
                generateBtn.classList.remove('disabled');
                generateBtn.textContent = '번호결정';
            } else if (totalSelected < 6) {
                // 6개 미만 선택된 경우 - 번호생성 버튼 활성화
                generateBtn.classList.remove('disabled');
                generateBtn.textContent = '번호생성';
            }
        } else {
            // 초기 상태 또는 사용자가 직접 6개 선택한 경우
            generateBtn.classList.remove('disabled');

            // 사용자가 직접 6개 선택한 경우에도 "번호생성"으로 표시
            generateBtn.textContent = '번호생성';
        }
    }

    animateNumberSelection(numbers) {
        // 애니메이션 상태 설정
        this.isAnimating = true;

        // 애니메이션 효과 구현
        const cells = document.querySelectorAll('.number-cell');

        // 사용자가 선택한 번호는 제외하고 애니메이션 적용
        const userSelectedNumbers = Array.from(this.userSelectedNumbers);
        const numbersToAnimate = numbers.filter(num => !userSelectedNumbers.includes(num));

        // 모든 셀 초기화 (사용자 선택 번호 제외)
        cells.forEach(cell => {
            const num = parseInt(cell.textContent);
            if (!userSelectedNumbers.includes(num)) {
                cell.classList.remove('selected');
                cell.classList.remove('auto-selected');
            }
        });

        // 사용자 선택 번호 표시
        userSelectedNumbers.forEach(num => {
            const cell = document.querySelector(`.number-cell[data-number="${num.toString().padStart(2, '0')}"]`);
            if (cell) {
                cell.classList.add('selected');
                cell.classList.remove('auto-selected');
            }
        });

        // 랜덤 선택 애니메이션 (더 화려하고 속도감 있게)
        let animationSpeed = 50; // 초기 속도 (밀리초) - 값을 높이면 애니메이션이 느려짐
        let flashCount = 0;
        const maxFlashes = 10; // 깜빡임 횟수 - 값을 줄이면 전체 애니메이션 시간이 줄어듦

        // 랜덤 깜빡임 효과
        const flashRandomNumbers = () => {
            // 이전에 깜빡인 번호 초기화
            cells.forEach(cell => {
                const num = parseInt(cell.textContent);
                if (!userSelectedNumbers.includes(num) && !numbersToAnimate.includes(num)) {
                    cell.classList.remove('auto-selected');
                }
            });

            // 랜덤 번호 선택하여 깜빡임
            if (flashCount < maxFlashes) {
                const availableNumbers = [];
                for (let i = 1; i <= 45; i++) {
                    if (!userSelectedNumbers.includes(i) && !numbersToAnimate.includes(i)) {
                        availableNumbers.push(i);
                    }
                }

                // 랜덤하게 1~5개 번호 선택
                const flashCountThisRound = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < flashCountThisRound && availableNumbers.length > 0; i++) {
                    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
                    const randomNum = availableNumbers[randomIndex];
                    availableNumbers.splice(randomIndex, 1);

                    const cell = document.querySelector(`.number-cell[data-number="${randomNum.toString().padStart(2, '0')}"]`);
                    if (cell) {
                        cell.classList.add('auto-selected');
                    }
                }

                flashCount++;
                animationSpeed = Math.max(30, animationSpeed - 2); // 점점 더 빨라짐 (최소 30ms까지)
                const timeoutId = setTimeout(flashRandomNumbers, animationSpeed);
                this.animationTimeouts.push(timeoutId); // 타임아웃 ID 저장
            } else {
                // 깜빡임 효과 후 최종 선택
                finalizeAutoSelection();
            }
        };

        // 최종 자동 선택 번호 표시
        const finalizeAutoSelection = () => {
            // 자동 선택 번호 표시
            let delay = 0;
            numbersToAnimate.forEach(num => {
                const timeoutId = setTimeout(() => {
                    const cell = document.querySelector(`.number-cell[data-number="${num.toString().padStart(2, '0')}"]`);
                    if (cell) {
                        cell.classList.add('auto-selected');
                        // 리플 효과 추가
                        this.addRippleEffect(cell);

                        // 자동 선택 번호 추적에 추가
                        this.autoSelectedNumbers.add(num);
                    }
                }, delay);
                this.animationTimeouts.push(timeoutId); // 타임아웃 ID 저장
                delay += 100; // 각 번호마다 100ms 간격으로 표시 (값을 높이면 번호가 더 천천히 표시됨)
            });

            // 애니메이션 완료 후 버튼 상태 업데이트
            const timeoutId = setTimeout(() => {
                this.updateGenerateButtonState();
                this.isAnimating = false; // 애니메이션 완료
                this.enableResetButton(); // 초기화 버튼 활성화
            }, delay);
            this.animationTimeouts.push(timeoutId); // 타임아웃 ID 저장
        };

        // 애니메이션 시작
        flashRandomNumbers();
    }

    finalizeNumbers() {
        // 번호 확정 및 표시
        this.isGenerating = false;
        this.isNumbersFinalized = true;
        document.getElementById('generateBtn').textContent = '번호생성';
        document.getElementById('generateBtn').classList.remove('active');
        document.getElementById('generateBtn').classList.remove('disabled');

        // 선택된 번호들 저장
        this.selectedNumbers = new Set([...this.userSelectedNumbers, ...this.autoSelectedNumbers]);

        // 선택된 번호 표시 영역 업데이트
        this.updateSelectedNumbersDisplay();

        // 당첨 번호와 일치하는 회차 찾기
        this.findMatchingDraws();
    }

    // 일치 결과 초기화
    clearMatchResult() {
        const matchResultElement = document.getElementById('matchResult');
        if (matchResultElement) {
            matchResultElement.textContent = '';
            matchResultElement.classList.remove('has-match');
        }
    }

    // 당첨 번호와 일치하는 회차 찾기
    findMatchingDraws() {
        // history_win 변수가 존재하는지 확인
        if (typeof history_win === 'undefined') {
            console.error('history_win 데이터를 찾을 수 없습니다.');
            return;
        }

        // 선택된 번호를 숫자 형태로 변환하여 정렬
        const selectedNumbers = Array.from(this.selectedNumbers).map(num => Number(num)).sort((a, b) => a - b);
        console.log("선택된 번호:", selectedNumbers);

        // 가장 많이 일치하는 회차 찾기
        let maxMatches = 0;
        let matchingDraws = [];

        // 모든 회차를 검사
        for (const draw of history_win) {
            const drawNumber = draw[0]; // 회차
            const drawNumbers = draw.slice(1, 7); // 당첨 번호 6개
            const prizeAmount = draw[9]; // 1등 당첨금

            // 일치하는 번호 개수 계산
            let matchCount = 0;
            const matchedNumbers = [];

            // 선택된 각 번호에 대해 당첨 번호와 일치하는지 확인
            for (const num of selectedNumbers) {
                // 숫자 타입으로 비교
                if (drawNumbers.includes(num)) {
                    matchCount++;
                    matchedNumbers.push(num);
                }
            }

            //console.log(`${drawNumber}회차 비교:`, drawNumbers, "일치 개수:", matchCount, "일치 번호:", matchedNumbers);

            // 최대 일치 개수 업데이트
            if (matchCount > maxMatches) {
                maxMatches = matchCount;
                matchingDraws = [{ drawNumber, matchCount, prizeAmount, drawNumbers, matchedNumbers }];
            } else if (matchCount === maxMatches && matchCount > 0) {
                matchingDraws.push({ drawNumber, matchCount, prizeAmount, drawNumbers, matchedNumbers });
            }
        }

        //console.log("최대 일치 개수:", maxMatches, "일치하는 회차:", matchingDraws);

        // 결과 표시
        this.displayMatchResult(matchingDraws, maxMatches);
    }

    // 일치 결과 표시
    displayMatchResult(matchingDraws, maxMatches) {
        const matchResultElement = document.getElementById('matchResult');

        // 일치하는 번호가 없거나 2개 이하인 경우 (미당첨)
        if (maxMatches <= 2 || matchingDraws.length === 0) {
            matchResultElement.textContent = '기존에 당첨된 회차가 없는 번호입니다.';
            matchResultElement.classList.remove('has-match');
            return;
        }

        // 가장 1등 당첨금이 높은 회차 찾기
        const highestPrizeDraw = matchingDraws.reduce((highest, current) =>
            current.prizeAmount > highest.prizeAmount ? current : highest, matchingDraws[0]);

        console.log("가장 당첨금이 높은 회차:", highestPrizeDraw);

        // 결과 메시지 생성 (3개 이상 일치하는 경우만)
        let resultMessage = `${highestPrizeDraw.drawNumber}회차와 ${maxMatches}개의 번호가 일치합니다!`;

        // 결과 표시
        matchResultElement.textContent = resultMessage;
        matchResultElement.classList.add('has-match');
    }

    updateSelectedNumbersDisplay() {
        const selectedNumbersContainer = document.querySelector('.selected-numbers');
        selectedNumbersContainer.innerHTML = '';

        // 선택된 번호를 정렬하여 표시
        const sortedNumbers = Array.from(this.selectedNumbers).sort((a, b) => a - b);

        // 6개의 동그라미 생성 (선택된 번호 + 빈 동그라미)
        for (let i = 0; i < 6; i++) {
            const numberElement = document.createElement('div');
            numberElement.className = 'selected-number';

            if (i < sortedNumbers.length) {
                const num = sortedNumbers[i];
                numberElement.textContent = num;
                numberElement.setAttribute('data-number', num.toString().padStart(2, '0'));

                // 사용자 선택 번호와 자동 선택 번호 구분 클래스 제거
                numberElement.classList.remove('user-selected');
                numberElement.classList.remove('auto-selected');
            } else {
                numberElement.className += ' empty';
                numberElement.textContent = '';
            }

            selectedNumbersContainer.appendChild(numberElement);
        }
    }

    handleReset() {
        // 애니메이션 진행 중이거나 버튼이 비활성화된 경우 무시
        if (this.isAnimating || document.getElementById('resetBtn').disabled) {
            // 애니메이션 중이라도 초기화 버튼은 활성화
            this.enableResetButton();
            return;
        }

        try {
            // 이미 초기화된 상태인지 확인
            const isAlreadyReset = this.userSelectedNumbers.size === 0 &&
                this.autoSelectedNumbers.size === 0 &&
                !this.isGenerating &&
                !this.isNumbersFinalized;

            // 이미 초기화된 상태라면 아무 작업도 하지 않음
            if (isAlreadyReset) {
                return;
            }

            // 애니메이션 중단
            this.clearAnimations();

            // 초기화 로직
            this.selectedNumbers = new Set();
            this.userSelectedNumbers = new Set();
            this.autoSelectedNumbers = new Set();
            this.isGenerating = false;
            this.isNumbersFinalized = false;
            this.isAnimating = false;

            // 모든 셀 선택 해제
            document.querySelectorAll('.number-cell').forEach(cell => {
                cell.classList.remove('selected');
                cell.classList.remove('auto-selected');
            });

            // 빈 동그라미 6개로 초기화
            this.initializeEmptyCircles();

            // 버튼 상태 초기화
            document.getElementById('generateBtn').textContent = '번호생성';
            document.getElementById('generateBtn').classList.remove('active');
            document.getElementById('generateBtn').classList.remove('disabled');

            // 초기화 버튼 활성화
            this.enableResetButton();

            // 일치 결과 초기화
            this.clearMatchResult();

            console.log('초기화 완료');
        } catch (error) {
            console.error('초기화 중 오류 발생:', error);
            // 오류 발생 시 페이지 새로고침
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }

    handleCellClick(cell) {
        // 번호가 확정된 상태에서는 선택 불가
        if (this.isNumbersFinalized) {
            this.showMessage('초기화 버튼을 눌러 다시 시작하세요');
            return;
        }

        const number = parseInt(cell.textContent);

        if (this.isGenerating) {
            // 번호생성 후 번호결정 전 상태
            if (this.userSelectedNumbers.has(number)) {
                // 사용자가 선택한 번호 취소
                this.userSelectedNumbers.delete(number);
                cell.classList.remove('selected');
                this.updateGenerateButtonState();

                // 번호생성 버튼 텍스트 변경
                if (this.userSelectedNumbers.size + this.autoSelectedNumbers.size < 6) {
                    document.getElementById('generateBtn').textContent = '번호생성';
                }

                return;
            } else if (this.autoSelectedNumbers.has(number)) {
                // 자동 선택된 번호 취소
                this.autoSelectedNumbers.delete(number);
                cell.classList.remove('auto-selected');
                this.updateGenerateButtonState();

                // 번호생성 버튼 텍스트 변경
                if (this.userSelectedNumbers.size + this.autoSelectedNumbers.size < 6) {
                    document.getElementById('generateBtn').textContent = '번호생성';
                }

                return;
            }

            // 새로운 번호 선택 (자동 선택된 번호 중 하나를 대체)
            if (this.userSelectedNumbers.size + this.autoSelectedNumbers.size >= 6) {
                this.showMessage('이미 6개의 번호가 선택되었습니다');
                return;
            }

            // 새 번호 선택 (사용자 선택으로 표시)
            this.userSelectedNumbers.add(number);
            cell.classList.add('selected');
            cell.classList.remove('auto-selected');
            this.updateGenerateButtonState();

            // 리플 효과 추가
            this.addRippleEffect(cell);

            // 번호생성 버튼 텍스트 변경 - 자동 선택 번호가 있는 경우에만 "번호결정"으로 변경
            if (this.userSelectedNumbers.size + this.autoSelectedNumbers.size === 6 && this.autoSelectedNumbers.size > 0) {
                document.getElementById('generateBtn').textContent = '번호결정';
            } else {
                document.getElementById('generateBtn').textContent = '번호생성';
            }

            return;
        }

        // 일반 선택 모드
        // 이미 선택된 숫자인 경우 선택 해제
        if (this.userSelectedNumbers.has(number)) {
            this.userSelectedNumbers.delete(number);
            cell.classList.remove('selected');
            return;
        }

        // 최대 6개까지만 선택 가능
        if (this.userSelectedNumbers.size >= 6) {
            this.showMessage('숫자는 6개까지 선택 가능합니다');
            return;
        }

        // 새로운 숫자 선택
        this.userSelectedNumbers.add(number);
        cell.classList.add('selected');

        // 리플 효과 추가
        this.addRippleEffect(cell);
    }

    initializeMessageArea() {
        const messageArea = document.getElementById('messageArea');
        // 초기에 메시지 영역 숨기기
        messageArea.style.display = 'none';
    }

    showMessage(message) {
        const messageArea = document.getElementById('messageArea');

        // 이전 메시지 타이머 모두 취소
        this.messageTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.messageTimeouts = [];

        // 메시지 내용 설정 및 표시
        messageArea.textContent = message;
        messageArea.style.display = 'block';

        // 메시지 표시 애니메이션
        messageArea.style.opacity = '0';
        messageArea.style.transform = 'translate(-50%, -50%) scale(0.9)';

        // 애니메이션 시작 타이머 설정
        const showTimerId = setTimeout(() => {
            messageArea.style.opacity = '1';
            messageArea.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        this.messageTimeouts.push(showTimerId);

        // 메시지 숨기기 타이머 설정 (1초 후)
        const hideTimerId = setTimeout(() => {
            messageArea.style.opacity = '0';
            messageArea.style.transform = 'translate(-50%, -50%) scale(0.9)';

            // 완전히 숨기기 타이머 설정
            const removeTimerId = setTimeout(() => {
                messageArea.style.display = 'none';
            }, 300);
            this.messageTimeouts.push(removeTimerId);
        }, 1000);
        this.messageTimeouts.push(hideTimerId);
    }

    setupRippleEffect() {
        const generateButton = document.querySelector('.generate-button');
        const menuButton = document.querySelector('.menu-button');
        const closeMenu = document.querySelector('.close-menu');
        const numberCells = document.querySelectorAll('.number-cell');

        // 번호생성 버튼, 메뉴 버튼, 닫기 버튼에 리플 효과 추가
        [generateButton, menuButton, closeMenu].forEach(button => {
            if (button) {
                button.addEventListener('click', (e) => {
                    this.addRippleEffect(button, e);
                });
            }
        });

        // 숫자 셀에 리플 효과 추가
        numberCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                this.addRippleEffect(cell, e);
            });
        });
    }

    addRippleEffect(element, event) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');

        element.appendChild(ripple);

        let x, y;

        if (event) {
            const rect = element.getBoundingClientRect();
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        } else {
            x = element.offsetWidth / 2;
            y = element.offsetHeight / 2;
        }

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    initializeEmptyCircles() {
        const selectedNumbersContainer = document.querySelector('.selected-numbers');
        selectedNumbersContainer.innerHTML = '';

        // 빈 동그라미 6개 생성
        for (let i = 0; i < 6; i++) {
            const numberElement = document.createElement('div');
            numberElement.className = 'selected-number empty';
            numberElement.textContent = '';
            selectedNumbersContainer.appendChild(numberElement);
        }
    }

    regenerateRemainingNumbers() {
        // 애니메이션 진행 중이면 이전 애니메이션 중단
        if (this.isAnimating) {
            this.clearAnimations();
        }

        // 현재 선택된 모든 번호 (사용자 선택 + 자동 선택)
        const selectedNumbers = new Set([...this.userSelectedNumbers, ...this.autoSelectedNumbers]);

        // 필요한 추가 번호 수
        const remainingCount = 6 - selectedNumbers.size;

        if (remainingCount <= 0) {
            return;
        }

        // 선택 가능한 번호 목록 (1-45 중 아직 선택되지 않은 번호)
        const availableNumbers = [];
        for (let i = 1; i <= 45; i++) {
            if (!selectedNumbers.has(i)) {
                availableNumbers.push(i);
            }
        }

        // 랜덤하게 필요한 만큼 번호 선택
        const newAutoNumbers = [];
        while (newAutoNumbers.length < remainingCount && availableNumbers.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const randomNum = availableNumbers[randomIndex];
            availableNumbers.splice(randomIndex, 1);
            newAutoNumbers.push(randomNum);
        }

        // 애니메이션으로 새 번호 표시
        this.animateAdditionalNumbers(newAutoNumbers);

        // 애니메이션 진행 중에는 초기화 버튼 비활성화
        this.disableResetButton();
    }

    animateAdditionalNumbers(numbers) {
        // 애니메이션 상태 설정
        this.isAnimating = true;

        // 애니메이션 효과를 위한 준비
        const cells = document.querySelectorAll('.number-cell');

        // 랜덤 깜빡임 효과
        let animationSpeed = 50; // 초기 속도 (밀리초) - 값을 높이면 애니메이션이 느려짐
        let flashCount = 0;
        const maxFlashes = 6; // 최대 깜빡임 횟수 - 값을 줄이면 전체 애니메이션 시간이 줄어듦

        const flashRandomNumbers = () => {
            // 이전에 깜빡인 번호 초기화
            cells.forEach(cell => {
                const num = parseInt(cell.textContent);
                if (!this.userSelectedNumbers.has(num) && !this.autoSelectedNumbers.has(num) && !numbers.includes(num)) {
                    cell.classList.remove('auto-selected');
                }
            });

            // 랜덤 번호 선택하여 깜빡임
            if (flashCount < maxFlashes) {
                const availableNumbers = [];
                for (let i = 1; i <= 45; i++) {
                    if (!this.userSelectedNumbers.has(i) && !this.autoSelectedNumbers.has(i) && !numbers.includes(i)) {
                        availableNumbers.push(i);
                    }
                }

                // 랜덤하게 1~3개 번호 선택
                const flashCountThisRound = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < flashCountThisRound && availableNumbers.length > 0; i++) {
                    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
                    const randomNum = availableNumbers[randomIndex];
                    availableNumbers.splice(randomIndex, 1);

                    const cell = document.querySelector(`.number-cell[data-number="${randomNum.toString().padStart(2, '0')}"]`);
                    if (cell) {
                        cell.classList.add('auto-selected');
                    }
                }

                flashCount++;
                animationSpeed = Math.max(30, animationSpeed - 2); // 점점 더 빨라짐 (최소 30ms까지)
                const timeoutId = setTimeout(flashRandomNumbers, animationSpeed);
                this.animationTimeouts.push(timeoutId); // 타임아웃 ID 저장
            } else {
                // 깜빡임 효과 후 최종 선택
                finalizeSelection();
            }
        };

        // 최종 선택 표시
        const finalizeSelection = () => {
            let delay = 0;
            numbers.forEach(num => {
                const timeoutId = setTimeout(() => {
                    const cell = document.querySelector(`.number-cell[data-number="${num.toString().padStart(2, '0')}"]`);
                    if (cell) {
                        cell.classList.add('auto-selected');
                        // 리플 효과 추가
                        this.addRippleEffect(cell);

                        // 자동 선택 번호 추적에 추가
                        this.autoSelectedNumbers.add(num);
                    }
                }, delay);
                this.animationTimeouts.push(timeoutId); // 타임아웃 ID 저장
                delay += 100; // 각 번호마다 100ms 간격으로 표시 (값을 높이면 번호가 더 천천히 표시됨)
            });

            // 애니메이션 완료 후 버튼 상태 업데이트
            const timeoutId = setTimeout(() => {
                this.updateGenerateButtonState();
                this.isAnimating = false; // 애니메이션 완료
                this.enableResetButton(); // 초기화 버튼 활성화
            }, delay);
            this.animationTimeouts.push(timeoutId); // 타임아웃 ID 저장
        };

        // 애니메이션 시작
        flashRandomNumbers();
    }
}

// 로또 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 현재 페이지 확인
    const path = window.location.pathname;

    // 로또 게임 페이지에서만 로또 게임 초기화
    if (path.includes('/lotto/')) {
        new LottoGame();
    }
});

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