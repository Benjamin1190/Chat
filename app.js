const SUPABASE_URL = "https://snmgcfejfeqiheimoyna.supabase.co";
const SUPABASE_KEY = "sb_publishable_J457xhtv1ST-TrStmuvnqQ_Fi6OTtN5";

const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let currentUser = null;
let currentProfile = null;
let currentConversation = null;
let realtimeChannel = null;

// ========================================
// ELEMENTOS
// ========================================

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerEmail = document.getElementById("registerEmail");
const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const authMessage = document.getElementById("authMessage");

const currentUserElement = document.getElementById("currentUser");

const userSearch = document.getElementById("userSearch");
const searchResults = document.getElementById("searchResults");

const chatList = document.getElementById("chatList");

const welcome = document.getElementById("welcome");
const chatWindow = document.getElementById("chatWindow");

const chatTitle = document.getElementById("chatTitle");
const chatStatus = document.getElementById("chatStatus");

const messages = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const imageInput = document.getElementById("imageInput");
const imageButton = document.getElementById("imageButton");

const logoutButton = document.getElementById("logoutButton");

// ========================================
// MENSAJES
// ========================================

function showAuthMessage(text, error = false) {
    authMessage.textContent = text;

    authMessage.style.color = error
        ? "#ff5555"
        : "#25d366";
}

// ========================================
// LOGIN / REGISTRO
// ========================================

showRegister.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");

    showAuthMessage("");

    registerEmail.focus();
});

showLogin.addEventListener("click", () => {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    showAuthMessage("");

    loginEmail.focus();
});

// ========================================
// VALIDAR USUARIO
// ========================================

function validUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// ========================================
// REGISTRO
// ========================================

registerButton.addEventListener("click", async () => {

    const email = registerEmail.value.trim();
    const username = registerUsername.value.trim().toLowerCase();
    const password = registerPassword.value;

    showAuthMessage("");

    if (!email) {
        showAuthMessage(
            "Escribe tu correo electrónico.",
            true
        );
        return;
    }

    if (!email.includes("@")) {
        showAuthMessage(
            "Escribe un correo electrónico válido.",
            true
        );
        return;
    }

    if (!validUsername(username)) {
        showAuthMessage(
            "El nombre de usuario debe tener entre 3 y 20 caracteres y solo usar letras, números o _.",
            true
        );
        return;
    }

    if (password.length < 6) {
        showAuthMessage(
            "La contraseña debe tener al menos 6 caracteres.",
            true
        );
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Creando cuenta...";

    try {

        // Comprobar nombre de usuario
        const {
            data: existingProfile,
            error: profileCheckError
        } = await db
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();

        if (profileCheckError) {
            console.error(profileCheckError);

            showAuthMessage(
                "Error comprobando el nombre de usuario.",
                true
            );

            return;
        }

        if (existingProfile) {
            showAuthMessage(
                "Ese nombre de usuario ya existe.",
                true
            );

            return;
        }

        // Crear cuenta en Supabase Auth
        const {
            data,
            error
        } = await db.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);

            showAuthMessage(
                error.message,
                true
            );

            return;
        }

        if (!data.user) {
            showAuthMessage(
                "No se pudo crear la cuenta.",
                true
            );

            return;
        }

        // Si Confirm email está activado
        if (!data.session) {
            showAuthMessage(
                "Cuenta creada. Revisa tu correo para confirmar la cuenta.",
                false
            );

            registerEmail.value = "";
            registerUsername.value = "";
            registerPassword.value = "";

            return;
        }

        // Crear perfil
        const {
            error: profileError
        } = await db
            .from("profiles")
            .insert({
                id: data.user.id,
                username: username
            });

        if (profileError) {
            console.error(profileError);

            showAuthMessage(
                "La cuenta se creó, pero no se pudo crear el perfil.",
                true
            );

            return;
        }

        currentUser = data.user;

        await loadCurrentProfile();

        currentUserElement.textContent =
            "@" + currentProfile.username;

        authScreen.classList.add("hidden");
        app.classList.remove("hidden");

        registerEmail.value = "";
        registerUsername.value = "";
        registerPassword.value = "";

        await loadChats();

    } catch (error) {

        console.error(error);

        showAuthMessage(
            "Error inesperado: " + error.message,
            true
        );

    } finally {

        registerButton.disabled = false;
        registerButton.textContent = "Crear cuenta";
    }
});

// ========================================
// INICIAR SESIÓN
// ========================================

loginButton.addEventListener("click", async () => {

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    showAuthMessage("");

    if (!email) {
        showAuthMessage(
            "Escribe tu correo electrónico.",
            true
        );
        return;
    }

    if (!password) {
        showAuthMessage(
            "Escribe tu contraseña.",
            true
        );
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Entrando...";

    try {

        const {
            data,
            error
        } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);

            showAuthMessage(
                "Correo o contraseña incorrectos.",
                true
            );

            return;
        }

        currentUser = data.user;

        await loadCurrentProfile();

        if (!currentProfile) {
            showAuthMessage(
                "No se encontró el perfil.",
                true
            );

            return;
        }

        currentUserElement.textContent =
            "@" + currentProfile.username;

        authScreen.classList.add("hidden");
        app.classList.remove("hidden");

        loginEmail.value = "";
        loginPassword.value = "";

        await loadChats();

    } catch (error) {

        console.error(error);

        showAuthMessage(
            "Error inesperado.",
            true
        );

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Iniciar sesión";
    }
});

// ========================================
// CARGAR PERFIL
// ========================================

async function loadCurrentProfile() {

    if (!currentUser) {
        return;
    }

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error(
            "Error cargando perfil:",
            error
        );
        return;
    }

    currentProfile = data;
}

// ========================================
// CERRAR SESIÓN
// ========================================

logoutButton.addEventListener("click", async () => {

    if (realtimeChannel) {
        await db.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;
    }

    await db.auth.signOut();

    currentUser = null;
    currentProfile = null;
    currentConversation = null;

    app.classList.add("hidden");
    authScreen.classList.remove("hidden");

    loginEmail.value = "";
    loginPassword.value = "";

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    showAuthMessage("");
});

// ========================================
// BUSCAR USUARIOS
// ========================================

userSearch.addEventListener("input", async () => {

    const search = userSearch.value
        .trim()
        .toLowerCase();

    searchResults.innerHTML = "";

    if (!search) {
        searchResults.classList.add("hidden");
        return;
    }

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select(
            "id, username, avatar_url"
        )
        .ilike(
            "username",
            "%" + search + "%"
        )
        .neq(
            "id",
            currentUser.id
        )
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {

        searchResults.innerHTML = `
            <div class="empty">
                No se encontraron usuarios.
            </div>
        `;

        searchResults.classList.remove("hidden");

        return;
    }

    data.forEach(user => {

        const element =
            document.createElement("div");

        element.className =
            "user-result";

        element.innerHTML = `
            <div class="avatar">
                ${escapeHTML(
                    user.username
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <div>
                ${escapeHTML(user.username)}
            </div>
        `;

        element.addEventListener(
            "click",
            () => {
                createPrivateConversation(
                    user.id,
                    user.username
                );
            }
        );

        searchResults.appendChild(
            element
        );
    });

    searchResults.classList.remove(
        "hidden"
    );
});

// ========================================
// CREAR CHAT PRIVADO
// ========================================

async function createPrivateConversation(
    otherUserId,
    otherUsername
) {

    searchResults.classList.add(
        "hidden"
    );

    userSearch.value = "";

    try {

        const {
            data: memberships,
            error
        } = await db
            .from("conversation_members")
            .select("conversation_id")
            .eq(
                "user_id",
                currentUser.id
            );

        if (error) {
            console.error(error);

            alert(
                "No se pudieron cargar tus chats."
            );

            return;
        }

        const conversationIds =
            memberships.map(
                item =>
                    item.conversation_id
            );

        // Buscar conversación existente
        for (
            const conversationId
            of conversationIds
        ) {

            const {
                data: members
            } = await db
                .from("conversation_members")
                .select("user_id")
                .eq(
                    "conversation_id",
                    conversationId
                );

            if (!members) {
                continue;
            }

            if (
                members.length === 2 &&
                members.some(
                    member =>
                        member.user_id ===
                        currentUser.id
                ) &&
                members.some(
                    member =>
                        member.user_id ===
                        otherUserId
                )
            ) {

                await openConversation(
                    conversationId,
                    otherUsername
                );

                await loadChats();

                return;
            }
        }

        // Crear conversación
        const {
            data: conversation,
            error: conversationError
        } = await db
            .from("conversations")
            .insert({
                name: null,
                is_group: false,
                created_by: currentUser.id
            })
            .select()
            .single();

        if (conversationError) {

            console.error(
                conversationError
            );

            alert(
                "No se pudo crear el chat."
            );

            return;
        }

        // Añadir miembros
        const {
            error: membersError
        } = await db
            .from("conversation_members")
            .insert([
                {
                    conversation_id:
                        conversation.id,

                    user_id:
                        currentUser.id
                },
                {
                    conversation_id:
                        conversation.id,

                    user_id:
                        otherUserId
                }
            ]);

        if (membersError) {

            console.error(
                membersError
            );

            alert(
                "No se pudieron añadir los usuarios."
            );

            return;
        }

        await loadChats();

        await openConversation(
            conversation.id,
            otherUsername
        );

    } catch (error) {

        console.error(error);

        alert(
            "Error creando el chat."
        );
    }
}

// ========================================
// CARGAR CHATS
// ========================================

async function loadChats() {

    if (!currentUser) {
        return;
    }

    chatList.innerHTML = "";

    const {
        data: memberships,
        error
    } = await db
        .from("conversation_members")
        .select("conversation_id")
        .eq(
            "user_id",
            currentUser.id
        );

    if (error) {

        console.error(error);

        chatList.innerHTML = `
            <div class="empty">
                Error cargando chats.
            </div>
        `;

        return;
    }

    if (
        !memberships ||
        memberships.length === 0
    ) {

        chatList.innerHTML = `
            <div class="empty">
                No tienes chats todavía.
            </div>
        `;

        return;
    }

    for (
        const membership
        of memberships
    ) {

        const conversationId =
            membership.conversation_id;

        const {
            data: members,
            error: membersError
        } = await db
            .from("conversation_members")
            .select("user_id")
            .eq(
                "conversation_id",
                conversationId
            );

        if (membersError) {
            console.error(
                membersError
            );
            continue;
        }

        const other =
            members.find(
                member =>
                    member.user_id !==
                    currentUser.id
            );

        if (!other) {
            continue;
        }

        const {
            data: profile
        } = await db
            .from("profiles")
            .select(
                "username, avatar_url"
            )
            .eq(
                "id",
                other.user_id
            )
            .single();

        if (!profile) {
            continue;
        }

        const item =
            document.createElement("div");

        item.className =
            "chat-item";

        item.innerHTML = `
            <div class="avatar">
                ${escapeHTML(
                    profile.username
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <div class="chat-item-info">

                <div class="chat-item-name">
                    ${escapeHTML(
                        profile.username
                    )}
                </div>

                <div class="chat-item-preview">
                    Chat privado
                </div>

            </div>
        `;

        item.addEventListener(
            "click",
            () => {
                openConversation(
                    conversationId,
                    profile.username
                );
            }
        );

        chatList.appendChild(item);
    }
}

// ========================================
// ABRIR CONVERSACIÓN
// ========================================

async function openConversation(
    conversationId,
    username
) {

    currentConversation =
        conversationId;

    chatTitle.textContent =
        username;

    chatStatus.textContent =
        "en línea";

    welcome.classList.add(
        "hidden"
    );

    chatWindow.classList.remove(
        "hidden"
    );

    messages.innerHTML = "";

    await loadMessages();

    subscribeToMessages();

    messageInput.focus();
}

// ========================================
// CARGAR MENSAJES
// ========================================

async function loadMessages() {

    if (!currentConversation) {
        return;
    }

    const {
        data,
        error
    } = await db
        .from("messages")
        .select("*")
        .eq(
            "conversation_id",
            currentConversation
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {
        console.error(error);
        return;
    }

    messages.innerHTML = "";

    if (
        !data ||
        data.length === 0
    ) {

        messages.innerHTML = `
            <div class="empty">
                No hay mensajes todavía.
            </div>
        `;

        return;
    }

    data.forEach(
        message =>
            renderMessage(message)
    );

    scrollMessages();
}

// ========================================
// MOSTRAR MENSAJE
// ========================================

function renderMessage(message) {

    const empty =
        messages.querySelector(
            ".empty"
        );

    if (empty) {
        empty.remove();
    }

    const element =
        document.createElement("div");

    element.className =
        "message " +
        (
            message.sender_id ===
            currentUser.id
                ? "mine"
                : ""
        );

    element.dataset.messageId =
        message.id;

    let html = "";

    if (message.content) {

        html += `
            <div class="message-text">
                ${escapeHTML(
                    message.content
                )}
            </div>
        `;
    }

    if (message.image_path) {

        const {
            data
        } = db.storage
            .from("chat-images")
            .getPublicUrl(
                message.image_path
            );

        html += `
            <img
                class="message-image"
                src="${data.publicUrl}"
                alt="Imagen"
            >
        `;
    }

    const date =
        new Date(
            message.created_at
        );

    const time =
        date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    html += `
        <div class="message-time">
            ${time}
        </div>
    `;

    element.innerHTML = html;

    messages.appendChild(element);
}

// ========================================
// ESCAPAR HTML
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ========================================
// SCROLL
// ========================================

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;
}

// ========================================
// ENVIAR MENSAJE
// ========================================

async function sendMessage() {

    if (!currentConversation) {
        return;
    }

    const content =
        messageInput.value.trim();

    if (!content) {
        return;
    }

    sendButton.disabled = true;

    const {
        error
    } = await db
        .from("messages")
        .insert({
            conversation_id:
                currentConversation,

            sender_id:
                currentUser.id,

            content:
                content,

            image_path:
                null
        });

    sendButton.disabled = false;

    if (error) {

        console.error(error);

        alert(
            "No se pudo enviar el mensaje."
        );

        return;
    }

    messageInput.value = "";

    messageInput.focus();
}

// ========================================
// BOTÓN ENVIAR
// ========================================

sendButton.addEventListener(
    "click",
    sendMessage
);

// ========================================
// ENTER
// ========================================

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);

// ========================================
// BOTÓN IMAGEN
// ========================================

imageButton.addEventListener(
    "click",
    () => {
        imageInput.click();
    }
);

// ========================================
// SUBIR IMAGEN
// ========================================

imageInput.addEventListener(
    "change",
    async () => {

        const file =
            imageInput.files[0];

        if (!file) {
            return;
        }

        if (!currentConversation) {

            alert(
                "Primero abre un chat."
            );

            imageInput.value = "";

            return;
        }

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "El archivo debe ser una imagen."
            );

            imageInput.value = "";

            return;
        }

        try {

            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();

            const filename =
                crypto.randomUUID() +
                "." +
                extension;

            const path =
                currentConversation +
                "/" +
                filename;

            const {
                error: uploadError
            } = await db.storage
                .from("chat-images")
                .upload(
                    path,
                    file
                );

            if (uploadError) {

                console.error(
                    uploadError
                );

                alert(
                    "No se pudo subir la imagen."
                );

                return;
            }

            const {
                error: messageError
            } = await db
                .from("messages")
                .insert({
                    conversation_id:
                        currentConversation,

                    sender_id:
                        currentUser.id,

                    content:
                        null,

                    image_path:
                        path
                });

            if (messageError) {

                console.error(
                    messageError
                );

                alert(
                    "La imagen se subió pero no se pudo enviar."
                );

                return;
            }

        } catch (error) {

            console.error(error);

            alert(
                "Error subiendo imagen."
            );

        } finally {

            imageInput.value = "";
        }
    }
);

// ========================================
// REALTIME
// ========================================

function subscribeToMessages() {

    if (realtimeChannel) {

        db.removeChannel(
            realtimeChannel
        );

        realtimeChannel = null;
    }

    if (!currentConversation) {
        return;
    }

    realtimeChannel =
        db
            .channel(
                "chat-" +
                currentConversation
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter:
                        "conversation_id=eq." +
                        currentConversation
                },
                payload => {

                    const alreadyExists =
                        document.querySelector(
                            `[data-message-id="${payload.new.id}"]`
                        );

                    if (
                        !alreadyExists
                    ) {

                        renderMessage(
                            payload.new
                        );

                        scrollMessages();
                    }
                }
            )
            .subscribe();
}

// ========================================
// COMPROBAR SESIÓN
// ========================================

async function checkSession() {

    const {
        data,
        error
    } = await db.auth.getSession();

    if (error) {

        console.error(error);

        return;
    }

    if (
        data.session &&
        data.session.user
    ) {

        currentUser =
            data.session.user;

        await loadCurrentProfile();

        if (currentProfile) {

            currentUserElement.textContent =
                "@" +
                currentProfile.username;
        }

        authScreen.classList.add(
            "hidden"
        );

        app.classList.remove(
            "hidden"
        );

        await loadChats();

    } else {

        authScreen.classList.remove(
            "hidden"
        );

        app.classList.add(
            "hidden"
        );
    }
}

// ========================================
// CAMBIOS DE AUTENTICACIÓN
// ========================================

db.auth.onAuthStateChange(
    (event, session) => {

        if (session?.user) {
            currentUser =
                session.user;
        } else {
            currentUser = null;
        }
    }
);

// ========================================
// INICIAR
// ========================================

checkSession();
