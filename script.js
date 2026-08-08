const API_KEY = "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";
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

    const message = input.value.trim();

    if (!message) return;

    if (!currentUser) {
        alert("Please login first.");
        return;
    }


    // Show user message
    chat.innerHTML += `
        <div class="user">
            ${escapeHTML(message)}
        </div>
    `;

    input.value = "";

    chat.innerHTML += `
        <div class="bot" id="loading">
            🤖 Thinking...
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;


    try {

        // Save user's message
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


        // Ask Groq
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
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


        const data = await response.json();


        const loading = document.getElementById("loading");

        if (loading) {
            loading.remove();
        }


        let reply = "Sorry, I couldn't generate a response.";


        if (
            data.choices &&
            data.choices.length > 0 &&
            data.choices[0].message
        ) {
            reply = data.choices[0].message.content;
        }


        // Show AI response
        chat.innerHTML += `
            <div class="bot">
                ${escapeHTML(reply)}
            </div>
        `;


        // Save AI response
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


        chat.scrollTop = chat.scrollHeight;


    } catch (error) {

        const loading = document.getElementById("loading");

        if (loading) {
            loading.remove();
        }

        console.error("Chat error:", error);

        chat.innerHTML += `
            <div class="bot">
                ⚠️ Something went wrong. Please try again.
            </div>
        `;

        chat.scrollTop = chat.scrollHeight;
    }
}


window.send = send;
