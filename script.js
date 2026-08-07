const API_KEY = "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";

async function send() {
  const input = document.getElementById("msg");
  const chat = document.getElementById("chat");

  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<div class="user">${message}</div>`;
  input.value = "";

  chat.innerHTML += `<div class="bot" id="loading">Thinking...</div>`;
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
});

    const data = await response.json();

let reply = "Sorry, I couldn't generate a response.";

if (
  data.choices &&
  data.choices.length > 0 &&
  data.choices[0].message
) {
  reply = data.choices[0].message.content;
}
  

    chat.innerHTML += `<div class="bot">${reply}</div>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (error) {

    const loading = document.getElementById("loading");
    if (loading) loading.remove();

    console.error(error);

    chat.innerHTML += `<div class="bot">Error connecting to Gemini API.</div>`;
  }
}

window.send = send;

