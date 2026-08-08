 import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const API_KEY = "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";

let currentUser = null;

const chat = document.getElementById("chat");
const input = document.getElementById("msg");


// Security: safely display messages
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// Check login
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadMessages();
});


// Load previous messages
async function loadMessages() {

    chat.innerHTML = "";

    try {

        const chatsRef = collection(
            db,
            "users",
            currentUser.uid,
            "chats"
        );

        const q = query(
            chatsRef,
            orderBy("time", "asc")
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {

            const data = doc.data();

            if (data.role === "user") {

                chat.innerHTML += `
                    <div class="user">
                        ${escapeHTML(data.text)}
                    </div>
                `;

            } else if (data.role === "bot") {

                chat.innerHTML += `
                    <div class="bot">
                        ${escapeHTML(data.text)}
                    </div>
                `;
            }

        });

        chat.scrollTop = chat.scrollHeight;

    } catch (error) {

        console.error("Load chat error:", error);

        chat.innerHTML += `
            <div class="bot">
                ⚠️ Unable to load previous chats.
            </div>
        `;
    }
}


// Send message
async function send() {
  const input = document.getElementById("msg");
  const chat = document.getElementById("chat");

  const message = input.value.trim();
  if (!message) return;

  // Show user message
  chat.innerHTML += `<div class="user">${message}</div>`;
  input.value = "";

  // Show thinking
  const loading = document.createElement("div");
  loading.className = "bot";
  loading.id = "loading";
  loading.textContent = "🤖 Thinking...";
  chat.appendChild(loading);
  chat.scrollTop = chat.scrollHeight;

  try {
    const controller = new AbortController();

    // Stop waiting after 30 seconds
    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,

        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are Profit AI, a helpful AI assistant. Give clear, friendly and useful answers."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_completion_tokens: 1000
        })
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    // Remove Thinking
    loading.remove();

    // Check API error
    if (!response.ok) {
      console.error("Groq API Error:", data);

      chat.innerHTML += `
        <div class="bot">
          ❌ API Error: ${data.error?.message || "Something went wrong."}
        </div>
      `;

      return;
    }

    // Get AI response
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    chat.innerHTML += `<div class="bot">${reply}</div>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (error) {

    loading.remove();

    console.error("Connection Error:", error);

    if (error.name === "AbortError") {
      chat.innerHTML += `
        <div class="bot">
          ⏱️ The AI took too long to respond. Please try again.
        </div>
      `;
    } else {
      chat.innerHTML += `
        <div class="bot">
          ❌ Connection error. Please try again.
        </div>
      `;
    }
  }
}

window.send = send;

    
