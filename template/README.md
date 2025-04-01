# 웹사이트 공통 템플릿 가이드

이 템플릿은 로또 생성기와 SMI to SRT 변환기 등 여러 페이지에서 공통으로 사용되는 구조를 제공합니다.

## 파일 구조

- `index.html`: 공통 HTML 구조 템플릿
- `css.css`: 공통 스타일
- `js.js`: 공통 JavaScript 기능 (메뉴, 메시지 표시 등)
- `menu.json`: 메뉴 항목 정의 파일

## 사용 방법

### 1. 새 페이지 생성 시

새 페이지 생성 시 `index.html`을 기반으로 다음 태그들을 적절히 수정하세요:

```html
<meta name="description" content="{{DESCRIPTION}}">
<meta name="keywords" content="{{KEYWORDS}}">
<meta property="og:title" content="{{OG_TITLE}}">
<meta property="og:description" content="{{OG_DESCRIPTION}}">
<meta property="og:url" content="{{OG_URL}}">
<meta property="og:image" content="{{OG_IMAGE}}">
<link rel="canonical" href="{{CANONICAL}}">
<title>{{TITLE}}</title>
<link rel="stylesheet" href="{{PAGE_CSS}}">
<script type="application/ld+json">{{JSON_LD}}</script>
<h1>{{PAGE_TITLE}}</h1>
{{CONTENT}}
<script src="{{PAGE_JS}}"></script>
<!-- 현재 페이지 ID 설정 -->
<script>
    window.currentPageId = "페이지ID"; // 예: "lotto", "smi2srt"
</script>
```

### 2. 현재 페이지 ID 설정

각 페이지에서는 현재 페이지 ID를 설정해주세요. 이 ID는 `menu.json`에 정의된 ID와 일치해야 합니다:

```javascript
<script>
    window.currentPageId = "lotto"; // 로또 페이지의 경우
    // 또는
    window.currentPageId = "smi2srt"; // SMI2SRT 페이지의 경우
</script>
```

### 3. 메뉴 관리

메뉴는 `menu.json` 파일에서 중앙 관리됩니다. 새 메뉴 항목 추가 또는 수정 시 이 파일만 변경하면 됩니다:

```json
{
  "menuItems": [
    {
      "id": "lotto",            // 페이지 식별자
      "title": "로또번호생성기",  // 메뉴에 표시될 텍스트
      "url": "../lotto",        // 링크 URL
      "icon": "casino"          // Material Icon 이름
    },
    // 다른 메뉴 항목...
  ]
}
```

### 4. 컨텐츠 영역

`{{CONTENT}}` 영역에 페이지별 고유한 컨텐츠를 삽입하세요.

### 5. 공통 기능 사용

#### 메시지 표시

사용자에게 알림 메시지를 표시하려면 다음 함수를 사용하세요:

```javascript
showMessage("표시할 메시지", 3000); // 3000ms 동안 표시
```

## 주의사항

1. 공통 템플릿 파일(`index.html`, `css.css`, `js.js`)은 직접 수정하지 마세요.
2. 페이지별 스타일과 스크립트는 별도 파일로 관리하세요.
3. 템플릿을 사용할 때 모든 `{{...}}` 플레이스홀더를 적절한 값으로 대체해야 합니다.
4. 새로운 페이지를 추가할 때는 `menu.json`에 메뉴 항목을 추가하고, 페이지에서 `currentPageId`를 설정하세요. 