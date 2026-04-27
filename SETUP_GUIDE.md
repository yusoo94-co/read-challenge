# 📱 말씀 챌린지 앱 배포 가이드
> 코딩 몰라도 됩니다! 순서대로만 따라하세요 🙏

---

## ✅ 전체 흐름

Firebase 만들기 → 코드에 붙여넣기 → Vercel에 올리기 → 링크 공유 → 폰에 앱 설치

---

## 1단계 — Firebase 만들기 (무료 데이터베이스)

1. **https://console.firebase.google.com** 접속
2. 구글 계정으로 로그인
3. **"프로젝트 만들기"** 클릭
4. 프로젝트 이름 입력 (예: `malbseum-challenge`) → 계속
5. Google 애널리틱스 **비활성화** → 프로젝트 만들기

### 데이터베이스 생성
6. 왼쪽 메뉴에서 **"빌드" → "Realtime Database"** 클릭
7. **"데이터베이스 만들기"** 클릭
8. 위치: **"United States"** 선택 → 다음
9. **"테스트 모드에서 시작"** 선택 → 완료

### 앱 등록 및 설정값 복사
10. 왼쪽 상단 **⚙️ 설정 → 프로젝트 설정** 클릭
11. 아래로 스크롤 → **"내 앱"** 섹션에서 **`</>`** (웹) 아이콘 클릭
12. 앱 닉네임 입력 (아무거나 ok) → **앱 등록**
13. **`firebaseConfig`** 코드 블록이 보입니다 — 이걸 복사할 거예요

---

## 2단계 — 설정값 붙여넣기

받은 파일 중 **`src/firebase.js`** 파일을 메모장으로 열어서
아래처럼 Firebase에서 복사한 값을 붙여넣으세요:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Firebase에서 복사
  authDomain: "myapp.firebaseapp.com",
  databaseURL: "https://myapp-default-rtdb.firebaseio.com",
  projectId: "myapp",
  storageBucket: "myapp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

> ⚠️ `databaseURL`이 꼭 있어야 해요! 없으면 Firebase 콘솔에서
> Realtime Database → 상단에 표시된 URL을 복사해서 추가하세요.

---

## 3단계 — Vercel에 배포하기

1. **https://github.com** 접속 → 회원가입 (무료)
2. 오른쪽 상단 **"+"** → **"New repository"**
3. Repository name: `read-challenge` → **"Create repository"**
4. **"uploading an existing file"** 클릭
5. 받은 파일 전체를 **드래그 앤 드롭**으로 업로드
6. **"Commit changes"** 클릭

### Vercel 연결
7. **https://vercel.com** 접속 → **"Continue with GitHub"** 로그인
8. **"Add New → Project"** 클릭
9. `read-challenge` 저장소 선택 → **"Import"**
10. **"Deploy"** 클릭 (1~2분 기다리기)
11. 완료! 🎉 **`your-app.vercel.app`** 링크 생성됨

---

## 4단계 — 폰에 앱으로 설치하기 (PWA)

### 아이폰 (iPhone)
1. **Safari**로 앱 링크 열기 (크롬 X, 사파리 O)
2. 하단 공유 버튼 (□↑) 탭
3. **"홈 화면에 추가"** 탭
4. "말씀챌린지" → **"추가"**
5. 바탕화면에 앱 아이콘 생김 ✅

### 안드로이드
1. **Chrome**으로 앱 링크 열기
2. 상단 또는 하단에 **"앱 설치"** 배너 자동으로 뜸
3. **"설치"** 탭
4. 바탕화면에 앱 아이콘 생김 ✅

---

## 5단계 — 성도들에게 공유하기

1. 앱 접속 → **"새 챌린지 방 만들기"**
2. 교회 이름 + 챌린지 이름 + 목표 독수 입력
3. 자동으로 **6자리 초대 코드** 생성
4. **⚙️ 관리 탭** → "코드 복사하기"
5. 카카오톡 단체방에 이렇게 공유:

```
📖 로마서 500독 챌린지 시작합니다!

아래 링크로 앱을 설치하고
초대 코드를 입력해 주세요 🙏

🔗 앱 링크: https://your-app.vercel.app
🔑 초대 코드: ABCDEF
```

---

## ❓ 자주 묻는 질문

**Q: 비용이 드나요?**
A: Firebase 무료 플랜으로 약 200명까지 충분합니다. Vercel도 무료예요.

**Q: 퍼스 교회도 같이 쓸 수 있나요?**
A: 네! 같은 앱에서 "새 챌린지 방 만들기"로 별도의 방을 만들면 데이터가 완전히 분리돼요.

**Q: 나중에 로마서 말고 다른 챌린지를 하고 싶어요.**
A: 새 방을 만들 때 챌린지 이름과 목표 독수만 바꾸면 돼요.

**Q: 설치가 잘 안 돼요.**
A: 아이폰은 반드시 Safari, 안드로이드는 Chrome을 사용해 주세요.

---

도움이 필요하시면 다시 Claude에게 질문해 주세요 🙏
