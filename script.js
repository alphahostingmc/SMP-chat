// EDIT YOUR WHITELIST HERE (Keep usernames lowercase)
const ALLOWED_PLAYERS = ["co0ka", "swiftech08", "allhailtiamat666", "irefulsappy", "jacki3macki3", "alpha_jr1", "mjdino121212", "monocholy"];

let pubnub;
let currentChannel = "stable-smp";
let userIdentity = "";

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const btn = document.getElementById("theme-btn");
    if (currentTheme === "light") {
        document.documentElement.removeAttribute("data-theme");
        btn.innerText = "☀️ Light Mode";
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        btn.innerText = "🌙 Dark Mode";
    }
}

function attemptLogin() {
    const mcUsernameOnly = document.getElementById("mc-username").value.trim().toLowerCase();
    const nameInput = document.getElementById("first-name").value.trim();

    if (!mcUsernameOnly || !nameInput) return;

    if (ALLOWED_PLAYERS.includes(mcUsernameOnly)) {
        userIdentity = nameInput + "::" + mcUsernameOnly;
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("chat-screen").style.display = "flex";
        initPubNub();
    } else {
        document.getElementById("error-msg").style.display = "block";
    }
}

function initPubNub() {
    pubnub = new PubNub({
        publishKey: "pub-c-a7a2fa71-c006-4448-a0e2-63ab7a94f57c",
        subscribeKey: "sub-c-5cb16b5a-ced8-4903-8d91-ec15e0242bc0",
        userId: "user-" + Math.random().toString(36).substr(2, 9)
    });

    pubnub.addListener({
        message: function(event) {
            if (event.channel === currentChannel) {
                displayMessage(event.message.sender, event.message.text);
            }
        }
    });

    subscribeToChannel();
}

// Fixed using async/await pattern required by the newer PubNub SDKs
async function subscribeToChannel() {
    pubnub.subscribe({ channels: [currentChannel] });
    document.getElementById("chat-box").innerHTML = ""; 
    
    try {
        const response = await pubnub.fetchMessages({
            channels: [currentChannel],
            count: 30
        });
        
        if (response && response.channels && response.channels[currentChannel]) {
            response.channels[currentChannel].forEach(msg => {
                displayMessage(msg.message.sender, msg.message.text);
            });
        }
    } catch (error) {
        console.log("History fetch skipped or empty:", error);
    }
}

async function switchChannel() {
    const selector = document.getElementById("smp-selector");
    pubnub.unsubscribe({ channels: [currentChannel] });
    currentChannel = selector.value;
    document.getElementById("chat-title").innerText = selector.options[selector.selectedIndex].text;
    await subscribeToChannel();
}

async function sendMessage() {
    const input = document.getElementById("msg-input");
    const text = input.value.trim();
    if (!text) return;

    try {
        await pubnub.publish({
            channel: currentChannel,
            message: { sender: userIdentity, text: text }
        });
        input.value = "";
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

function displayMessage(sender, text) {
    const chatBox = document.getElementById("chat-box");
    
    let displayName = "User";
    let mcName = "steve";

    if (sender && sender.includes("::")) {
        let parts = sender.split("::");
        displayName = parts[0] || "User";
        mcName = parts[1] || "steve";
    }

    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("msg-wrapper");
    if (sender === userIdentity) {
        wrapperDiv.classList.add("me");
    }

    const avatarUrl = "https://crafatar.com" + mcName + "?size=32&overlay";

    wrapperDiv.innerHTML = `
        <img class="avatar" src="${avatarUrl}" alt="${mcName}'s face">
        <div class="msg">
            <div class="meta">${displayName} (${mcName})</div>
            <div>${text}</div>
        </div>
    `;
    
    chatBox.appendChild(wrapperDiv);
    chatBox.scrollTop = chatBox.scrollHeight; 
}

function handleKeyPress(e) {
    if (e.key === "Enter") sendMessage();
}
