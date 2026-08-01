// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsJ8BIXu3xvaMnCwF8WNesRPJfy9zbadg",
  authDomain: "profit-ai-37155.firebaseapp.com",
  projectId: "profit-ai-37155",
  storageBucket: "profit-ai-37155.firebasestorage.app",
  messagingSenderId: "245284035512",
  appId: "1:245284035512:web:027d79d90a9130536d0d4d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, db };
