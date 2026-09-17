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

const showRegisterButton =
    document.getElementById("showRegister");

const showLoginButton =
    document.getElementById("showLogin");

const authMessage =
    document.getElementById("authMessage");

const currentUserElement =
    document.getElementById("currentUser");

const logoutButton =
    document.getElementById("logoutButton");

const userSearch =
    document.getElementById("userSearch");

const searchResults =
    document.getElementById("searchResults");

const chatList =
    document.getElementById("chatList");

const welcome =
    document.getElementById("welcome");

const chatWindow =
    document.getElementById("chatWindow");

const chatTitle =
    document.getElementById("chatTitle");

const chatStatus =
    document.getElementById("chatStatus");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");


/* =========================
   VARIABLES
========================= */

let currentUser = null;
let currentProfile = null;

let currentConversationId = null;
let currentOtherUser = null;

let unsubscribeMessages = null;
let unsubscribeChats = null;

let creatingAccount = false;


/* =========================
   MENSAJE DE AUTENTICACIÓN
========================= */

function showAuthMessage(message, error = false) {

    authMessage.textContent = message;

    if (error) {
        authMessage.style.color = "#ff4d4d";
    } else {
        authMessage.style.color = "";
    }
}


/* =========================
   MOSTRAR APP
========================= */

function showApp() {

    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
}


/* =========================
   MOSTRAR LOGIN
========================= */

function showAuth() {

    app.classList.add("hidden");
    authScreen.classList.remove("hidden");
}


/* =========================
   CAMBIAR FORMULARIOS
========================= */

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


showRegisterButton.addEventListener(
    "click",
    showRegisterForm
);


showLoginButton.addEventListener(
    "click",
    showLoginForm
);


/* =========================
   REGISTRO
========================= */

async function register() {

    const email =
        registerEmail.value.trim();

    const username =
        registerUsername.value.trim();

    const password =
        registerPassword.value;

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

    showAuthMessage(
        "Creando cuenta..."
    );

    try {

        console.log(
            "PASO 1: Creando cuenta en Authentication..."
        );

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;

        console.log(
            "PASO 2: Authentication OK"
        );

        console.log(
            "UID:",
            user.uid
        );

        console.log(
            "PASO 3: Creando perfil en Firestore..."
        );

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        await setDoc(
            userRef,
            {
                username:
                    username,

                usernameLower:
                    username.toLowerCase(),

                email:
                    email,

                createdAt:
                    serverTimestamp()
            }
        );

        console.log(
            "PASO 4: Firestore OK"
        );

        currentUser = user;

        currentProfile = {
            username:
                username,

            usernameLower:
                username.toLowerCase(),

            email:
                email
        };

        registerEmail.value = "";
        registerUsername.value = "";
        registerPassword.value = "";

        showAuthMessage(
            "¡Cuenta creada correctamente!"
        );

        await enterApp();

    } catch (error) {

        console.error(
            "========== ERROR FIREBASE =========="
        );

        console.error(
            "Código:",
            error.code
        );

        console.error(
            "Mensaje:",
            error.message
        );

        console.error(
            "Error completo:",
            error
        );

        console.error(
            "===================================="
        );

        let message =
            "ERROR REAL: " +
            error.code +
            " | " +
            error.message;

        showAuthMessage(
            message,
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

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;

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

    showAuthMessage(
        "Iniciando sesión..."
    );

    try {

        console.log(
            "LOGIN PASO 1: Authentication..."
        );

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            userCredential.user;

        console.log(
            "LOGIN PASO 2: Authentication OK"
        );

        console.log(
            "UID:",
            user.uid
        );

        console.log(
            "LOGIN PASO 3: Buscando perfil..."
        );

        const userSnapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );

        console.log(
            "LOGIN PASO 4: Perfil existe:",
            userSnapshot.exists()
        );

        if (!userSnapshot.exists()) {

            showAuthMessage(
                "La cuenta existe, pero no tiene perfil en Firestore.",
                true
            );

            return;
        }

        currentUser = user;

        currentProfile =
            userSnapshot.data();

        console.log(
            "LOGIN PASO 5: Perfil:",
            currentProfile
        );

        currentUserElement.textContent =
            "@" +
            currentProfile.username;

        showApp();

        console.log(
            "LOGIN PASO 6: App abierta"
        );

        await loadConversations();

    } catch (error) {

        console.error(
            "========== ERROR LOGIN =========="
        );

        console.error(
            "Código:",
            error.code
        );

        console.error(
            "Mensaje:",
            error.message
        );

        console.error(
            "Error completo:",
            error
        );

        console.error(
            "================================="
        );

        let message =
            "ERROR LOGIN: " +
            error.code +
            " | " +
            error.message;

        showAuthMessage(
            message,
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


/* =========================
   ENTER LOGIN
========================= */

loginPassword.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            login();
        }
    }
);


/* =========================
   ENTER REGISTRO
========================= */

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
   CARGAR PERFIL
========================= */

async function loadUserProfile(user) {

    const userSnapshot =
        await getDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );

    if (!userSnapshot.exists()) {
        return null;
    }

    return userSnapshot.data();
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
            "Error entrando a la app:",
            error
        );

        showAuthMessage(
            "Error: " +
            error.code +
            " | " +
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

            console.log(
                "Cuenta en proceso de creación..."
            );

            return;
        }

        try {

            currentProfile =
                await loadUserProfile(
                    user
                );

            if (!currentProfile) {

                console.error(
                    "No existe el perfil."
                );

                return;
            }

            await enterApp();

        } catch (error) {

            console.error(
                "Error AUTH:",
                error
            );
        }
    }
);


/* =========================
   LOGOUT
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
            currentOtherUser = null;
            currentProfile = null;

            await signOut(auth);

            chatWindow.classList.add(
                "hidden"
            );

            welcome.classList.remove(
                "hidden"
            );

            messages.innerHTML = "";
            chatList.innerHTML = "";
            searchResults.innerHTML = "";

        } catch (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );
        }
    }
);


/* =========================
   BUSCAR USUARIOS
========================= */

let searchTimeout = null;

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

    if (!text) {
        return;
    }

    if (!currentUser) {
        return;
    }

    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        const foundUsers = [];

        usersSnapshot.forEach(
            userDocument => {

                const data =
                    userDocument.data();

                if (
                    userDocument.id ===
                    currentUser.uid
                ) {
                    return;
                }

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
                '<div class="no-results">No se encontraron usuarios.</div>';

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

                element.innerHTML = `
                    <div class="search-result-name">
                        ${escapeHtml(user.username)}
                    </div>

                    <div class="search-result-email">
                        ${escapeHtml(user.email)}
                    </div>
                `;

                element.addEventListener(
                    "click",
                    () => {

                        openConversationWithUser(
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
            "Error buscando usuarios:",
            error
        );

        searchResults.innerHTML =
            `
            <div class="no-results">
                Error: ${escapeHtml(error.message)}
            </div>
            `;
    }
}


/* =========================
   ABRIR CONVERSACIÓN
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

        currentConversationId =
            conversationId;

        currentOtherUser = {
            id:
                otherUserId,

            username:
                otherUsername
        };

        chatTitle.textContent =
            otherUsername;

        chatStatus.textContent =
            "Chat";

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
            "Error abriendo conversación:",
            error
        );

        alert(
            "Error:\n" +
            error.message
        );
    }
}


/* =========================
   BUSCAR / CREAR CONVERSACIÓN
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
                members: [
                    currentUser.uid,
                    otherUserId
                ],

                createdAt:
                    serverTimestamp(),

                lastMessage:
                    "",

                lastMessageAt:
                    serverTimestamp()
            }
        );

    return newConversation.id;
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
                            messageDocument.data()
                        );
                    }
                );

                messages.scrollTop =
                    messages.scrollHeight;
            },

            error => {

                console.error(
                    "Error cargando mensajes:",
                    error
                );

                messages.innerHTML =
                    `
                    <div class="message-error">
                        Error: ${escapeHtml(error.message)}
                    </div>
                    `;
            }
        );
}


/* =========================
   MOSTRAR MENSAJE
========================= */

function displayMessage(data) {

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

    } catch (error) {

        console.error(
            "Error enviando mensaje:",
            error
        );

        alert(
            "Error enviando mensaje:\n" +
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

                        const otherUserSnapshot =
                            await getDoc(
                                doc(
                                    db,
                                    "users",
                                    otherUserId
                                )
                            );

                        if (
                            !otherUserSnapshot.exists()
                        ) {
                            continue;
                        }

                        const otherUser =
                            otherUserSnapshot.data();

                        conversations.push({
                            id:
                                conversationDocument.id,

                            username:
                                otherUser.username ||
                                "Usuario",

                            lastMessage:
                                data.lastMessage ||
                                "",

                            lastMessageAt:
                                data.lastMessageAt
                        });

                    } catch (error) {

                        console.error(
                            "Error cargando usuario:",
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
                    "Error cargando chats:",
                    error
                );

                chatList.innerHTML =
                    `
                    <div class="no-results">
                        Error: ${escapeHtml(error.message)}
                    </div>
                    `;
            }
        );
}


/* =========================
   ELEMENTO CHAT
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

    element.innerHTML = `
        <div class="chat-item-name">
            ${escapeHtml(conversation.username)}
        </div>

        <div class="chat-item-message">
            ${escapeHtml(conversation.lastMessage)}
        </div>
    `;

    element.addEventListener(
        "click",
        async () => {

            try {

                const conversationSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "conversations",
                            conversation.id
                        )
                    );

                if (
                    !conversationSnapshot.exists()
                ) {
                    return;
                }

                const data =
                    conversationSnapshot.data();

                const otherUserId =
                    data.members.find(
                        id =>
                            id !==
                            currentUser.uid
                    );

                currentConversationId =
                    conversation.id;

                currentOtherUser = {
                    id:
                        otherUserId,

                    username:
                        conversation.username
                };

                chatTitle.textContent =
                    conversation.username;

                chatStatus.textContent =
                    "Chat";

                welcome.classList.add(
                    "hidden"
                );

                chatWindow.classList.remove(
                    "hidden"
                );

                await loadMessages(
                    conversation.id
                );

                messageInput.focus();

            } catch (error) {

                console.error(
                    "Error abriendo chat:",
                    error
                );

                alert(
                    "Error:\n" +
                    error.message
                );
            }
        }
    );

    chatList.appendChild(
        element
    );
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
