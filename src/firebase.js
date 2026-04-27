// ✅ Firebase 설정
// 아래 값들을 Firebase 콘솔에서 복사해서 붙여넣으세요
// (설정 방법은 SETUP_GUIDE.md 참고)

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "여기에_붙여넣기",
  authDomain: "여기에_붙여넣기",
  databaseURL: "여기에_붙여넣기",
  projectId: "여기에_붙여넣기",
  storageBucket: "여기에_붙여넣기",
  messagingSenderId: "여기에_붙여넣기",
  appId: "여기에_붙여넣기"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
