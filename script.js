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
const sendBtn = document.getElementById("sendBtn");


// Safely display text
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// Check authentication
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadMessages();
});


// Load saved chat history
async function loadMessages() {

    if (!currentUser) return;

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

            }

            if (data.role === "bot") {

                chat.innerHTML += `
                    <div class="bot">
                        ${escapeHTML(data.text)}
                    </div>
                `;

            }

        });

        chat.scrollTop = chat.scrollHeight;

    } catch (error) {

        console.error("History error:", error);

        chat.innerHTML += `
            <div class="bot">
                ⚠️ Unable to load chat history.
            </div>
        `;
    }
}


// Send message
async function send() {

    const message = input.value.trim();

    if (!message) return;

    // Show user message
    chat.innerHTML += `
        <div class="user">
            ${escapeHTML(message)}
        </div>
    `;

    input.value = "";

    // Show thinking immediately
    chat.innerHTML += `
        <div class="bot" id="loading">
            🤖 Thinking...
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;

    try {

        console.log("1. Sending request to Groq...");

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + API_KEY
                },

                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",

                    messages: [
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        console.log("2. Groq status:", response.status);

        const data = await response.json();

        console.log("3. Groq response:", data);

        const loading = document.getElementById("loading");

        if (loading) {
            loading.remove();
        }

        if (!response.ok) {

            chat.innerHTML += `
                <div class="bot">
                    ❌ Groq Error ${response.status}<br>
                    ${escapeHTML(
                        data.error?.message || "Unknown error"
                    )}
                </div>
            `;

            return;
        }

        const reply =
            data.choices?.[0]?.message?.content ||
            "No reply received.";

        chat.innerHTML += `
            <div class="bot">
                ${escapeHTML(reply)}
            </div>
        `;

        chat.scrollTop = chat.scrollHeight;

    } catch (error) {

        console.error("FETCH ERROR:", error);

        const loading = document.getElementById("loading");

        if (loading) {
            loading.remove();
        }

        chat.innerHTML += `
            <div class="bot">
                ❌ ${escapeHTML(error.message)}
            </div>
        `;
    }
}

        } else {

            chat.innerHTML += `
                <div class="bot">
                    ❌ Connection error.
                    Please try again.
                </div>
            `;
        }
    }
}


// Send button
if (sendBtn) {

    sendBtn.addEventListener("click", send);

}


// Enter key
if (input) {

    input.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

            e.preventDefault();

            send();
        }

    });

}


window.send = send;

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        send();
    }
});
