// 상태 메시지 표시 함수
function showStatus(message, type = 'info') {
    console.log(`상태 업데이트: ${message} (${type})`);

    const processStatus = document.getElementById('processStatus');
    if (!processStatus) {
        console.error("processStatus 요소를 찾을 수 없습니다!");
        return;
    }

    processStatus.textContent = message;
    processStatus.className = `process-status ${type}`;
    processStatus.style.display = 'flex';

    // 경고나 오류 메시지의 경우 스크린 리더를 위한 aria 속성 추가
    if (type === 'error' || type === 'warning') {
        processStatus.setAttribute('role', 'alert');
        processStatus.setAttribute('aria-live', 'assertive');
    } else {
        processStatus.setAttribute('role', 'status');
        processStatus.setAttribute('aria-live', 'polite');
    }
}

// 드래그 효과 제거 함수
function resetDragHighlight() {
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.classList.remove('drag-over');
    }
}

// 숫자 패딩 함수
function pad(num, size = 2) {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
}

// 밀리초를 SRT 시간 형식으로 변환하는 함수
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

// SMI를 SRT로 변환하는 함수
function convertSmiToSrt(smiContent, encoding) {
    console.log("SMI 내용 길이:", smiContent.length);
    console.log("변환에 사용되는 인코딩:", encoding);

    // 파일 내용 유효성 검사
    if (!smiContent || smiContent.trim() === '') {
        throw new Error("파일이 비어있거나 내용을 읽을 수 없습니다.");
    }

    // SAMI 형식 확인 (대소문자 구분 없이)
    if (!smiContent.match(/<SAMI[^>]*>/i)) {
        throw new Error("유효한 SMI 파일 형식이 아닙니다. <SAMI> 태그가 없습니다.");
    }

    let matches = [];
    let emptyTimestamps = new Set(); // 빈 자막 시간 저장용

    // 다양한 SMI 파일 형식 지원을 위한 다중 추출 방식 시도
    // 1. 첫 번째 방식: SYNC 태그와 P 태그를 분리하여 추출
    const syncStartRegex = /<SYNC\s+Start=(\d+)(?:\s+[^>]*)?>/gi;
    let syncPositions = [];
    let match;

    // 모든 SYNC 태그의 위치와 시작 시간을 찾기
    while ((match = syncStartRegex.exec(smiContent)) !== null) {
        syncPositions.push({
            startTime: parseInt(match[1]),
            position: match.index,
            length: match[0].length
        });
    }

    console.log("찾은 SYNC 태그 수:", syncPositions.length);

    // SYNC 태그가 있는 경우만 처리
    if (syncPositions.length > 0) {
        // 시작 시간으로 정렬
        syncPositions.sort((a, b) => a.startTime - b.startTime);

        // 각 SYNC 태그 사이의 텍스트 추출
        for (let i = 0; i < syncPositions.length; i++) {
            const currentSync = syncPositions[i];
            const startPos = currentSync.position + currentSync.length;
            const endPos = (i < syncPositions.length - 1) ? syncPositions[i + 1].position : smiContent.length;

            // SYNC 태그 사이의 컨텐츠
            let content = smiContent.substring(startPos, endPos);

            // P 태그에서 텍스트 추출 (다양한 P 태그 형식 지원)
            let textContent = "";
            const pTagRegex = /<P[^>]*Class=KRCC[^>]*>([\s\S]*?)(?=<\/P>|<SYNC|$)/gi;
            let pMatch;
            let hasContent = false;

            while ((pMatch = pTagRegex.exec(content)) !== null) {
                if (pMatch[1]) {
                    const trimmedText = pMatch[1].trim();
                    if (trimmedText) {
                        hasContent = true;
                        // <br> 또는 <br/> 태그를 단일 개행 문자로 변환
                        let text = trimmedText.replace(/<br\s*\/?>/gi, '\n');
                        // 연속된 개행문자를 하나로 통합 (빈 줄 방지)
                        text = text.replace(/\n\s*\n/g, '\n');
                        // font 태그 처리
                        text = text.replace(/<font[^>]*>/gi, '').replace(/<\/font>/gi, '');
                        // i 태그 처리
                        text = text.replace(/<i>/gi, '').replace(/<\/i>/gi, '');
                        // 나머지 HTML 태그 제거
                        text = text.replace(/<[^>]*>/g, '').trim();

                        if (text) {
                            textContent += text + " ";
                        }
                    }
                }
            }

            textContent = textContent.trim();

            // 텍스트가 있는 경우 추가, 없는 경우 빈 자막 시간 기록
            if (textContent) {
                matches.push({
                    startTime: currentSync.startTime,
                    text: textContent
                });
            } else {
                // 빈 SYNC 태그가 있으면 저장 (자막 종료 시점으로 사용)
                emptyTimestamps.add(currentSync.startTime);
            }
        }
    }

    // 2. 첫 번째 방식으로 추출 실패 시 두 번째 방식 시도: SYNC와 P 태그를 함께 추출
    if (matches.length === 0) {
        console.log("첫 번째 방식 실패, 두 번째 방식으로 재시도");

        const alternativeRegex = /<SYNC\s+Start=(\d+)[^>]*>(?:[\s\n]*)<P[^>]*Class=KRCC[^>]*>([\s\S]*?)(?=<SYNC|$)/gi;
        let lastIndex = 0;

        while ((match = alternativeRegex.exec(smiContent)) !== null) {
            // lastIndex가 이전과 같으면 무한 루프 방지
            if (match.index === lastIndex) {
                alternativeRegex.lastIndex++;
            }
            lastIndex = match.index;

            const startTime = parseInt(match[1]);
            // <br> 또는 <br/> 태그를 개행 문자로 변환
            let text = match[2].replace(/<br\s*\/?>/gi, '\n');
            // font 태그 처리
            text = text.replace(/<font[^>]*>/gi, '').replace(/<\/font>/gi, '');
            // i 태그 처리
            text = text.replace(/<i>/gi, '').replace(/<\/i>/gi, '');
            // 나머지 HTML 태그 제거
            text = text.replace(/<[^>]*>/g, '').trim();

            if (text) {
                matches.push({
                    startTime,
                    text
                });
            }
        }
    }

    // 3. 세 번째 방식: 모든 텍스트를 문맥에서 추출하기 위한 가장 단순한 방법
    if (matches.length === 0) {
        console.log("두 번째 방식 실패, 세 번째 방식으로 재시도");

        // class 속성을 포함한 P 태그 및 내용 추출
        const classRegex = /<SYNC\s+Start=(\d+)[^>]*>[\s\n]*<P\s+Class=([^>]*)>(.*?)(?=<SYNC|$)/gis;

        while ((match = classRegex.exec(smiContent)) !== null) {
            const startTime = parseInt(match[1]);
            const className = match[2] ? match[2].trim() : '';
            // <br> 또는 <br/> 태그를 개행 문자로 변환
            let text = match[3].replace(/<br\s*\/?>/gi, '\n');
            // 나머지 HTML 태그 제거
            text = text.replace(/<[^>]*>/g, '').trim();

            if (text) {
                matches.push({
                    startTime,
                    text,
                    class: className
                });
            }
        }
    }

    // 4. 네 번째 방식: 단순하게 SYNC와 다음 SYNC 사이의 모든 텍스트 추출
    if (matches.length === 0) {
        console.log("세 번째 방식 실패, 네 번째 방식으로 재시도");

        const simpleRegex = /<SYNC\s+Start=(\d+)[^>]*>([\s\S]*?)(?=<SYNC|$)/gi;

        while ((match = simpleRegex.exec(smiContent)) !== null) {
            const startTime = parseInt(match[1]);

            // <br> 또는 <br/> 태그를 개행 문자로 변환
            let text = match[2].replace(/<br\s*\/?>/gi, '\n');
            // P 태그 및 다른 모든 태그 제거
            text = text.replace(/<[^>]*>/g, '').trim();

            // 여러 개의 공백을 하나로 치환하되, 개행 문자는 유지
            text = text.replace(/[ \t\f\v]+/g, ' ').trim();

            if (text) {
                matches.push({
                    startTime,
                    text
                });
            }
        }
    }

    // 5. 다섯 번째 방식: ANSI/CP949 인코딩 문제일 가능성이 있으므로 특수한 방식 시도
    if (matches.length === 0 && (encoding === "CP949" || encoding === "EUC-KR")) {
        console.log("네 번째 방식 실패, 다섯 번째 방식으로 재시도 (특수 인코딩 처리)");

        // 인코딩 문제로 태그가 깨질 수 있으므로 더 관대한 정규식 사용
        const lenientRegex = /SYNC.+?Start=(\d+)[^>]*>([^<]*)/gi;

        while ((match = lenientRegex.exec(smiContent)) !== null) {
            if (match[1] && match[2]) {
                const startTime = parseInt(match[1]);
                let text = match[2].trim();

                if (text && startTime > 0) {
                    matches.push({
                        startTime,
                        text
                    });
                }
            }
        }
    }

    // 변환된 자막 항목 수 확인
    console.log("최종 추출된 자막 항목 수:", matches.length);
    console.log("빈 자막 시간 수:", emptyTimestamps.size);

    // 자막을 찾지 못한 경우 메시지 표시
    if (matches.length === 0) {
        throw new Error("SMI 파일에서 자막을 찾을 수 없습니다.");
    }

    // 시작 시간 기준으로 정렬 및 중복 제거
    matches.sort((a, b) => a.startTime - b.startTime);

    // 중복 시작 시간 항목 제거 (마지막 항목만 유지)
    const uniqueMatches = [];
    const usedStartTimes = new Set();

    // 시간 역순으로 중복 검사 (마지막 항목 우선)
    for (let i = matches.length - 1; i >= 0; i--) {
        const item = matches[i];
        if (!usedStartTimes.has(item.startTime)) {
            usedStartTimes.add(item.startTime);
            uniqueMatches.unshift(item); // 앞에 추가하여 시간순 유지
        }
    }

    // 각 항목에 대해 종료 시간 계산 (빈 자막 시간 고려)
    for (let i = 0; i < uniqueMatches.length; i++) {
        let currentTime = uniqueMatches[i].startTime;
        let nextTime;

        // 다음 자막 시작 시간 확인
        if (i < uniqueMatches.length - 1) {
            nextTime = uniqueMatches[i + 1].startTime;
        } else {
            // 마지막 자막은 5초 지속
            nextTime = currentTime + 5000;
        }

        // 현재 자막과 다음 자막 사이에 빈 자막이 있는지 확인
        for (const emptyTime of emptyTimestamps) {
            if (emptyTime > currentTime && emptyTime < nextTime) {
                // 빈 자막 시간으로 종료 시간 설정 (더 짧은 지속 시간)
                nextTime = emptyTime;
                break;
            }
        }

        uniqueMatches[i].endTime = nextTime;
    }

    // SRT 형식으로 변환
    let srtContent = '';

    uniqueMatches.forEach((item, index) => {
        const startTimeFormatted = formatTime(item.startTime);
        const endTimeFormatted = formatTime(item.endTime);

        srtContent += `${index + 1}\n`;
        srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
        srtContent += `${item.text}\n\n`;
    });

    // 변환된 내용이 비어있는지 확인
    if (!srtContent.trim()) {
        throw new Error("변환된 자막이 없습니다. 파일 내용을 확인해주세요.");
    }

    return srtContent;
}

// 파일 처리 함수
function processFile(file) {
    console.log(`처리 시작: ${file.name}`);
    return new Promise((resolve, reject) => {
        // 파일 크기 확인
        if (file.size === 0) {
            reject(new Error("파일이 비어있습니다."));
            return;
        }

        // 상태 메시지 업데이트
        showStatus(`${file.name} 파일 처리 중...`, "processing");

        // 더 많은 인코딩 옵션 지원하기 위해 TextDecoder 사용
        const tryDecodingWithEncodings = (arrayBuffer) => {
            let content = '';
            let usedEncoding = null;

            // 한글 포함 여부 확인 함수
            const hasKoreanText = (text) => {
                const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
                return koreanRegex.test(text);
            };

            // 콘텐츠 유효성 검사 함수
            const isValidContent = (text) => {
                if (!text || !text.trim()) {
                    console.log("빈 내용 감지됨");
                    return false;
                }

                // SAMI 또는 SYNC 태그 확인 (대소문자 구분 없이)
                const hasSAMI = text.toLowerCase().includes('<sami') || text.includes('SAMI');
                const hasSYNC = text.toLowerCase().includes('sync');

                console.log("SAMI 태그 존재:", hasSAMI);
                console.log("SYNC 태그 존재:", hasSYNC);

                if (!hasSAMI && !hasSYNC) {
                    return false;
                }

                // KRCC 클래스가 있는지 확인
                const hasKRCC = text.includes('Class=KRCC');
                console.log("KRCC 클래스 존재:", hasKRCC);

                // 한글이 포함된 경우 추가 검증
                if (hasKoreanText(text)) {
                    // 한글 문자가 정상적으로 표시되는지 확인
                    const koreanTextSample = text.match(/[\uAC00-\uD7AF가-힣]{2,}/g);
                    if (koreanTextSample) {
                        console.log("한글 텍스트 샘플:", koreanTextSample.slice(0, 3));
                    }

                    // 의심스러운 패턴 검사 (완화된 버전)
                    const suspiciousPatterns = [
                        /[?]{5,}/,                 // 5개 이상 연속된 물음표
                        /[\u0080-\u00FF]{5,}/,     // 5개 이상 연속된 확장 ASCII 문자
                    ];

                    let suspiciousCount = 0;
                    for (const pattern of suspiciousPatterns) {
                        if (pattern.test(text)) {
                            console.log("의심스러운 문자 패턴 발견:", pattern);
                            suspiciousCount++;
                        }
                    }

                    // 모든 패턴이 발견된 경우에만 실패
                    if (suspiciousCount === suspiciousPatterns.length) {
                        console.log("모든 의심스러운 패턴이 발견됨");
                        return false;
                    }

                    // KRCC 클래스가 없으면 실패
                    if (!hasKRCC) {
                        console.log("한글 자막이 있지만 KRCC 클래스가 없음");
                        return false;
                    }

                    // 최소한의 유효한 한글 문자가 있는지 확인
                    if (!koreanTextSample || koreanTextSample.length === 0) {
                        console.log("유효한 한글 문자열이 없음");
                        return false;
                    }

                    return true;
                }

                // 한글이 없는 경우는 SAMI/SYNC 태그와 KRCC 클래스가 모두 있어야 함
                return hasKRCC;
            };

            // BOM 체크
            const checkBOM = (buffer) => {
                const bom = new Uint8Array(buffer.slice(0, 4));

                // UTF-8 BOM
                if (bom[0] === 0xEF && bom[1] === 0xBB && bom[2] === 0xBF) {
                    console.log('UTF-8 BOM 감지됨');
                    const newBuffer = buffer.slice(3);  // BOM 제거
                    return { buffer: newBuffer, encoding: 'UTF-8' };
                }
                // UTF-16 LE BOM
                if (bom[0] === 0xFF && bom[1] === 0xFE) {
                    console.log('UTF-16 LE BOM 감지됨');
                    const newBuffer = buffer.slice(2);  // BOM 제거
                    return { buffer: newBuffer, encoding: 'UTF-16LE' };
                }
                // UTF-16 BE BOM
                if (bom[0] === 0xFE && bom[1] === 0xFF) {
                    console.log('UTF-16 BE BOM 감지됨');
                    const newBuffer = buffer.slice(2);  // BOM 제거
                    return { buffer: newBuffer, encoding: 'UTF-16BE' };
                }
                return { buffer, encoding: null };
            };

            // 시도할 인코딩 목록
            const encodings = [
                'UTF-8',
                'EUC-KR',
                'UTF-16LE',
                'UTF-16BE'
            ];

            // BOM 체크 및 인코딩 감지
            const { buffer: cleanBuffer, encoding: bomEncoding } = checkBOM(arrayBuffer);

            // BOM으로 감지된 인코딩이 있으면 먼저 시도
            if (bomEncoding) {
                try {
                    console.log(`BOM으로 감지된 ${bomEncoding} 인코딩으로 시도 중...`);
                    const decoder = new TextDecoder(bomEncoding, { fatal: false });
                    content = decoder.decode(cleanBuffer);

                    if (isValidContent(content)) {
                        console.log(`${bomEncoding} 인코딩으로 성공 (BOM)`);
                        return { content, usedEncoding: bomEncoding };
                    }
                } catch (err) {
                    console.warn(`BOM 감지된 인코딩 실패:`, err.message);
                }
            }

            // 다른 인코딩 시도
            for (const enc of encodings) {
                if (enc === bomEncoding) continue; // 이미 시도한 인코딩은 건너뛰기

                try {
                    console.log(`${enc} 인코딩으로 시도 중...`);
                    const decoder = new TextDecoder(enc, { fatal: false });

                    // 먼저 정제된 버퍼로 시도
                    content = decoder.decode(cleanBuffer);
                    console.log(`디코딩된 내용 길이:`, content.length);
                    console.log(`한글 포함 여부:`, hasKoreanText(content));

                    // 샘플 텍스트 출력
                    const sample = content.substring(0, 500);
                    console.log(`내용 샘플:`, sample);

                    if (isValidContent(content)) {
                        console.log(`${enc} 인코딩으로 성공`);
                        const displayEncoding = enc === 'EUC-KR' ? 'CP949' : enc;
                        return { content, usedEncoding: displayEncoding };
                    }
                } catch (err) {
                    console.warn(`${enc} 인코딩으로 디코딩 실패:`, err.message);
                }
            }

            throw new Error("지원되는 인코딩으로 파일을 읽을 수 없습니다. (UTF-8, CP949 인코딩만 지원)");
        };

        // ArrayBuffer로 파일 읽기
        const fileReader = new FileReader();
        fileReader.onload = function (e) {
            try {
                const arrayBuffer = e.target.result;
                console.log("파일 크기:", arrayBuffer.byteLength, "바이트");

                // SMI 파일 확장자 확인
                if (!file.name.toLowerCase().endsWith('.smi')) {
                    throw new Error("SMI 파일만 지원됩니다.");
                }

                const decodeResult = tryDecodingWithEncodings(arrayBuffer);
                console.log(`감지된 인코딩: ${decodeResult.usedEncoding}`);

                // SMI를 SRT로 변환
                console.log("SMI를 SRT로 변환 시작");
                const srtContent = convertSmiToSrt(decodeResult.content, decodeResult.usedEncoding);

                // 변환된 내용이 비어있는지 확인
                if (!srtContent || !srtContent.trim()) {
                    throw new Error("변환된 자막이 없습니다.");
                }

                resolve({
                    content: srtContent,
                    fileName: file.name.replace(/\.smi$/i, '.srt')
                });
            } catch (error) {
                console.error("파일 처리 중 오류:", error);
                reject(error);
            }
        };

        fileReader.onerror = function () {
            reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
        };

        // 항상 ArrayBuffer로 읽기
        fileReader.readAsArrayBuffer(file);
    });
}

// 다운로드 파일 생성 및 시작
function downloadFile(content, fileName) {
    try {
        console.log(`다운로드 함수 호출됨: ${fileName}, 내용 길이: ${content.length}`);

        // 파일 콘텐츠가 비어있는지 확인
        if (!content || content.trim() === "") {
            throw new Error("생성된 파일 내용이 비어있습니다.");
        }

        // UTF-8로 인코딩
        const encoder = new TextEncoder();
        const contentArray = encoder.encode(content);

        // Blob 생성 (UTF-8)
        const blob = new Blob([contentArray], { type: 'text/plain;charset=utf-8' });

        // 다운로드 링크 생성
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);

        a.click();
        console.log("UTF-8로 다운로드 시작");

        // 정리
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 500);

        return true;
    } catch (error) {
        console.error("파일 다운로드 중 오류:", error);
        showStatus(`다운로드 오류: ${error.message}`, "error");
        return false;
    }
}

// SMI to SRT 변환 전역 함수 정의
window.handleSMIFiles = function (files) {
    console.log("SMI 파일 처리 시작:", files.length + "개 파일");

    // 파일 유형 필터링 (.smi 파일만 허용)
    const smiFiles = Array.from(files).filter(file =>
        file.name.toLowerCase().endsWith('.smi')
    );

    // 파일이 없거나 smi 파일이 없는 경우
    if (smiFiles.length === 0) {
        showStatus('SMI 파일만 업로드 가능합니다.', 'error');
        return;
    }

    // 상태 메시지 업데이트
    showStatus(`${smiFiles.length}개의 파일을 처리합니다...`, 'info');

    // 각 파일에 대한 처리 시작
    smiFiles.forEach(file => {
        // 파일 처리 시작
        processFile(file)
            .then(result => {
                console.log("파일 변환 완료:", file.name);

                // 다운로드 링크 생성
                downloadFile(result.content, result.fileName);
                console.log("다운로드 요청 완료");

                // 파일 상태 업데이트
                showStatus(`파일 변환이 완료되었습니다.`, 'success');
            })
            .catch(error => {
                console.error(`${file.name} 처리 실패:`, error);
                showStatus(`${file.name}: ${error.message}`, 'error');
            });
    });
};

// 초기 상태 설정
document.addEventListener('DOMContentLoaded', function () {
    console.log("smi2srt.js 스크립트 로드됨");

    // 초기 상태 표시
    const processStatus = document.getElementById('processStatus');
    if (processStatus) {
        showStatus("SMI 파일을 업로드하세요.", "info");
    }

    // 드래그 & 드롭 이벤트 설정
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        console.log("드래그 앤 드롭 이벤트 설정");

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (eventName === 'dragenter' || eventName === 'dragover') {
                    uploadZone.classList.add('drag-over');
                } else {
                    uploadZone.classList.remove('drag-over');
                }

                if (eventName === 'drop') {
                    console.log("파일 드롭 이벤트 발생");
                    const dt = e.dataTransfer;
                    if (dt.files && dt.files.length > 0) {
                        window.handleSMIFiles(dt.files);
                    }
                }
            });
        });
    }
});