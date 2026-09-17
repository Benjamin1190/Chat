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


let currentUser = null;
let currentProfile = null;
let currentConversationId = null;
let currentOtherUser = null;

let unsubscribeMessages = null;
let unsubscribeConversations = null;


const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("app");

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

const logoutButton = document.getElementById("logoutButton");

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


function showAuthMessage(message, error = false) {

    authMessage.textContent = message;

    authMessage.style.color = error ? "#ff4d4d" : "#4caf50";
}


showRegister.addEventListener("click", () => {

    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");

    authMessage.textContent = "";
});


showLogin.addEventListener("click", () => {

    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    authMessage.textContent = "";
});


registerButton.addEventListener("click", async () => {

    const email = registerEmail.value.trim();
    const username = registerUsername.value.trim();
    const password = registerPassword.value;

    if (!email || !username || !password) {

        showAuthMessage("Completa todos los campos.", true);
        return;
    }

    if (username.length < 3) {

        showAuthMessage(
            "El nombre de usuario debe tener al menos 3 caracteres.",
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

    try {

        const usernameLower = username.toLowerCase();

        const usernameQuery = query(
            collection(db, "users"),
            where("usernameLower", "==", usernameLower)
        );

        const usernameResult = await getDocs(usernameQuery);

        if (!usernameResult.empty) {

            showAuthMessage(
                "Ese nombre de usuario ya está ocupado.",
                true
            );

            registerButton.disabled = false;
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


        showAuthMessage("Cuenta creada correctamente.");

    } catch (error) {

    console.error("ERROR FIREBASE:", error);
    console.error("Código:", error.code);
    console.error("Mensaje:", error.message);

    let message =
        "Error: " + error.code + " - " + error.message;

    showAuthMessage(message, true);

} finally {

        if (error.code === "auth/email-already-in-use") {
            message = "Ese correo ya está registrado.";
        }

        if (error.code === "auth/invalid-email") {
            message = "El correo no es válido.";
        }

        if (error.code === "auth/weak-password") {
            message = "La contraseña es demasiado débil.";
        }

        showAuthMessage(message, true);

    } finally {

        registerButton.disabled = false;
    }
});


loginButton.addEventListener("click", async () => {

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {

        showAuthMessage(
            "Introduce tu correo y contraseña.",
            true
        );

        return;
    }

    loginButton.disabled = true;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        console.error(error);

        let message = "No se pudo iniciar sesión.";

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {
            message = "Correo o contraseña incorrectos.";
        }

        showAuthMessage(message, true);

    } finally {

        loginButton.disabled = false;
    }
});


logoutButton.addEventListener("click", async () => {

    await signOut(auth);
});


onAuthStateChanged(auth, async (user) => {

    if (!user) {

        currentUser = null;
        currentProfile = null;

        authScreen.classList.remove("hidden");
        appScreen.classList.add("hidden");

        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        if (unsubscribeConversations) {
            unsubscribeConversations();
            unsubscribeConversations = null;
        }

        return;
    }


    currentUser = user;


    const profileReference = doc(
        db,
        "users",
        user.uid
    );

    const profileSnapshot =
        await getDoc(profileReference);


    if (!profileSnapshot.exists()) {

        console.error("No existe el perfil del usuario.");

        await signOut(auth);
        return;
    }


    currentProfile = profileSnapshot.data();


    currentUserElement.textContent =
        "@" + currentProfile.username;


    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");


    loadConversations();
});


userSearch.addEventListener("input", async () => {

    const search = userSearch.value.trim().toLowerCase();

    searchResults.innerHTML = "";

    if (!search) {
        return;
    }

    if (!currentUser) {
        return;
    }


    try {

        const usersSnapshot =
            await getDocs(collection(db, "users"));


        usersSnapshot.forEach((userDocument) => {

            if (userDocument.id === currentUser.uid) {
                return;
            }


            const user = userDocument.data();

            const username =
                user.username || "";


            if (
                username
                    .toLowerCase()
                    .includes(search)
            ) {

                const result =
                    document.createElement("button");

                result.className = "search-result";

                result.textContent =
                    "@" + username;


                result.addEventListener("click", () => {

                    openConversation(
                        userDocument.id,
                        user
                    );

                    userSearch.value = "";
                    searchResults.innerHTML = "";

                });


                searchResults.appendChild(result);
            }

        });

    } catch (error) {

        console.error(error);

    }
});


async function findConversation(otherUserId) {

    const conversationsQuery = query(
        collection(db, "conversations"),
        where("members", "array-contains", currentUser.uid)
    );


    const snapshot =
        await getDocs(conversationsQuery);


    for (const conversationDocument of snapshot.docs) {

        const data = conversationDocument.data();

        if (
            Array.isArray(data.members) &&
            data.members.length === 2 &&
            data.members.includes(otherUserId)
        ) {

            return conversationDocument.id;
        }
    }


    return null;
}


async function openConversation(otherUserId, otherUser) {

    currentOtherUser = {
        id: otherUserId,
        ...otherUser
    };


    let conversationId =
        await findConversation(otherUserId);


    if (!conversationId) {

        const conversationReference =
            await addDoc(
                collection(db, "conversations"),
                {
                    members: [
                        currentUser.uid,
                        otherUserId
                    ],

                    createdAt: serverTimestamp(),

                    lastMessage: "",
                    lastMessageAt: serverTimestamp()
                }
            );


        conversationId =
            conversationReference.id;
    }


    currentConversationId = conversationId;


    welcome.classList.add("hidden");
    chatWindow.classList.remove("hidden");


    chatTitle.textContent =
        "@" + otherUser.username;

    chatStatus.textContent =
        "Chat privado";


    loadMessages(conversationId);
}


function loadMessages(conversationId) {

    messages.innerHTML = "";


    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }


    const messagesQuery = query(
        collection(
            db,
            "conversations",
            conversationId,
            "messages"
        ),
        orderBy("createdAt", "asc")
    );


    unsubscribeMessages =
        onSnapshot(
            messagesQuery,
            (snapshot) => {

                messages.innerHTML = "";


                snapshot.forEach((messageDocument) => {

                    const message =
                        messageDocument.data();


                    renderMessage(message);

                });


                messages.scrollTop =
                    messages.scrollHeight;

            },

            (error) => {

                console.error(
                    "Error cargando mensajes:",
                    error
                );

            }
        );
}


function renderMessage(message) {

    const messageElement =
        document.createElement("div");


    const isMine =
        message.senderId === currentUser.uid;


    messageElement.className =
        isMine
            ? "message sent"
            : "message received";


    const contentElement =
        document.createElement("div");


    contentElement.className =
        "message-content";


    contentElement.textContent =
        message.content || "";


    messageElement.appendChild(
        contentElement
    );


    messages.appendChild(
        messageElement
    );
}


async function sendMessage() {

    const content =
        messageInput.value.trim();


    if (!content) {
        return;
    }


    if (!currentConversationId) {
        return;
    }


    messageInput.value = "";


    sendButton.disabled = true;


    try {

        await addDoc(
            collection(
                db,
                "conversations",
                currentConversationId,
                "messages"
            ),
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

    } catch (error) {

        console.error(
            "Error enviando mensaje:",
            error
        );

        messageInput.value = content;

    } finally {

        sendButton.disabled = false;

    }
}


sendButton.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }

    }
);


function loadConversations() {

    if (unsubscribeConversations) {
        unsubscribeConversations();
        unsubscribeConversations = null;
    }


    const conversationsQuery =
        query(
            collection(db, "conversations"),
            where(
                "members",
                "array-contains",
                currentUser.uid
            )
        );


    unsubscribeConversations =
        onSnapshot(
            conversationsQuery,
            async (snapshot) => {

                chatList.innerHTML = "";


                for (
                    const conversationDocument
                    of snapshot.docs
                ) {

                    const conversation =
                        conversationDocument.data();


                    const otherUserId =
                        conversation.members.find(
                            id =>
                                id !== currentUser.uid
                        );


                    if (!otherUserId) {
                        continue;
                    }


                    const userSnapshot =
                        await getDoc(
                            doc(
                                db,
                                "users",
                                otherUserId
                            )
                        );


                    if (!userSnapshot.exists()) {
                        continue;
                    }


                    const user =
                        userSnapshot.data();


                    const chatButton =
                        document.createElement("button");


                    chatButton.className =
                        "chat-list-item";


                    chatButton.textContent =
                        "@" + user.username;


                    chatButton.addEventListener(
                        "click",
                        () => {

                            openConversation(
                                otherUserId,
                                user
                            );

                        }
                    );


                    chatList.appendChild(
                        chatButton
                    );
                }

            },

            (error) => {

                console.error(
                    "Error cargando chats:",
                    error
                );

            }
        );
}
