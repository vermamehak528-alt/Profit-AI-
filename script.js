import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsJ8BIXu3xvaMnCwF8WNesRPJfy9zbadg",
  authDomain: "profit-ai-37155.firebaseapp.com",
  projectId: "profit-ai-37155",
  storageBucket: "profit-ai-37155.firebasestorage.app",
  messagingSenderId: "245284035512",
  appId: "1:245284035512:web:00c72b557fc04bf16d0d4d",
  measurementId: "G-BCD345244E"
};

const app = initializeApp(firebaseConfig);

console.log("Firebase Connected Successfully!");
