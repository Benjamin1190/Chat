import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
    apiKey: "AIzaSyAQkoJ1NZ05MSHAkP2JXQlNkhg14uIulps",
    authDomain: "chat-44405.firebaseapp.com",
    projectId: "chat-44405",
    storageBucket: "chat-44405.firebasestorage.app",
    messagingSenderId: "239453189829",
    appId: "1:239453189829:web:3fa427b9f8cacae74422ac",
    measurementId: "G-TSJWY9EVS7"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


/* =========================
   CONFIGURACIÓN
========================= */

const MAX_MESSAGE_LENGTH = 1000;


/* =========================
   ELEMENTOS
========================= */

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

const showRegisterButton = document.getElementById("showRegister");
const showLoginButton = document.getElementById("showLogin");

const authMessage = document.getElementById("authMessage");

const currentUserElement = document.getElementById("currentUser");
const logoutButton = document.getElementById("logoutButton");

const userSearch = document.getElementById("userSearch");
const searchResults = document.getElementById("searchResults");

const createGroupButton = document.getElementById("createGroupButton");

const chatList = document.getElementById("chatList");

const welcome = document.getElementById("welcome");
const chatWindow = document.getElementById("chatWindow");

const chatTitle = document.getElementById("chatTitle");
const chatStatus = document.getElementById("chatStatus");

const messages = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const characterCounter = document.getElementById("characterCounter");
const sendButton = document.getElementById("sendButton");

const deleteChatButton = document.getElementById("deleteChatButton");

const groupModal = document.getElementById("groupModal");
const groupName = document.getElementById("groupName");
const groupUsers = document.getElementById("groupUsers");

const cancelGroupButton = document.getElementById("cancelGroupButton");
const confirmGroupButton = document.getElementById("confirmGroupButton");


/* =========================
   VARIABLES
========================= */

let currentUser = null;
let currentProfile = null;

let currentConversationId = null;
let currentConversationData = null;

let unsubscribeMessages = null;
let unsubscribeChats = null;

let creatingAccount = false;

let searchTimeout = null;


/* =========================
   AUTENTICACIÓN
========================= */

function showAuthMessage(message, error = false) {
    authMessage.textContent = message;

    if (error) {
        authMessage.style.color = "#ff4d4d";
    } else {
        authMessage.style.color = "";
    }
}


function showApp() {
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
}


function showAuth() {
    app.classList.add("hidden");
    authScreen.classList.remove("hidden");
}


function showLoginForm() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    showAuthMessage("");
}


function showRegisterForm() {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    showAuthMessage("");
}


showRegisterButton.addEventListener("click", showRegisterForm);
showLoginButton.addEventListener("click", showLoginForm);


/* =========================
   REGISTRO
========================= */

async function register() {
    const email = registerEmail.value.trim();
    const username = registerUsername.value.trim();
    const password = registerPassword.value;

    if (!email) {
        showAuthMessage(
            "Escribe tu correo electrónico.",
            true
        );
        return;
    }

    if (!username) {
        showAuthMessage(
            "Escribe un nombre de usuario.",
            true
        );
        return;
    }

    if (username.length < 3) {
        showAuthMessage(
            "El usuario debe tener al menos 3 caracteres.",
            true
        );
        return;
    }

    if (!password) {
        showAuthMessage(
            "Escribe una contraseña.",
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
    creatingAccount = true;

    showAuthMessage("Creando cuenta...");

    try {
        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        const usernameLower =
            username.toLowerCase();

        await setDoc(
            doc(db, "users", user.uid),
            {
                username: username,
                usernameLower: usernameLower,
                email: email,
                createdAt: serverTimestamp()
            }
        );

        currentUser = user;

        currentProfile = {
            username: username,
            usernameLower: usernameLower,
            email: email
        };

        registerEmail.value = "";
        registerUsername.value = "";
        registerPassword.value = "";

        await enterApp();

    } catch (error) {
        console.error("ERROR REGISTRO:", error);

        showAuthMessage(
            getFirebaseErrorMessage(error),
            true
        );

    } finally {
        registerButton.disabled = false;
        creatingAccount = false;
    }
}


registerButton.addEventListener(
    "click",
    register
);


/* =========================
   LOGIN
========================= */

async function login() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

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

    showAuthMessage("Iniciando sesión...");

    try {
        console.log("LOGIN 1: Authentication");

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        console.log("LOGIN 2: Authentication OK");

        currentUser = userCredential.user;

        console.log(
            "UID:",
            currentUser.uid
        );

        console.log(
            "LOGIN 3: Buscando perfil"
        );

        const userSnapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                )
            );

        console.log(
            "LOGIN 4: Perfil existe:",
            userSnapshot.exists()
        );

        if (!userSnapshot.exists()) {
            showAuthMessage(
                "La cuenta existe, pero no tiene perfil.",
                true
            );

            await signOut(auth);

            return;
        }

        currentProfile =
            userSnapshot.data();

        console.log(
            "LOGIN 5: Perfil cargado"
        );

        await enterApp();

        console.log(
            "LOGIN 6: Aplicación abierta"
        );

    } catch (error) {
        console.error(
            "ERROR LOGIN:",
            error
        );

        console.error(
            "CÓDIGO:",
            error.code
        );

        console.error(
            "MENSAJE:",
            error.message
        );

        showAuthMessage(
            getFirebaseErrorMessage(error),
            true
        );

    } finally {
        loginButton.disabled = false;
    }
}


loginButton.addEventListener(
    "click",
    login
);


loginPassword.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            event.preventDefault();
            login();
        }
    }
);


registerPassword.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            event.preventDefault();
            register();
        }
    }
);


/* =========================
   ERRORES FIREBASE
========================= */

function getFirebaseErrorMessage(error) {
    switch (error.code) {

        case "auth/invalid-credential":
            return "Correo o contraseña incorrectos.";

        case "auth/wrong-password":
            return "Contraseña incorrecta.";

        case "auth/user-not-found":
            return "No existe una cuenta con ese correo.";

        case "auth/invalid-email":
            return "El correo electrónico no es válido.";

        case "auth/email-already-in-use":
            return "Ese correo ya está registrado.";

        case "auth/weak-password":
            return "La contraseña debe tener al menos 6 caracteres.";

        case "auth/operation-not-allowed":
            return "Email/contraseña no está habilitado en Firebase Authentication.";

        case "auth/network-request-failed":
            return "No se pudo conectar con Firebase.";

        case "permission-denied":
            return "Firebase rechazó el acceso a Firestore.";

        default:
            return (
                error.code +
                " - " +
                error.message
            );
    }
}


/* =========================
   PERFIL
========================= */

async function loadUserProfile(user) {
    const snapshot =
        await getDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}


/* =========================
   ENTRAR A LA APP
========================= */

async function enterApp() {
    if (!currentUser) {
        return;
    }

    try {
        if (!currentProfile) {
            currentProfile =
                await loadUserProfile(
                    currentUser
                );
        }

        if (!currentProfile) {
            showAuthMessage(
                "No se encontró tu perfil.",
                true
            );
            return;
        }

        currentUserElement.textContent =
            "@" +
            currentProfile.username;

        showApp();

        await loadConversations();

    } catch (error) {
        console.error(
            "ERROR ENTRANDO:",
            error
        );

        showAuthMessage(
            "Error cargando la cuenta: " +
            error.message,
            true
        );
    }
}


/* =========================
   ESTADO AUTH
========================= */

onAuthStateChanged(
    auth,
    async user => {

        console.log(
            "AUTH STATE:",
            user
        );

        if (!user) {
            currentUser = null;
            currentProfile = null;

            showAuth();

            return;
        }

        currentUser = user;

        if (creatingAccount) {
            return;
        }

        try {
            currentProfile =
                await loadUserProfile(
                    user
                );

            if (!currentProfile) {
                console.error(
                    "No existe users/" +
                    user.uid
                );

                await signOut(auth);

                return;
            }

            await enterApp();

        } catch (error) {
            console.error(
                "ERROR AUTH:",
                error
            );
        }
    }
);


/* =========================
   CERRAR SESIÓN
========================= */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            if (unsubscribeChats) {
                unsubscribeChats();
                unsubscribeChats = null;
            }

            if (unsubscribeMessages) {
                unsubscribeMessages();
                unsubscribeMessages = null;
            }

            currentConversationId = null;
            currentConversationData = null;
            currentProfile = null;

            messages.innerHTML = "";
            chatList.innerHTML = "";
            searchResults.innerHTML = "";

            chatWindow.classList.add("hidden");
            welcome.classList.remove("hidden");

            await signOut(auth);

        } catch (error) {
            console.error(
                "ERROR LOGOUT:",
                error
            );
        }
    }
);


/* =========================
   BUSCAR USUARIOS
========================= */

userSearch.addEventListener(
    "input",
    () => {

        clearTimeout(searchTimeout);

        searchTimeout =
            setTimeout(
                searchUsers,
                300
            );
    }
);


async function searchUsers() {

    const text =
        userSearch.value
            .trim()
            .toLowerCase();

    searchResults.innerHTML = "";

    if (!text || !currentUser) {
        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        const foundUsers = [];

        snapshot.forEach(
            userDocument => {

                if (
                    userDocument.id ===
                    currentUser.uid
                ) {
                    return;
                }

                const data =
                    userDocument.data();

                const username =
                    data.username || "";

                const usernameLower =
                    data.usernameLower ||
                    username.toLowerCase();

                if (
                    usernameLower.includes(
                        text
                    )
                ) {

                    foundUsers.push({
                        id:
                            userDocument.id,

                        username:
                            username,

                        email:
                            data.email || ""
                    });
                }
            }
        );

        if (foundUsers.length === 0) {

            searchResults.innerHTML =
                `
                <div class="no-results">
                    No se encontraron usuarios.
                </div>
                `;

            return;
        }

        foundUsers.forEach(
            user => {

                const element =
                    document.createElement(
                        "div"
                    );

                element.className =
                    "search-result";

                element.innerHTML =
                    `
                    <div class="search-result-name">
                        ${escapeHtml(user.username)}
                    </div>

                    <div class="search-result-email">
                        ${escapeHtml(user.email)}
                    </div>
                    `;

                element.addEventListener(
                    "click",
                    async () => {

                        await openConversationWithUser(
                            user.id,
                            user.username
                        );

                        userSearch.value = "";

                        searchResults.innerHTML = "";
                    }
                );

                searchResults.appendChild(
                    element
                );
            }
        );

    } catch (error) {

        console.error(
            "ERROR BUSCANDO:",
            error
        );

        searchResults.innerHTML =
            `
            <div class="no-results">
                Error buscando usuarios.
            </div>
            `;
    }
}


/* =========================
   ABRIR CHAT PRIVADO
========================= */

async function openConversationWithUser(
    otherUserId,
    otherUsername
) {

    if (!currentUser) {
        return;
    }

    try {

        const conversationId =
            await findOrCreateConversation(
                otherUserId
            );

        await openConversation(
            conversationId
        );

    } catch (error) {

        console.error(
            "ERROR ABRIENDO CHAT:",
            error
        );

        alert(
            "No se pudo abrir el chat:\n" +
            error.message
        );
    }
}


/* =========================
   BUSCAR / CREAR CHAT
========================= */

async function findOrCreateConversation(
    otherUserId
) {

    const conversationsRef =
        collection(
            db,
            "conversations"
        );

    const q =
        query(
            conversationsRef,
            where(
                "members",
                "array-contains",
                currentUser.uid
            )
        );

    const snapshot =
        await getDocs(q);

    for (
        const conversationDocument
        of snapshot.docs
    ) {

        const data =
            conversationDocument.data();

        if (
            data.type === "group"
        ) {
            continue;
        }

        const members =
            data.members || [];

        if (
            members.length === 2 &&
            members.includes(
                otherUserId
            )
        ) {

            return conversationDocument.id;
        }
    }

    const newConversation =
        await addDoc(
            conversationsRef,
            {
                type: "private",

                members: [
                    currentUser.uid,
                    otherUserId
                ],

                createdAt:
                    serverTimestamp(),

                lastMessage: "",

                lastMessageAt:
                    serverTimestamp()
            }
        );

    return newConversation.id;
}


/* =========================
   ABRIR CONVERSACIÓN
========================= */

async function openConversation(
    conversationId
) {

    try {

        const conversationSnapshot =
            await getDoc(
                doc(
                    db,
                    "conversations",
                    conversationId
                )
            );

        if (
            !conversationSnapshot.exists()
        ) {
            return;
        }

        const data =
            conversationSnapshot.data();

        currentConversationId =
            conversationId;

        currentConversationData =
            data;

        if (
            data.type === "group"
        ) {

            chatTitle.textContent =
                data.name || "Grupo";

            chatStatus.textContent =
                "👥 Grupo · " +
                (data.members?.length || 0) +
                " participantes";

        } else {

            const otherUserId =
                data.members.find(
                    id =>
                        id !==
                        currentUser.uid
                );

            let username = "Usuario";

            if (otherUserId) {

                const userSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            otherUserId
                        )
                    );

                if (
                    userSnapshot.exists()
                ) {

                    const userData =
                        userSnapshot.data();

                    username =
                        userData.username ||
                        "Usuario";
                }
            }

            chatTitle.textContent =
                username;

            chatStatus.textContent =
                "Chat privado";
        }

        welcome.classList.add(
            "hidden"
        );

        chatWindow.classList.remove(
            "hidden"
        );

        await loadMessages(
            conversationId
        );

        messageInput.focus();

    } catch (error) {

        console.error(
            "ERROR ABRIENDO CONVERSACIÓN:",
            error
        );

        alert(
            "No se pudo abrir la conversación:\n" +
            error.message
        );
    }
}


/* =========================
   CARGAR MENSAJES
========================= */

async function loadMessages(
    conversationId
) {

    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }

    messages.innerHTML = "";

    const messagesRef =
        collection(
            db,
            "conversations",
            conversationId,
            "messages"
        );

    const q =
        query(
            messagesRef,
            orderBy(
                "createdAt",
                "asc"
            )
        );

    unsubscribeMessages =
        onSnapshot(
            q,
            snapshot => {

                messages.innerHTML = "";

                snapshot.forEach(
                    messageDocument => {

                        displayMessage(
                            messageDocument.id,
                            messageDocument.data()
                        );
                    }
                );

                messages.scrollTop =
                    messages.scrollHeight;
            },

            error => {

                console.error(
                    "ERROR MENSAJES:",
                    error
                );

                messages.innerHTML =
                    `
                    <div class="message-error">
                        No se pudieron cargar los mensajes.
                    </div>
                    `;
            }
        );
}


/* =========================
   MOSTRAR MENSAJE
========================= */

function displayMessage(
    messageId,
    data
) {

    const element =
        document.createElement(
            "div"
        );

    const isMine =
        data.senderId ===
        currentUser.uid;

    element.className =
        isMine
            ? "message mine"
            : "message other";

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    content.textContent =
        data.content || "";

    element.appendChild(
        content
    );

    if (data.createdAt) {

        const date =
            data.createdAt.toDate();

        const time =
            date.toLocaleTimeString(
                "es-UY",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        const timeElement =
            document.createElement(
                "div"
            );

        timeElement.className =
            "message-time";

        timeElement.textContent =
            time;

        element.appendChild(
            timeElement
        );
    }

    if (isMine) {

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.className =
            "delete-message-button";

        deleteButton.textContent =
            "🗑️";

        deleteButton.title =
            "Eliminar mensaje";

        deleteButton.addEventListener(
            "click",
            async event => {

                event.stopPropagation();

                const confirmed =
                    confirm(
                        "¿Eliminar este mensaje?"
                    );

                if (!confirmed) {
                    return;
                }

                try {

                    await deleteDoc(
                        doc(
                            db,
                            "conversations",
                            currentConversationId,
                            "messages",
                            messageId
                        )
                    );

                } catch (error) {

                    console.error(
                        "ERROR ELIMINANDO MENSAJE:",
                        error
                    );

                    alert(
                        "No se pudo eliminar el mensaje:\n" +
                        error.message
                    );
                }
            }
        );

        element.appendChild(
            deleteButton
        );
    }

    messages.appendChild(
        element
    );
}


/* =========================
   ENVIAR MENSAJE
========================= */

async function sendMessage() {

    const content =
        messageInput.value.trim();

    if (!content) {
        return;
    }

    if (content.length > MAX_MESSAGE_LENGTH) {

        alert(
            "El mensaje no puede superar los " +
            MAX_MESSAGE_LENGTH +
            " caracteres."
        );

        return;
    }

    if (!currentUser) {
        return;
    }

    if (!currentConversationId) {
        return;
    }

    sendButton.disabled = true;

    try {

        const messagesRef =
            collection(
                db,
                "conversations",
                currentConversationId,
                "messages"
            );

        await addDoc(
            messagesRef,
            {
                senderId:
                    currentUser.uid,

                content:
                    content,

                createdAt:
                    serverTimestamp()
            }
        );

        await setDoc(
            doc(
                db,
                "conversations",
                currentConversationId
            ),
            {
                lastMessage:
                    content,

                lastMessageAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        messageInput.value = "";

        updateCharacterCounter();

    } catch (error) {

        console.error(
            "ERROR ENVIANDO:",
            error
        );

        alert(
            "No se pudo enviar el mensaje:\n" +
            error.message
        );

    } finally {

        sendButton.disabled = false;

        messageInput.focus();
    }
}


sendButton.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


/* =========================
   CONTADOR
========================= */

function updateCharacterCounter() {

    const length =
        messageInput.value.length;

    characterCounter.textContent =
        length +
        " / " +
        MAX_MESSAGE_LENGTH;

    if (
        length >=
        MAX_MESSAGE_LENGTH
    ) {

        characterCounter.style.color =
            "#ff4d4d";

    } else {

        characterCounter.style.color =
            "";
    }
}


messageInput.addEventListener(
    "input",
    updateCharacterCounter
);

updateCharacterCounter();


/* =========================
   CARGAR CHATS
========================= */

async function loadConversations() {

    if (!currentUser) {
        return;
    }

    if (unsubscribeChats) {
        unsubscribeChats();
        unsubscribeChats = null;
    }

    const conversationsRef =
        collection(
            db,
            "conversations"
        );

    const q =
        query(
            conversationsRef,
            where(
                "members",
                "array-contains",
                currentUser.uid
            )
        );

    unsubscribeChats =
        onSnapshot(
            q,
            async snapshot => {

                chatList.innerHTML = "";

                const conversations = [];

                for (
                    const conversationDocument
                    of snapshot.docs
                ) {

                    const data =
                        conversationDocument.data();

                    const members =
                        data.members || [];

                    if (
                        data.type === "group"
                    ) {

                        conversations.push({
                            id:
                                conversationDocument.id,

                            username:
                                data.name ||
                                "Grupo",

                            lastMessage:
                                data.lastMessage ||
                                "",

                            lastMessageAt:
                                data.lastMessageAt,

                            type:
                                "group"
                        });

                        continue;
                    }

                    const otherUserId =
                        members.find(
                            id =>
                                id !==
                                currentUser.uid
                        );

                    if (!otherUserId) {
                        continue;
                    }

                    try {

                        const userSnapshot =
                            await getDoc(
                                doc(
                                    db,
                                    "users",
                                    otherUserId
                                )
                            );

                        if (
                            !userSnapshot.exists()
                        ) {
                            continue;
                        }

                        const userData =
                            userSnapshot.data();

                        conversations.push({
                            id:
                                conversationDocument.id,

                            username:
                                userData.username ||
                                "Usuario",

                            lastMessage:
                                data.lastMessage ||
                                "",

                            lastMessageAt:
                                data.lastMessageAt,

                            type:
                                "private"
                        });

                    } catch (error) {

                        console.error(
                            "ERROR CARGANDO USUARIO:",
                            error
                        );
                    }
                }

                conversations.sort(
                    (a, b) => {

                        if (
                            !a.lastMessageAt &&
                            !b.lastMessageAt
                        ) {
                            return 0;
                        }

                        if (!a.lastMessageAt) {
                            return 1;
                        }

                        if (!b.lastMessageAt) {
                            return -1;
                        }

                        return (
                            b.lastMessageAt.toMillis() -
                            a.lastMessageAt.toMillis()
                        );
                    }
                );

                conversations.forEach(
                    conversation => {

                        createChatElement(
                            conversation
                        );
                    }
                );
            },

            error => {

                console.error(
                    "ERROR CARGANDO CHATS:",
                    error
                );

                chatList.innerHTML =
                    `
                    <div class="no-results">
                        No se pudieron cargar los chats.
                    </div>
                    `;
            }
        );
}


/* =========================
   ELEMENTO DE CHAT
========================= */

function createChatElement(
    conversation
) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "chat-item";

    const icon =
        conversation.type === "group"
            ? "👥"
            : "👤";

    element.innerHTML =
        `
        <div class="chat-item-name">
            ${icon}
            ${escapeHtml(conversation.username)}
        </div>

        <div class="chat-item-message">
            ${escapeHtml(conversation.lastMessage)}
        </div>
        `;

    element.addEventListener(
        "click",
        async () => {

            await openConversation(
                conversation.id
            );
        }
    );

    chatList.appendChild(
        element
    );
}


/* =========================
   ELIMINAR CHAT
========================= */

deleteChatButton.addEventListener(
    "click",
    async () => {

        if (!currentConversationId) {
            return;
        }

        const confirmed =
            confirm(
                "¿Eliminar este chat?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteDoc(
                doc(
                    db,
                    "conversations",
                    currentConversationId
                )
            );

            if (unsubscribeMessages) {

                unsubscribeMessages();

                unsubscribeMessages = null;
            }

            currentConversationId = null;
            currentConversationData = null;

            messages.innerHTML = "";

            chatWindow.classList.add(
                "hidden"
            );

            welcome.classList.remove(
                "hidden"
            );

        } catch (error) {

            console.error(
                "ERROR ELIMINANDO CHAT:",
                error
            );

            alert(
                "No se pudo eliminar el chat:\n" +
                error.message
            );
        }
    }
);


/* =========================
   MODAL GRUPO
========================= */

createGroupButton.addEventListener(
    "click",
    openGroupModal
);


cancelGroupButton.addEventListener(
    "click",
    closeGroupModal
);


async function openGroupModal() {

    groupName.value = "";

    groupUsers.innerHTML = "";

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        let found = false;

        snapshot.forEach(
            userDocument => {

                if (
                    userDocument.id ===
                    currentUser.uid
                ) {
                    return;
                }

                found = true;

                const data =
                    userDocument.data();

                const label =
                    document.createElement(
                        "label"
                    );

                label.className =
                    "group-user";

                label.innerHTML =
                    `
                    <input
                        type="checkbox"
                        value="${userDocument.id}"
                    >

                    <span>
                        ${escapeHtml(
                            data.username ||
                            "Usuario"
                        )}
                    </span>
                    `;

                groupUsers.appendChild(
                    label
                );
            }
        );

        if (!found) {

            groupUsers.innerHTML =
                `
                <div class="no-results">
                    No hay otros usuarios registrados.
                </div>
                `;
        }

        groupModal.classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(
            "ERROR CARGANDO USUARIOS:",
            error
        );

        alert(
            "No se pudieron cargar los usuarios."
        );
    }
}


function closeGroupModal() {

    groupModal.classList.add(
        "hidden"
    );
}


confirmGroupButton.addEventListener(
    "click",
    createGroup
);


/* =========================
   CREAR GRUPO
========================= */

async function createGroup() {

    const name =
        groupName.value.trim();

    if (!name) {

        alert(
            "Escribe un nombre para el grupo."
        );

        return;
    }

    const selectedUsers =
        Array.from(
            groupUsers.querySelectorAll(
                'input[type="checkbox"]:checked'
            )
        ).map(
            checkbox =>
                checkbox.value
        );

    if (
        selectedUsers.length === 0
    ) {

        alert(
            "Selecciona al menos un usuario."
        );

        return;
    }

    confirmGroupButton.disabled =
        true;

    try {

        const members = [
            currentUser.uid,
            ...selectedUsers
        ];

        const groupReference =
            await addDoc(
                collection(
                    db,
                    "conversations"
                ),
                {
                    type:
                        "group",

                    name:
                        name,

                    ownerId:
                        currentUser.uid,

                    members:
                        members,

                    createdAt:
                        serverTimestamp(),

                    lastMessage:
                        "",

                    lastMessageAt:
                        serverTimestamp()
                }
            );

        closeGroupModal();

        await openConversation(
            groupReference.id
        );

    } catch (error) {

        console.error(
            "ERROR CREANDO GRUPO:",
            error
        );

        alert(
            "No se pudo crear el grupo:\n" +
            error.message
        );

    } finally {

        confirmGroupButton.disabled =
            false;
    }
}


/* =========================
   ESCAPAR HTML
========================= */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text || "";

    return div.innerHTML;
}
