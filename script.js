
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let currentUser = null;

const API_KEY = "AQ.Ab8RN6JEj7mhtJ_FXI4PujH0worPIdYz9Anicm0j5tvgWJ-zFA";

const chat = document.getElementById("chat");
const input = document.getElementById("msg");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadMessages();
});
async function loadMessages() {

    chat.innerHTML = "";

    const q = query(
        collection(db, "users", currentUser.uid, "chats"),
        orderBy("time")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((doc) => {

        const data = doc.data();

        chat.innerHTML += `
        <div class="${data.role}">
            ${data.text}
        </div>
        `;

    });

    chat.scrollTop = chat.scrollHeight;
}
async function send() {
  const input = document.getElementById("msg");
  const chat = document.getElementById("chat");

  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<div class="user">${message}</div>`;
  await addDoc(
    collection(db, "users", currentUser.uid, "chats"),
    {
        role: "user",
        text: message,
        time: serverTimestamp()
    }
);
  input.value = "";

  chat.innerHTML += `<div class="bot" id="loading">Thinking...</div>`;
  await addDoc(
    collection(db, "users", currentUser.uid, "chats"),
    {
        role: "bot",
        text: reply,
        time: serverTimestamp()
    }
);
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    document.getElementById("loading").remove();

    let reply = "Sorry, I couldn't generate a response.";

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      reply = data.candidates[0].content.parts[0].text;
    }

    chat.innerHTML += `<div class="bot">${reply}</div>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (error) {

    const loading = document.getElementById("loading");
    if (loading) loading.remove();

    console.error(error);

    chat.innerHTML += `
        <div class="bot">
            ⚠️ Error: Unable to connect to Profit AI.
            Please try again.
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;
  }
  }

window.send = send;
chat.scrollTop = chat.scrollHeight;
