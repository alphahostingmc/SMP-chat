// EDIT YOUR WHITELIST HERE (Keep usernames lowercase)
const ALLOWED_PLAYERS = ["co0ka", "swiftech08", "allhailtiamat666", "irefulsappy", "jacki3macki3", "alpha_jr1", "mjdino121212", "monocholy"];

let pubnub;
let currentChannel = "stable-smp";
let userMcName = "";
let userDisplayName = "";

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
        userMcName = mcUsernameOnly;
        userDisplayName = nameInput;
        
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("chat-screen").style.display = "flex";
        
        initPubNub();
    } else {
        document.getElementById("error-msg").style.display = "block";
    }
}

function initPubNub() {
    // Unlocked public cloud keys dedicated for test applications
    pubnub = new PubNub({
        publishKey: "pub-c-4860df1a-fae1-4560-8438-bbcd37cb4208",
        subscribeKey: "sub-c-1191079d-3f04-4df8-8094-0ebfef7cb4bc",
        userId: "user-" + Math.random().toString(36).substring(2, 11)
    });

    pubnub.addListener({
        message: function(event) {
            if (event.channel === currentChannel) {
                displayMessage(event.message.name, event.message.mc, event.message.text);
            }
        }
    });

    subscribeToChannel();
}

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
                displayMessage(msg.message.name, msg.message.mc, msg.message.text);
            });
        }
    } catch (error) {
        console.log("No message history found yet.");
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
        // Packages message parameters cleanly into a web package
        await pubnub.publish({
            channel: currentChannel,
            message: { 
                name: userDisplayName, 
                mc: userMcName, 
                text: text 
            }
        });
        input.value = "";
    } catch (error) {
        console.error("Message blocked by network:", error);
    }
}

function displayMessage(displayName, mcName, text) {
    const chatBox = document.getElementById("chat-box");
    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("msg-wrapper");
    
    if (mcName === userMcName) {
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
