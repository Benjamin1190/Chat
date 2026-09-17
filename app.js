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


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyAQkoJ1NZ05MSHAkP2JXQlNkhg14uIulps",
    authDomain: "chat-44405.firebaseapp.com",
    projectId: "chat-44405",
    storageBucket: "chat-44405.firebasestorage.app",
    messagingSenderId: "239453189829",
    appId: "1:239453189829:web:3fa427b9f8cacae74422ac",
    measurementId: "G-TSJWY9EVS7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ADMIN
========================================================= */

const ADMIN_USERNAME = "minibenja2016";


/* =========================================================
   VARIABLES
========================================================= */

let currentUser = null;
let currentProfile = null;

let currentConversationId = null;
let currentOtherUser = null;
let currentConversationData = null;

let creatingAccount = false;

let unsubscribeMessages = null;
let unsubscribeConversations = null;

let allUsers = [];

let selectedGroupUsers = new Set();


/* =========================================================
   DOM - AUTENTICACIÓN
========================================================= */

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const showRegisterButton = document.getElementById("showRegisterButton");
const showLoginButton = document.getElementById("showLoginButton");


/* =========================================================
   DOM - APP
========================================================= */

const currentUsername = document.getElementById("currentUsername");
const currentEmail = document.getElementById("currentEmail");

const logoutButton = document.getElementById("logoutButton");

const userSearch = document.getElementById("userSearch");
const searchResults = document.getElementById("searchResults");
const chatList = document.getElementById("chatList");

const welcomeScreen = document.getElementById("welcomeScreen");
const chatWindow = document.getElementById("chatWindow");

const chatTitle = document.getElementById("chatTitle");
const chatStatus = document.getElementById("chatStatus");

const messages = document.getElementById("messages");

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const characterCounter = document.getElementById("characterCounter");

const deleteChatButton = document.getElementById("deleteChatButton");


/* =========================================================
   DOM - GRUPOS
========================================================= */

const createGroupButton = document.getElementById("createGroupButton");

const groupModal = document.getElementById("groupModal");
const groupName = document.getElementById("groupName");
const groupUsers = document.getElementById("groupUsers");

const cancelGroupButton = document.getElementById("cancelGroupButton");
const confirmGroupButton = document.getElementById("confirmGroupButton");


/* =========================================================
   DOM - ADMIN
========================================================= */

const adminButton = document.getElementById("adminButton");

const adminPanel = document.getElementById("adminPanel");
const adminCloseButton = document.getElementById("adminCloseButton");

const adminSearch = document.getElementById("adminSearch");
const adminSyncButton = document.getElementById("adminSyncButton");
const adminSyncStatus = document.getElementById("adminSyncStatus");

const adminUsers = document.getElementById("adminUsers");
const adminEmpty = document.getElementById("adminEmpty");

const adminDetails = document.getElementById("adminDetails");

const adminDetailName = document.getElementById("adminDetailName");
const adminDetailEmail = document.getElementById("adminDetailEmail");
const adminDetailUid = document.getElementById("adminDetailUid");
const adminDetailCreated = document.getElementById("adminDetailCreated");

const adminHistory = document.getElementById("adminHistory");


/* =========================================================
   INICIO
========================================================= */

function showLogin() {
    if (loginForm) loginForm.classList.remove("hidden");
    if (registerForm) registerForm.classList.add("hidden");
}

function showRegister() {
    if (loginForm) loginForm.classList.add("hidden");
    if (registerForm) registerForm.classList.remove("hidden");
}

function showApp() {
    if (authScreen) authScreen.classList.add("hidden");
    if (appScreen) appScreen.classList.remove("hidden");
}

function showAuth() {
    if (authScreen) authScreen.classList.remove("hidden");
    if (appScreen) appScreen.classList.add("hidden");
}

function updateAdminButton() {
    if (!adminButton) return;

    if (
        currentProfile &&
        currentProfile.usernameLower === ADMIN_USERNAME.toLowerCase()
    ) {
        adminButton.classList.remove("hidden");
    } else {
        adminButton.classList.add("hidden");
    }
}


/* =========================================================
   REGISTRO
========================================================= */

async function register() {
    const username = registerUsername?.value.trim();
    const email = registerEmail?.value.trim();
    const password = registerPassword?.value;

    if (!username || !email || !password) {
        alert("Completá todos los campos.");
        return;
    }

    if (username.length < 3) {
        alert("El nombre de usuario debe tener al menos 3 caracteres.");
        return;
    }

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    creatingAccount = true;

    try {
        const usernameLower = username.toLowerCase();

        const usersSnapshot = await getDocs(
            query(
                collection(db, "users"),
                where("usernameLower", "==", usernameLower)
            )
        );

        if (!usersSnapshot.empty) {
            alert("Ese nombre de usuario ya está usado.");
            creatingAccount = false;
            return;
        }

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        await setDoc(
            doc(db, "users", user.uid),
            {
                username: username,
                usernameLower: usernameLower,
                email: email,
                createdAt: serverTimestamp()
            }
        );

        alert("Cuenta creada correctamente.");

    } catch (error) {
        console.error(error);

        alert(
            "No se pudo crear la cuenta.\n\n" +
            error.code +
            "\n" +
            error.message
        );

    } finally {
        creatingAccount = false;
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {
    const email = loginEmail?.value.trim();
    const password = loginPassword?.value;

    if (!email || !password) {
        alert("Ingresá tu correo y contraseña.");
        return;
    }

    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {
        console.error(error);

        alert(
            "No se pudo iniciar sesión.\n\n" +
            error.code +
            "\n" +
            error.message
        );
    }
}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        if (creatingAccount) {
            return;
        }

        currentUser = null;
        currentProfile = null;

        showAuth();

        return;
    }

    currentUser = user;

    try {

        const profileRef = doc(
            db,
            "users",
            user.uid
        );

        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {

            console.error("El usuario no tiene perfil.");

            alert(
                "Firebase inició sesión, pero no existe el perfil del usuario."
            );

            return;
        }

        currentProfile = profileSnap.data();

        if (currentUsername) {
            currentUsername.textContent =
                "@" + currentProfile.username;
        }

        if (currentEmail) {
            currentEmail.textContent =
                currentProfile.email || user.email || "";
        }

        updateAdminButton();

        showApp();

        await loadAllUsers();

        loadConversations();

        showWelcome();

    } catch (error) {

        console.error(error);

        alert(
            "Firebase rechazó el acceso a Firestore.\n\n" +
            error.code +
            "\n" +
            error.message
        );
    }
});


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        if (unsubscribeConversations) {
            unsubscribeConversations();
            unsubscribeConversations = null;
        }

        currentConversationId = null;
        currentOtherUser = null;
        currentConversationData = null;

        await signOut(auth);

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo cerrar sesión.\n\n" +
            error.message
        );
    }
}


/* =========================================================
   PERSONAS
========================================================= */

async function loadAllUsers() {

    if (!currentUser) return;

    try {

        const snapshot =
            await getDocs(collection(db, "users"));

        allUsers = [];

        snapshot.forEach((item) => {

            const data = item.data();

            if (item.id === currentUser.uid) {
                return;
            }

            allUsers.push({
                uid: item.id,
                ...data
            });
        });

        allUsers.sort((a, b) => {

            const nameA =
                (a.username || "").toLowerCase();

            const nameB =
                (b.username || "").toLowerCase();

            return nameA.localeCompare(nameB);
        });

        renderPeople("");

    } catch (error) {

        console.error("Error cargando usuarios:", error);

        if (searchResults) {
            searchResults.innerHTML =
                "<div class='empty-state'>No se pudieron cargar las personas.</div>";
        }
    }
}


/* =========================================================
   MOSTRAR PERSONAS
========================================================= */

function renderPeople(searchText) {

    if (!searchResults) return;

    const text =
        (searchText || "").trim().toLowerCase();

    const filtered =
        allUsers.filter((user) => {

            const username =
                (user.username || "").toLowerCase();

            const email =
                (user.email || "").toLowerCase();

            return (
                username.includes(text) ||
                email.includes(text)
            );
        });

    searchResults.innerHTML = "";

    if (filtered.length === 0) {

        searchResults.innerHTML =
            "<div class='empty-state'>No hay personas que coincidan.</div>";

        searchResults.classList.remove("hidden");

        return;
    }

    filtered.forEach((user) => {

        const element =
            createUserSearchElement(user);

        searchResults.appendChild(element);
    });

    searchResults.classList.remove("hidden");
}


/* =========================================================
   ELEMENTO PERSONA
========================================================= */

function createUserSearchElement(user) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className = "search-user";

    const avatar =
        document.createElement("div");

    avatar.className = "user-avatar";

    avatar.textContent =
        (user.username || "?")
            .charAt(0)
            .toUpperCase();

    const information =
        document.createElement("div");

    information.className =
        "user-search-information";

    const name =
        document.createElement("strong");

    name.textContent =
        "@" + (user.username || "usuario");

    const email =
        document.createElement("span");

    email.textContent =
        user.email || "";

    information.appendChild(name);
    information.appendChild(email);

    button.appendChild(avatar);
    button.appendChild(information);

    button.addEventListener("click", () => {

        openConversationWithUser(user);

        if (searchResults) {
            searchResults.classList.add("hidden");
        }

        if (userSearch) {
            userSearch.value = "";
        }
    });

    return button;
}


/* =========================================================
   BUSCAR PERSONAS
========================================================= */

function searchUsers() {

    const text =
        userSearch?.value || "";

    renderPeople(text);
}


/* =========================================================
   CONVERSACIÓN INDIVIDUAL
========================================================= */

async function openConversationWithUser(user) {

    if (!currentUser || !user) return;

    try {

        const conversationId =
            await findOrCreateConversation(user.uid);

        openConversation(
            conversationId,
            {
                members: [
                    currentUser.uid,
                    user.uid
                ],
                isGroup: false
            },
            user
        );

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo abrir el chat.\n\n" +
            error.code +
            "\n" +
            error.message
        );
    }
}


/* =========================================================
   BUSCAR / CREAR CHAT
========================================================= */

async function findOrCreateConversation(otherUid) {

    const conversationsRef =
        collection(db, "conversations");

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

    for (const item of snapshot.docs) {

        const data = item.data();

        if (
            data.isGroup === true
        ) {
            continue;
        }

        if (
            Array.isArray(data.members) &&
            data.members.length === 2 &&
            data.members.includes(otherUid)
        ) {
            return item.id;
        }
    }

    const newConversation =
        await addDoc(
            conversationsRef,
            {
                members: [
                    currentUser.uid,
                    otherUid
                ],
                isGroup: false,
                createdAt: serverTimestamp(),
                lastMessage: "",
                lastMessageAt: serverTimestamp()
            }
        );

    return newConversation.id;
}


/* =========================================================
   ABRIR CONVERSACIÓN
========================================================= */

function openConversation(
    conversationId,
    conversationData,
    otherUser = null
) {

    currentConversationId =
        conversationId;

    currentConversationData =
        conversationData;

    currentOtherUser =
        otherUser;

    if (welcomeScreen) {
        welcomeScreen.classList.add("hidden");
    }

    if (chatWindow) {
        chatWindow.classList.remove("hidden");
    }

    const isGroup =
        conversationData?.isGroup === true;

    if (isGroup) {

        if (chatTitle) {
            chatTitle.textContent =
                conversationData.groupName ||
                "Grupo";
        }

        if (chatStatus) {

            const count =
                Array.isArray(conversationData.members)
                    ? conversationData.members.length
                    : 0;

            chatStatus.textContent =
                `Grupo · ${count} personas`;
        }

    } else {

        if (chatTitle) {
            chatTitle.textContent =
                "@" +
                (
                    otherUser?.username ||
                    "usuario"
                );
        }

        if (chatStatus) {
            chatStatus.textContent =
                otherUser?.email || "Chat";
        }
    }

    loadMessages(conversationId);
}


/* =========================================================
   CARGAR MENSAJES
========================================================= */

function loadMessages(conversationId) {

    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }

    if (!messages) return;

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
            orderBy("createdAt", "asc")
        );

    unsubscribeMessages =
        onSnapshot(
            q,
            (snapshot) => {

                messages.innerHTML = "";

                if (snapshot.empty) {

                    const empty =
                        document.createElement("div");

                    empty.className =
                        "empty-messages";

                    empty.textContent =
                        "Todavía no hay mensajes.";

                    messages.appendChild(empty);

                    return;
                }

                snapshot.forEach((item) => {

                    displayMessage(
                        item.data()
                    );
                });

                messages.scrollTop =
                    messages.scrollHeight;
            },

            (error) => {

                console.error(
                    "Error cargando mensajes:",
                    error
                );

                messages.innerHTML =
                    "<div class='empty-state'>No se pudieron cargar los mensajes.</div>";
            }
        );
}


/* =========================================================
   MOSTRAR MENSAJE
========================================================= */

function displayMessage(data) {

    if (!messages) return;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message-wrapper";

    if (
        data.senderId === currentUser.uid
    ) {
        wrapper.classList.add("own");
    } else {
        wrapper.classList.add("other");
    }

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        data.content || "";

    const time =
        document.createElement("div");

    time.className =
        "message-time";

    if (data.createdAt) {

        try {

            const date =
                data.createdAt.toDate();

            time.textContent =
                date.toLocaleTimeString(
                    "es-UY",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        } catch {
            time.textContent = "";
        }
    }

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);

    messages.appendChild(wrapper);
}


/* =========================================================
   ENVIAR MENSAJE
========================================================= */

async function sendMessage() {

    if (
        !currentUser ||
        !currentConversationId ||
        !messageInput
    ) {
        return;
    }

    const content =
        messageInput.value.trim();

    if (!content) {
        return;
    }

    if (content.length > 4000) {

        alert(
            "El mensaje no puede superar los 4000 caracteres."
        );

        return;
    }

    if (sendButton) {
        sendButton.disabled = true;
    }

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
                senderId: currentUser.uid,
                content: content,
                createdAt: serverTimestamp()
            }
        );

        await setDoc(
            doc(
                db,
                "conversations",
                currentConversationId
            ),
            {
                lastMessage: content,
                lastMessageAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        messageInput.value = "";

        updateCharacterCounter();

        messageInput.focus();

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo enviar el mensaje.\n\n" +
            error.code +
            "\n" +
            error.message
        );

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }
    }
}


/* =========================================================
   CARGAR CONVERSACIONES
========================================================= */

function loadConversations() {

    if (!currentUser || !chatList) {
        return;
    }

    if (unsubscribeConversations) {
        unsubscribeConversations();
        unsubscribeConversations = null;
    }

    const conversationsRef =
        collection(db, "conversations");

    const q =
        query(
            conversationsRef,
            where(
                "members",
                "array-contains",
                currentUser.uid
            )
        );

    unsubscribeConversations =
        onSnapshot(
            q,
            async (snapshot) => {

                chatList.innerHTML = "";

                if (snapshot.empty) {

                    const empty =
                        document.createElement("div");

                    empty.className =
                        "empty-state";

                    empty.textContent =
                        "Todavía no tenés conversaciones.";

                    chatList.appendChild(empty);

                    return;
                }

                const conversations = [];

                for (const item of snapshot.docs) {

                    const data = item.data();

                    let title = "Chat";
                    let subtitle = "";

                    let otherUser = null;

                    if (data.isGroup === true) {

                        title =
                            data.groupName ||
                            "Grupo";

                        subtitle =
                            data.lastMessage ||
                            "Grupo nuevo";

                    } else {

                        const otherUid =
                            (data.members || [])
                                .find(
                                    uid =>
                                        uid !== currentUser.uid
                                );

                        if (!otherUid) {
                            continue;
                        }

                        const user =
                            allUsers.find(
                                u =>
                                    u.uid === otherUid
                            );

                        if (user) {

                            otherUser = user;

                            title =
                                "@" +
                                (
                                    user.username ||
                                    "usuario"
                                );

                        } else {

                            try {

                                const userSnap =
                                    await getDoc(
                                        doc(
                                            db,
                                            "users",
                                            otherUid
                                        )
                                    );

                                if (
                                    userSnap.exists()
                                ) {

                                    otherUser = {
                                        uid: otherUid,
                                        ...userSnap.data()
                                    };

                                    title =
                                        "@" +
                                        (
                                            otherUser.username ||
                                            "usuario"
                                        );
                                }

                            } catch (error) {

                                console.error(error);
                            }
                        }

                        subtitle =
                            data.lastMessage ||
                            "Sin mensajes";
                    }

                    conversations.push({
                        id: item.id,
                        data: data,
                        title: title,
                        subtitle: subtitle,
                        otherUser: otherUser
                    });
                }

                conversations.sort(
                    (a, b) => {

                        const aTime =
                            a.data.lastMessageAt
                                ?.toMillis?.() || 0;

                        const bTime =
                            b.data.lastMessageAt
                                ?.toMillis?.() || 0;

                        return bTime - aTime;
                    }
                );

                conversations.forEach(
                    conversation => {

                        const element =
                            createChatElement(
                                conversation
                            );

                        chatList.appendChild(
                            element
                        );
                    }
                );
            },

            (error) => {

                console.error(
                    "Error cargando conversaciones:",
                    error
                );

                chatList.innerHTML =
                    "<div class='empty-state'>No se pudieron cargar los chats.</div>";
            }
        );
}


/* =========================================================
   ELEMENTO CHAT
========================================================= */

function createChatElement(conversation) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "chat-list-item";

    const avatar =
        document.createElement("div");

    avatar.className =
        "chat-avatar";

    if (
        conversation.data.isGroup === true
    ) {

        avatar.textContent = "👥";

    } else {

        avatar.textContent =
            (
                conversation.otherUser?.username ||
                "?"
            )
                .charAt(0)
                .toUpperCase();
    }

    const information =
        document.createElement("div");

    information.className =
        "chat-list-information";

    const title =
        document.createElement("strong");

    title.textContent =
        conversation.title;

    const lastMessage =
        document.createElement("span");

    lastMessage.textContent =
        conversation.subtitle;

    information.appendChild(title);
    information.appendChild(lastMessage);

    button.appendChild(avatar);
    button.appendChild(information);

    button.addEventListener(
        "click",
        () => {

            openConversation(
                conversation.id,
                conversation.data,
                conversation.otherUser
            );
        }
    );

    return button;
}


/* =========================================================
   BIENVENIDA
========================================================= */

function showWelcome() {

    if (welcomeScreen) {
        welcomeScreen.classList.remove("hidden");
    }

    if (chatWindow) {
        chatWindow.classList.add("hidden");
    }
}


/* =========================================================
   BORRAR CHAT
========================================================= */

async function deleteCurrentChat() {

    if (!currentConversationId) {
        return;
    }

    const confirmed =
        confirm(
            "¿Querés borrar esta conversación de tu lista?"
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

        currentConversationId = null;
        currentOtherUser = null;
        currentConversationData = null;

        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        showWelcome();

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo borrar la conversación.\n\n" +
            error.code +
            "\n" +
            error.message
        );
    }
}


/* =========================================================
   GRUPOS - ABRIR MODAL
========================================================= */

async function openGroupModal() {

    if (!groupModal) return;

    selectedGroupUsers =
        new Set();

    if (groupName) {
        groupName.value = "";
    }

    await loadGroupUsers();

    groupModal.classList.remove("hidden");
}


/* =========================================================
   GRUPOS - USUARIOS
========================================================= */

async function loadGroupUsers() {

    if (!groupUsers) return;

    if (
        allUsers.length === 0
    ) {
        await loadAllUsers();
    }

    groupUsers.innerHTML = "";

    if (allUsers.length === 0) {

        groupUsers.innerHTML =
            "<div class='empty-state'>No hay otras personas registradas.</div>";

        return;
    }

    allUsers.forEach((user) => {

        const label =
            document.createElement("label");

        label.className =
            "group-user";

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.value =
            user.uid;

        checkbox.addEventListener(
            "change",
            () => {

                if (checkbox.checked) {

                    selectedGroupUsers.add(
                        user.uid
                    );

                } else {

                    selectedGroupUsers.delete(
                        user.uid
                    );
                }
            }
        );

        const name =
            document.createElement("span");

        name.textContent =
            "@" +
            (
                user.username ||
                "usuario"
            );

        label.appendChild(
            checkbox
        );

        label.appendChild(
            name
        );

        groupUsers.appendChild(
            label
        );
    });
}


/* =========================================================
   GRUPOS - CERRAR MODAL
========================================================= */

function closeGroupModal() {

    if (!groupModal) return;

    groupModal.classList.add("hidden");

    selectedGroupUsers =
        new Set();
}


/* =========================================================
   GRUPOS - CREAR
========================================================= */

async function createGroup() {

    if (!currentUser) return;

    const name =
        groupName?.value.trim();

    if (!name) {

        alert(
            "Escribí un nombre para el grupo."
        );

        return;
    }

    if (selectedGroupUsers.size === 0) {

        alert(
            "Seleccioná al menos una persona."
        );

        return;
    }

    if (name.length > 100) {

        alert(
            "El nombre del grupo es demasiado largo."
        );

        return;
    }

    if (confirmGroupButton) {
        confirmGroupButton.disabled = true;
    }

    try {

        const members = [
            currentUser.uid,
            ...selectedGroupUsers
        ];

        const conversation =
            await addDoc(
                collection(
                    db,
                    "conversations"
                ),
                {
                    members: members,
                    isGroup: true,
                    groupName: name,
                    createdAt: serverTimestamp(),
                    lastMessage: "",
                    lastMessageAt: serverTimestamp()
                }
            );

        closeGroupModal();

        openConversation(
            conversation.id,
            {
                members: members,
                isGroup: true,
                groupName: name
            },
            null
        );

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo crear el grupo.\n\n" +
            error.code +
            "\n" +
            error.message
        );

    } finally {

        if (confirmGroupButton) {
            confirmGroupButton.disabled = false;
        }
    }
}


/* =========================================================
   CONTADOR
========================================================= */

function updateCharacterCounter() {

    if (!messageInput || !characterCounter) {
        return;
    }

    characterCounter.textContent =
        `${messageInput.value.length}/4000`;
}


/* =========================================================
   ADMIN - ABRIR
========================================================= */

async function openAdminPanel() {

    if (
        !currentProfile ||
        currentProfile.usernameLower !==
            ADMIN_USERNAME.toLowerCase()
    ) {
        return;
    }

    if (!adminPanel) return;

    adminPanel.classList.remove("hidden");

    if (adminDetails) {
        adminDetails.classList.add("hidden");
    }

    if (adminSearch) {
        adminSearch.value = "";
    }

    await loadAdminUsers();
}


/* =========================================================
   ADMIN - CERRAR
========================================================= */

function closeAdminPanel() {

    if (!adminPanel) return;

    adminPanel.classList.add("hidden");
}


/* =========================================================
   ADMIN - CARGAR USUARIOS
========================================================= */

async function loadAdminUsers() {

    if (!adminUsers) return;

    if (adminSyncStatus) {
        adminSyncStatus.textContent =
            "Cargando usuarios...";
    }

    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );

        const users = [];

        snapshot.forEach((item) => {

            users.push({
                uid: item.id,
                ...item.data()
            });
        });

        users.sort((a, b) => {

            const nameA =
                (a.username || "").toLowerCase();

            const nameB =
                (b.username || "").toLowerCase();

            return nameA.localeCompare(nameB);
        });

        allAdminUsers =
            users;

        renderAdminUsers();

        if (adminSyncStatus) {
            adminSyncStatus.textContent =
                `${users.length} usuarios`;
        }

    } catch (error) {

        console.error(error);

        if (adminSyncStatus) {
            adminSyncStatus.textContent =
                "Error cargando usuarios";
        }

        alert(
            "No se pudieron cargar los usuarios del panel.\n\n" +
            error.code +
            "\n" +
            error.message
        );
    }
}


/* =========================================================
   ADMIN - LISTA
========================================================= */

let allAdminUsers = [];


function renderAdminUsers() {

    if (!adminUsers) return;

    const search =
        (
            adminSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const filtered =
        allAdminUsers.filter(
            user => {

                const username =
                    (
                        user.username ||
                        ""
                    ).toLowerCase();

                const email =
                    (
                        user.email ||
                        ""
                    ).toLowerCase();

                const uid =
                    (
                        user.uid ||
                        ""
                    ).toLowerCase();

                return (
                    username.includes(search) ||
                    email.includes(search) ||
                    uid.includes(search)
                );
            }
        );

    adminUsers.innerHTML = "";

    if (
        adminEmpty
    ) {
        adminEmpty.classList.toggle(
            "hidden",
            filtered.length !== 0
        );
    }

    filtered.forEach((user) => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "admin-user-item";

        const name =
            document.createElement("strong");

        name.textContent =
            "@" +
            (
                user.username ||
                "sin usuario"
            );

        const email =
            document.createElement("span");

        email.textContent =
            user.email ||
            "";

        button.appendChild(name);
        button.appendChild(email);

        button.addEventListener(
            "click",
            () => {

                showAdminUserDetails(
                    user
                );
            }
        );

        adminUsers.appendChild(
            button
        );
    });
}


/* =========================================================
   ADMIN - DETALLES
========================================================= */

async function showAdminUserDetails(user) {

    if (!adminDetails) return;

    adminDetails.classList.remove("hidden");

    if (adminDetailName) {
        adminDetailName.textContent =
            "@" +
            (
                user.username ||
                "sin usuario"
            );
    }

    if (adminDetailEmail) {
        adminDetailEmail.textContent =
            user.email ||
            "Sin email";
    }

    if (adminDetailUid) {
        adminDetailUid.textContent =
            user.uid;
    }

    if (adminDetailCreated) {

        if (user.createdAt?.toDate) {

            adminDetailCreated.textContent =
                user.createdAt
                    .toDate()
                    .toLocaleString("es-UY");

        } else {

            adminDetailCreated.textContent =
                "Desconocido";
        }
    }

    await loadAdminUserHistory(
        user.uid
    );
}


/* =========================================================
   ADMIN - HISTORIAL
========================================================= */

async function loadAdminUserHistory(uid) {

    if (!adminHistory) return;

    adminHistory.innerHTML =
        "Cargando historial...";

    try {

        const q =
            query(
                collection(
                    db,
                    "conversations"
                ),
                where(
                    "members",
                    "array-contains",
                    uid
                )
            );

        const snapshot =
            await getDocs(q);

        adminHistory.innerHTML = "";

        if (snapshot.empty) {

            adminHistory.textContent =
                "Este usuario todavía no tiene conversaciones.";

            return;
        }

        const conversations = [];

        for (
            const item of snapshot.docs
        ) {

            const data =
                item.data();

            let title =
                "Conversación";

            if (
                data.isGroup === true
            ) {

                title =
                    "👥 " +
                    (
                        data.groupName ||
                        "Grupo"
                    );

            } else {

                const otherUid =
                    (
                        data.members ||
                        []
                    ).find(
                        id => id !== uid
                    );

                if (otherUid) {

                    const otherUser =
                        allAdminUsers.find(
                            user =>
                                user.uid === otherUid
                        );

                    if (otherUser) {

                        title =
                            "@" +
                            (
                                otherUser.username ||
                                "usuario"
                            );
                    }
                }
            }

            conversations.push({
                title: title,
                lastMessage:
                    data.lastMessage ||
                    "Sin mensajes",
                date:
                    data.lastMessageAt
                        ?.toDate?.() ||
                    null
            });
        }

        conversations.sort(
            (a, b) => {

                const aTime =
                    a.date
                        ? a.date.getTime()
                        : 0;

                const bTime =
                    b.date
                        ? b.date.getTime()
                        : 0;

                return bTime - aTime;
            }
        );

        conversations.forEach(
            conversation => {

                const element =
                    document.createElement("div");

                element.className =
                    "admin-history-item";

                const title =
                    document.createElement("strong");

                title.textContent =
                    conversation.title;

                const message =
                    document.createElement("span");

                message.textContent =
                    conversation.lastMessage;

                const date =
                    document.createElement("small");

                if (conversation.date) {

                    date.textContent =
                        conversation.date
                            .toLocaleString(
                                "es-UY"
                            );
                }

                element.appendChild(title);
                element.appendChild(message);
                element.appendChild(date);

                adminHistory.appendChild(
                    element
                );
            }
        );

    } catch (error) {

        console.error(error);

        adminHistory.textContent =
            "No se pudo cargar el historial: " +
            error.message;
    }
}


/* =========================================================
   EVENTOS - AUTENTICACIÓN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            login();
        }
    );
}


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            register();
        }
    );
}


if (showRegisterButton) {

    showRegisterButton.addEventListener(
        "click",
        showRegister
    );
}


if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        showLogin
    );
}


/* =========================================================
   EVENTOS - APP
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );
}


if (userSearch) {

    userSearch.addEventListener(
        "input",
        searchUsers
    );

    userSearch.addEventListener(
        "focus",
        () => {

            renderPeople(
                userSearch.value
            );
        }
    );
}


if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


if (messageInput) {

    messageInput.addEventListener(
        "input",
        updateCharacterCounter
    );

    messageInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


if (deleteChatButton) {

    deleteChatButton.addEventListener(
        "click",
        deleteCurrentChat
    );
}


/* =========================================================
   EVENTOS - GRUPOS
========================================================= */

if (createGroupButton) {

    createGroupButton.addEventListener(
        "click",
        openGroupModal
    );
}


if (cancelGroupButton) {

    cancelGroupButton.addEventListener(
        "click",
        closeGroupModal
    );
}


if (confirmGroupButton) {

    confirmGroupButton.addEventListener(
        "click",
        createGroup
    );
}


if (groupModal) {

    groupModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === groupModal
            ) {
                closeGroupModal();
            }
        }
    );
}


/* =========================================================
   EVENTOS - ADMIN
========================================================= */

if (adminButton) {

    adminButton.addEventListener(
        "click",
        openAdminPanel
    );
}


if (adminCloseButton) {

    adminCloseButton.addEventListener(
        "click",
        closeAdminPanel
    );
}


if (adminSearch) {

    adminSearch.addEventListener(
        "input",
        renderAdminUsers
    );
}


if (adminSyncButton) {

    adminSyncButton.addEventListener(
        "click",
        loadAdminUsers
    );
}


/* =========================================================
   CONTADOR INICIAL
========================================================= */

updateCharacterCounter();
