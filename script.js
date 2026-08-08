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

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const message = input.value.trim();

    if (!message) return;


    // Display user message
    chat.innerHTML += `
        <div class="user">
            ${escapeHTML(message)}
        </div>
    `;

    input.value = "";

    chat.scrollTop = chat.scrollHeight;


    // Save user message
    try {

        await addDoc(
            collection(
                db,
                "users",
                currentUser.uid,
                "chats"
            ),
            {
                role: "user",
                text: message,
                time: serverTimestamp()
            }
        );

    } catch (error) {

        console.error("User message save error:", error);
    }


    // Thinking indicator
    const loading = document.createElement("div");

    loading.className = "bot";
    loading.id = "loading";
    loading.textContent = "🤖 Thinking...";

    chat.appendChild(loading);

    chat.scrollTop = chat.scrollHeight;


    try {

        const controller = new AbortController();

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
        if (loading) {
            loading.remove();
        }


        // Check API response
        if (!response.ok) {

            console.error("Groq Error:", data);

            chat.innerHTML += `
                <div class="bot">
                    ❌ Groq Error ${response.status}: 
                    ${escapeHTML(
                        data.error?.message ||
                        "Unknown API error"
                    )}
                </div>
            `;

            return;
        }


        // Get AI reply
        const reply =
            data.choices?.[0]?.message?.content ||
            "Sorry, I couldn't generate a response.";


        // Display AI reply
        chat.innerHTML += `
            <div class="bot">
                ${escapeHTML(reply)}
            </div>
        `;

        chat.scrollTop = chat.scrollHeight;


        // Save AI reply
        try {

            await addDoc(
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "chats"
                ),
                {
                    role: "bot",
                    text: reply,
                    time: serverTimestamp()
                }
            );

        } catch (error) {

            console.error(
                "AI reply save error:",
                error
            );
        }


    } catch (error) {

        if (loading) {
            loading.remove();
        }

        console.error("Connection error:", error);


        if (error.name === "AbortError") {

            chat.innerHTML += `
                <div class="bot">
                    ⏱️ The AI took too long to respond.
                    Please try again.
                </div>
            `;

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
