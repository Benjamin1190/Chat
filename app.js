const SUPABASE_URL = "https://snmgcfejfeqiheimoyna.supabase.co";
const SUPABASE_KEY = "sb_publishable_J457xhtv1ST-TrStmuvnqQ_Fi6OTtN5";

const { createClient } = supabase;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let currentConversation = null;
let realtimeChannel = null;

// ================================
// ELEMENTOS
// ================================

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const searchInput = document.getElementById("searchInput");
const userResults = document.getElementById("userResults");

const chatList = document.getElementById("chatList");

const chatTitle = document.getElementById("chatTitle");
const messages = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const imageInput = document.getElementById("imageInput");
const imageButton = document.getElementById("imageButton");

const logoutButton = document.getElementById("logoutButton");

// ================================
// EMAIL INTERNO
// ================================

function makeInternalEmail(username) {
    return username.trim().toLowerCase() + "@example.com";
}

// ================================
// UTILIDADES
// ================================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showAuth() {
    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
}

function showApp() {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
}

function setMessage(element, text, error = false) {
    if (!element) return;

    element.textContent = text;
    element.style.color = error ? "#ff5c5c" : "#25d366";
}

function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// ================================
// REGISTRO
// ================================

registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = registerUsername.value.trim().toLowerCase();
    const password = registerPassword.value;

    setMessage(registerMessage, "");

    if (!validateUsername(username)) {
        setMessage(
            registerMessage,
            "El usuario debe tener entre 3 y 20 caracteres y solo usar letras, números o _.",
            true
        );
        return;
    }

    if (password.length < 6) {
        setMessage(
            registerMessage,
            "La contraseña debe tener al menos 6 caracteres.",
            true
        );
        return;
    }

    try {
        // Comprobar si el nombre ya existe
        const { data: existingProfile, error: profileError } = await db
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();

        if (profileError) {
            console.error(profileError);

            setMessage(
                registerMessage,
                "Error comprobando el usuario.",
                true
            );

            return;
        }

        if (existingProfile) {
            setMessage(
                registerMessage,
                "Ese nombre de usuario ya existe.",
                true
            );

            return;
        }

        const email = makeInternalEmail(username);

        const { data, error } = await db.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);

            setMessage(
                registerMessage,
                error.message,
                true
            );

            return;
        }

        if (!data.user) {
            setMessage(
                registerMessage,
                "No se pudo crear la cuenta.",
                true
            );

            return;
        }

        // Crear perfil
        const { error: profileInsertError } = await db
            .from("profiles")
            .insert({
                id: data.user.id,
                username: username
            });

        if (profileInsertError) {
            console.error(profileInsertError);

            setMessage(
                registerMessage,
                "La cuenta se creó, pero no se pudo crear el perfil.",
                true
            );

            return;
        }

        if (!data.session) {
            setMessage(
                registerMessage,
                "Cuenta creada. Si no entra automáticamente, desactiva Confirm email en Supabase.",
                true
            );

            return;
        }

        currentUser = data.user;

        await loadCurrentProfile();

        showApp();

        await loadChats();

    } catch (error) {
        console.error(error);

        setMessage(
            registerMessage,
            "Ocurrió un error inesperado.",
            true
        );
    }
});

// ================================
// LOGIN
// ================================

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = loginUsername.value.trim().toLowerCase();
    const password = loginPassword.value;

    setMessage(loginMessage, "");

    if (!validateUsername(username)) {
        setMessage(
            loginMessage,
            "Usuario inválido.",
            true
        );

        return;
    }

    try {
        const email = makeInternalEmail(username);

        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);

            setMessage(
                loginMessage,
                "Usuario o contraseña incorrectos.",
                true
            );

            return;
        }

        currentUser = data.user;

        await loadCurrentProfile();

        showApp();

        await loadChats();

    } catch (error) {
        console.error(error);

        setMessage(
            loginMessage,
            "Ocurrió un error inesperado.",
            true
        );
    }
});

// ================================
// CARGAR PERFIL
// ================================

async function loadCurrentProfile() {
    if (!currentUser) return;

    const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error("Error cargando perfil:", error);
        return;
    }

    currentProfile = data;
}

// ================================
// CERRAR SESIÓN
// ================================

logoutButton?.addEventListener("click", async () => {
    await db.auth.signOut();

    currentUser = null;
    currentProfile = null;
    currentConversation = null;

    if (realtimeChannel) {
        await db.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    showAuth();

    loginPassword.value = "";
});

// ================================
// BUSCAR USUARIOS
// ================================

searchInput?.addEventListener("input", async () => {
    const search = searchInput.value.trim().toLowerCase();

    userResults.innerHTML = "";

    if (!search) {
        userResults.classList.add("hidden");
        return;
    }

    const { data, error } = await db
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${search}%`)
        .neq("id", currentUser.id)
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        userResults.innerHTML = `
            <div class="empty">
                No se encontraron usuarios
            </div>
        `;

        userResults.classList.remove("hidden");

        return;
    }

    data.forEach(user => {
        const item = document.createElement("div");

        item.className = "user-result";

        item.innerHTML = `
            <div class="avatar">
                ${escapeHTML(user.username.charAt(0).toUpperCase())}
            </div>

            <div class="user-result-name">
                ${escapeHTML(user.username)}
            </div>
        `;

        item.addEventListener("click", () => {
            createPrivateConversation(user.id, user.username);
        });

        userResults.appendChild(item);
    });

    userResults.classList.remove("hidden");
});

// ================================
// CREAR CHAT PRIVADO
// ================================

async function createPrivateConversation(otherUserId, otherUsername) {
    try {
        userResults.classList.add("hidden");
        searchInput.value = "";

        // Buscar conversaciones del usuario actual
        const { data: myMemberships, error: membershipsError } = await db
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", currentUser.id);

        if (membershipsError) {
            console.error(membershipsError);
            alert("No se pudieron cargar las conversaciones.");
            return;
        }

        const conversationIds =
            myMemberships?.map(item => item.conversation_id) || [];

        if (conversationIds.length > 0) {
            const { data: existingMembers, error } = await db
                .from("conversation_members")
                .select("conversation_id, user_id")
                .in("conversation_id", conversationIds);

            if (!error && existingMembers) {
                const grouped = {};

                existingMembers.forEach(member => {
                    if (!grouped[member.conversation_id]) {
                        grouped[member.conversation_id] = [];
                    }

                    grouped[member.conversation_id].push(member.user_id);
                });

                for (const conversationId of conversationIds) {
                    const members = grouped[conversationId] || [];

                    if (
                        members.length === 2 &&
                        members.includes(currentUser.id) &&
                        members.includes(otherUserId)
                    ) {
                        await openConversation(
                            conversationId,
                            otherUsername
                        );

                        await loadChats();

                        return;
                    }
                }
            }
        }

        // Crear conversación
        const { data: conversation, error: conversationError } = await db
            .from("conversations")
            .insert({
                name: null,
                is_group: false,
                created_by: currentUser.id
            })
            .select()
            .single();

        if (conversationError) {
            console.error(conversationError);

            alert("No se pudo crear el chat.");

            return;
        }

        // Añadir los dos miembros
        const { error: membersError } = await db
            .from("conversation_members")
            .insert([
                {
                    conversation_id: conversation.id,
                    user_id: currentUser.id
                },
                {
                    conversation_id: conversation.id,
                    user_id: otherUserId
                }
            ]);

        if (membersError) {
            console.error(membersError);

            alert("No se pudieron añadir los usuarios al chat.");

            return;
        }

        await loadChats();

        await openConversation(
            conversation.id,
            otherUsername
        );

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error creando el chat.");
    }
}

// ================================
// CARGAR CHATS
// ================================

async function loadChats() {
    if (!currentUser) return;

    chatList.innerHTML = "";

    const { data: memberships, error } = await db
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error("Error cargando membresías:", error);
        return;
    }

    if (!memberships || memberships.length === 0) {
        chatList.innerHTML = `
            <div class="empty">
                No tienes chats todavía.<br>
                Busca un usuario para empezar.
            </div>
        `;

        return;
    }

    for (const membership of memberships) {
        const conversationId = membership.conversation_id;

        const { data: members, error: membersError } = await db
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conversationId);

        if (membersError) {
            console.error(membersError);
            continue;
        }

        if (!members) continue;

        const otherMember = members.find(
            member => member.user_id !== currentUser.id
        );

        if (!otherMember) continue;

        const { data: profile, error: profileError } = await db
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", otherMember.user_id)
            .single();

        if (profileError || !profile) continue;

        const item = document.createElement("div");

        item.className = "chat-item";

        item.innerHTML = `
            <div class="avatar">
                ${escapeHTML(profile.username.charAt(0).toUpperCase())}
            </div>

            <div class="chat-item-info">
                <div class="chat-item-name">
                    ${escapeHTML(profile.username)}
                </div>

                <div class="chat-item-preview">
                    Chat privado
                </div>
            </div>
        `;

        item.addEventListener("click", () => {
            openConversation(
                conversationId,
                profile.username
            );
        });

        chatList.appendChild(item);
    }
}

// ================================
// ABRIR CONVERSACIÓN
// ================================

async function openConversation(conversationId, username) {
    currentConversation = conversationId;

    chatTitle.textContent = username;

    messages.innerHTML = "";

    await loadMessages();

    subscribeToMessages();
}

// ================================
// CARGAR MENSAJES
// ================================

async function loadMessages() {
    if (!currentConversation) return;

    const { data, error } = await db
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversation)
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error("Error cargando mensajes:", error);

        return;
    }

    messages.innerHTML = "";

    if (!data || data.length === 0) {
        messages.innerHTML = `
            <div class="empty">
                No hay mensajes todavía.
            </div>
        `;

        return;
    }

    data.forEach(message => {
        renderMessage(message);
    });

    scrollMessages();
}

// ================================
// MOSTRAR MENSAJE
// ================================

function renderMessage(message) {
    const empty = messages.querySelector(".empty");

    if (empty) {
        empty.remove();
    }

    const element = document.createElement("div");

    element.className =
        "message " +
        (message.sender_id === currentUser.id ? "mine" : "");

    let content = "";

    if (message.content) {
        content += `
            <div class="message-text">
                ${escapeHTML(message.content)}
            </div>
        `;
    }

    if (message.image_path) {
        const imageUrl = db.storage
            .from("chat-images")
            .getPublicUrl(message.image_path);

        content += `
            <img
                class="message-image"
                src="${imageUrl.data.publicUrl}"
                alt="Imagen"
            >
        `;
    }

    const date = new Date(message.created_at);

    const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    content += `
        <div class="message-time">
            ${time}
        </div>
    `;

    element.innerHTML = content;

    messages.appendChild(element);
}

// ================================
// SCROLL
// ================================

function scrollMessages() {
    messages.scrollTop = messages.scrollHeight;
}

// ================================
// ENVIAR MENSAJE
// ================================

async function sendMessage() {
    if (!currentConversation) {
        return;
    }

    const content = messageInput.value.trim();

    if (!content) {
        return;
    }

    sendButton.disabled = true;

    const { error } = await db
        .from("messages")
        .insert({
            conversation_id: currentConversation,
            sender_id: currentUser.id,
            content: content,
            image_path: null
        });

    sendButton.disabled = false;

    if (error) {
        console.error("Error enviando mensaje:", error);

        alert("No se pudo enviar el mensaje.");

        return;
    }

    messageInput.value = "";

    messageInput.focus();
}

sendButton?.addEventListener("click", sendMessage);

messageInput?.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        sendMessage();
    }
});

// ================================
// SUBIR IMAGEN
// ================================

imageButton?.addEventListener("click", () => {
    imageInput.click();
});

imageInput?.addEventListener("change", async () => {
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    if (!currentConversation) {
        alert("Primero abre un chat.");

        imageInput.value = "";

        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Selecciona una imagen.");

        imageInput.value = "";

        return;
    }

    try {
        const extension =
            file.name.split(".").pop().toLowerCase();

        const filename =
            `${crypto.randomUUID()}.${extension}`;

        const path =
            `${currentConversation}/${filename}`;

        const { error: uploadError } = await db
            .storage
            .from("chat-images")
            .upload(path, file);

        if (uploadError) {
            console.error(uploadError);

            alert("No se pudo subir la imagen.");

            return;
        }

        const { error: messageError } = await db
            .from("messages")
            .insert({
                conversation_id: currentConversation,
                sender_id: currentUser.id,
                content: null,
                image_path: path
            });

        if (messageError) {
            console.error(messageError);

            alert("La imagen se subió, pero no se pudo enviar.");

            return;
        }

    } catch (error) {
        console.error(error);

        alert("Ocurrió un error subiendo la imagen.");

    } finally {
        imageInput.value = "";
    }
});

// ================================
// REALTIME
// ================================

function subscribeToMessages() {
    if (realtimeChannel) {
        db.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    if (!currentConversation) {
        return;
    }

    realtimeChannel = db
        .channel(
            `messages-${currentConversation}`
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
            payload => {
                const existing = document.querySelector(
                    `[data-message-id="${payload.new.id}"]`
                );

                if (!existing) {
                    renderMessage(payload.new);
                    scrollMessages();
                }
            }
        )
        .subscribe();
}

// ================================
// SESIÓN AL CARGAR LA PÁGINA
// ================================

async function checkSession() {
    const { data, error } = await db.auth.getSession();

    if (error) {
        console.error(error);

        showAuth();

        return;
    }

    if (data.session?.user) {
        currentUser = data.session.user;

        await loadCurrentProfile();

        showApp();

        await loadChats();

    } else {
        showAuth();
    }
}

// ================================
// CAMBIOS DE AUTENTICACIÓN
// ================================

db.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
        currentUser = session.user;

        await loadCurrentProfile();

        showApp();

        await loadChats();

    } else {
        currentUser = null;
        currentProfile = null;

        showAuth();
    }
});

// ================================
// INICIAR
// ================================

checkSession();
