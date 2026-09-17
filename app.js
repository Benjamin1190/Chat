const SUPABASE_URL = "https://snmgcfejfeqiheimoyna.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_J457xhtv1ST-TrStmuvnqQ_Fi6OTtN5";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


let currentUser = null;
let currentConversation = null;
let realtimeChannel = null;


/* ELEMENTOS */

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerUsername =
    document.getElementById("registerUsername");

const registerEmail =
    document.getElementById("registerEmail");

const registerPassword =
    document.getElementById("registerPassword");

const authMessage =
    document.getElementById("authMessage");

const currentUserElement =
    document.getElementById("currentUser");

const chatList =
    document.getElementById("chatList");

const userSearch =
    document.getElementById("userSearch");

const searchResults =
    document.getElementById("searchResults");

const welcome =
    document.getElementById("welcome");

const chatWindow =
    document.getElementById("chatWindow");

const chatTitle =
    document.getElementById("chatTitle");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const imageButton =
    document.getElementById("imageButton");

const imageInput =
    document.getElementById("imageInput");

const logoutButton =
    document.getElementById("logoutButton");


/* CAMBIAR LOGIN / REGISTRO */

document.getElementById("showRegister").onclick = () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    authMessage.textContent = "";
};

document.getElementById("showLogin").onclick = () => {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    authMessage.textContent = "";
};


/* REGISTRO */

document.getElementById("registerButton").onclick =
async () => {

    const username =
        registerUsername.value.trim();

    const email =
        registerEmail.value.trim();

    const password =
        registerPassword.value;

    if (!username || !email || !password) {
        authMessage.textContent =
            "Completa todos los campos.";
        return;
    }

    if (password.length < 6) {
        authMessage.textContent =
            "La contraseña debe tener al menos 6 caracteres.";
        return;
    }

    authMessage.textContent =
        "Creando cuenta...";

    const {
        data,
        error
    } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        authMessage.textContent =
            error.message;
        return;
    }

    if (!data.user) {
        authMessage.textContent =
            "No se pudo crear el usuario.";
        return;
    }

    const {
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .insert({
            id: data.user.id,
            username: username
        });

    if (profileError) {
        authMessage.textContent =
            profileError.message;
        return;
    }

    authMessage.textContent =
        "Cuenta creada. Revisa tu correo si Supabase pide confirmación.";
};


/* LOGIN */

document.getElementById("loginButton").onclick =
async () => {

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;

    if (!email || !password) {
        authMessage.textContent =
            "Completa el correo y la contraseña.";
        return;
    }

    authMessage.textContent =
        "Iniciando sesión...";

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        authMessage.textContent =
            error.message;
        return;
    }

    currentUser = data.user;

    await startApp();
};


/* SESIÓN EXISTENTE */

async function checkSession() {

    const {
        data
    } = await supabaseClient.auth.getSession();

    if (data.session) {

        currentUser =
            data.session.user;

        await startApp();

    } else {

        showLogin();

    }
}


/* MOSTRAR LOGIN */

function showLogin() {

    authScreen.classList.remove("hidden");
    app.classList.add("hidden");

}


/* INICIAR APP */

async function startApp() {

    authScreen.classList.add("hidden");
    app.classList.remove("hidden");

    const {
        data
    } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .single();

    if (data) {
        currentUserElement.textContent =
            "@" + data.username;
    }

    await loadChats();

}


/* LOGOUT */

logoutButton.onclick =
async () => {

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentConversation = null;

    showLogin();
};


/* BUSCAR USUARIOS */

let searchTimer;

userSearch.addEventListener("input", () => {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(
        searchUsers,
        300
    );

});


async function searchUsers() {

    const text =
        userSearch.value.trim();

    searchResults.innerHTML = "";

    if (!text) return;

    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${text}%`)
        .neq("id", currentUser.id)
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(user => {

        const element =
            document.createElement("div");

        element.className =
            "search-user";

        element.innerHTML = `
            <div class="avatar">
                ${escapeHtml(user.username[0].toUpperCase())}
            </div>

            <div>
                <div class="user-name">
                    ${escapeHtml(user.username)}
                </div>

                <div class="user-subtitle">
                    Crear chat
                </div>
            </div>
        `;

        element.onclick =
            () => createPrivateChat(user);

        searchResults.appendChild(element);

    });

}


/* CREAR CHAT PRIVADO */

async function createPrivateChat(user) {

    const {
        data: myMemberships,
        error
    } = await supabaseClient
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

    if (error) {
        alert(error.message);
        return;
    }

    const ids =
        myMemberships.map(
            x => x.conversation_id
        );

    if (ids.length) {

        const {
            data: possibleChats
        } = await supabaseClient
            .from("conversation_members")
            .select("conversation_id, user_id")
            .in("conversation_id", ids)
            .eq("user_id", user.id);

        if (possibleChats?.length) {

            const conversationId =
                possibleChats[0].conversation_id;

            await openConversation(
                conversationId,
                user.username
            );

            userSearch.value = "";
            searchResults.innerHTML = "";

            return;
        }
    }

    const {
        data: conversation,
        error: conversationError
    } = await supabaseClient
        .from("conversations")
        .insert({
            is_group: false,
            created_by: currentUser.id
        })
        .select()
        .single();

    if (conversationError) {
        alert(conversationError.message);
        return;
    }

    const {
        error: memberError
    } = await supabaseClient
        .from("conversation_members")
        .insert([
            {
                conversation_id: conversation.id,
                user_id: currentUser.id
            },
            {
                conversation_id: conversation.id,
                user_id: user.id
            }
        ]);

    if (memberError) {
        alert(memberError.message);
        return;
    }

    await openConversation(
        conversation.id,
        user.username
    );

    userSearch.value = "";
    searchResults.innerHTML = "";

    await loadChats();
}


/* CARGAR CHATS */

async function loadChats() {

    chatList.innerHTML = "";

    const {
        data: memberships,
        error
    } = await supabaseClient
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    for (const membership of memberships) {

        const conversationId =
            membership.conversation_id;

        const {
            data: conversation
        } = await supabaseClient
            .from("conversations")
            .select("*")
            .eq("id", conversationId)
            .single();

        if (!conversation) continue;

        let title = "Grupo";

        if (!conversation.is_group) {

            const {
                data: otherMembers
            } = await supabaseClient
                .from("conversation_members")
                .select("user_id")
                .eq("conversation_id", conversationId)
                .neq("user_id", currentUser.id);

            if (otherMembers?.length) {

                const {
                    data: profile
                } = await supabaseClient
                    .from("profiles")
                    .select("username")
                    .eq(
                        "id",
                        otherMembers[0].user_id
                    )
                    .single();

                if (profile) {
                    title = profile.username;
                }
            }

        } else {

            title =
                conversation.name ||
                "Grupo";

        }

        const item =
            document.createElement("div");

        item.className =
            "chat-item";

        item.innerHTML = `
            <div class="avatar">
                ${escapeHtml(title[0].toUpperCase())}
            </div>

            <div>
                <div class="user-name">
                    ${escapeHtml(title)}
                </div>

                <div class="user-subtitle">
                    Abrir conversación
                </div>
            </div>
        `;

        item.onclick =
            () => openConversation(
                conversationId,
                title
            );

        chatList.appendChild(item);
    }
}


/* ABRIR CHAT */

async function openConversation(
    conversationId,
    title
) {

    currentConversation =
        conversationId;

    welcome.classList.add("hidden");
    chatWindow.classList.remove("hidden");

    chatTitle.textContent =
        title;

    messages.innerHTML = "";

    await loadMessages();

    subscribeMessages();

    messageInput.focus();
}


/* CARGAR MENSAJES */

async function loadMessages() {

    const {
        data,
        error
    } = await supabaseClient
        .from("messages")
        .select("*")
        .eq(
            "conversation_id",
            currentConversation
        )
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error(error);
        return;
    }

    messages.innerHTML = "";

    for (const message of data) {

        await renderMessage(message);

    }

    scrollMessages();
}


/* RENDER MENSAJE */

async function renderMessage(message) {

    const element =
        document.createElement("div");

    element.className =
        "message";

    if (message.sender_id === currentUser.id) {
        element.classList.add("mine");
    }

    let content = "";

    if (message.content) {
        content +=
            `<div>${escapeHtml(message.content)}</div>`;
    }

    if (message.image_path) {

        const {
            data
        } = await supabaseClient
            .storage
            .from("chat-images")
            .createSignedUrl(
                message.image_path,
                3600
            );

        if (data?.signedUrl) {

            content += `
                <img
                    src="${data.signedUrl}"
                    alt="Imagen enviada"
                >
            `;

        }
    }

    const date =
        new Date(message.created_at);

    const time =
        date.toLocaleTimeString(
            "es-UY",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    content += `
        <div class="message-time">
            ${time}
        </div>
    `;

    element.innerHTML =
        content;

    messages.appendChild(element);
}


/* ENVIAR MENSAJE */

async function sendMessage() {

    const text =
        messageInput.value.trim();

    if (!text || !currentConversation)
        return;

    messageInput.value = "";

    const {
        error
    } = await supabaseClient
        .from("messages")
        .insert({
            conversation_id:
                currentConversation,

            sender_id:
                currentUser.id,

            content:
                text
        });

    if (error) {

        console.error(error);

        alert(error.message);

        messageInput.value =
            text;
    }
}


sendButton.onclick =
    sendMessage;


messageInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* IMÁGENES */

imageButton.onclick =
    () => imageInput.click();


imageInput.onchange =
async () => {

    const file =
        imageInput.files[0];

    if (!file || !currentConversation)
        return;

    if (!file.type.startsWith("image/")) {
        alert("Solo puedes enviar imágenes.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no puede superar 5 MB.");
        return;
    }

    const extension =
        file.name.split(".").pop();

    const path =
        `${currentConversation}/${crypto.randomUUID()}.${extension}`;

    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from("chat-images")
        .upload(path, file);

    if (uploadError) {

        console.error(uploadError);

        alert(uploadError.message);

        return;
    }

    const {
        error
    } = await supabaseClient
        .from("messages")
        .insert({
            conversation_id:
                currentConversation,

            sender_id:
                currentUser.id,

            image_path:
                path
        });

    if (error) {

        console.error(error);

        alert(error.message);

    }

    imageInput.value = "";
};


/* TIEMPO REAL */

function subscribeMessages() {

    if (realtimeChannel) {

        supabaseClient
            .removeChannel(
                realtimeChannel
            );

    }

    realtimeChannel =
        supabaseClient
            .channel(
                "messages-" +
                currentConversation
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter:
                        `conversation_id=eq.${currentConversation}`
                },
                async payload => {

                    await renderMessage(
                        payload.new
                    );

                    scrollMessages();

                }
            )
            .subscribe();

}


/* SCROLL */

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;

}


/* SEGURIDAD HTML */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ARRANCAR */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        if (session && !currentUser) {

            currentUser =
                session.user;

            await startApp();

        }

        if (!session) {

            currentUser = null;

            showLogin();

        }

    }
);


checkSession();
