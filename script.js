const API_KEY = "AQ.Ab8RN6LyBRMXJjzsXUSSnHOLj0LKEvbNOdKEaAhS9QN6_WpqAgom";

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
    console.log(response.status);
    console.log(data);
    document.getElementById("loading").remove();

    if (!response.ok) {
  alert(JSON.stringify(data, null, 2));
    }

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

    chat.innerHTML += `<div class="bot">Error connecting to Gemini API.</div>`;
  }
}

window.send = send;

