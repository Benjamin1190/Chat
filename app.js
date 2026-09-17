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


const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


/* =========================================================
   VARIABLES
   ========================================================= */

let currentUser = null;
let currentProfile = null;
let currentConversationId = null;
let currentOtherUser = null;

let unsubscribeMessages = null;
let unsubscribeConversations = null;


/* =========================================================
   ELEMENTOS HTML
   ========================================================= */

const authScreen =
    document.getElementById("authScreen");

const appScreen =
    document.getElementById("app");


const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");


const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");


const registerEmail =
    document.getElementById("registerEmail");

const registerUsername =
    document.getElementById("registerUsername");

const registerPassword =
    document.getElementById("registerPassword");


const loginButton =
    document.getElementById("loginButton");

const registerButton =
    document.getElementById("registerButton");


const showRegister =
    document.getElementById("showRegister");

const showLogin =
    document.getElementById("showLogin");


const authMessage =
    document.getElementById("authMessage");


const logoutButton =
    document.getElementById("logoutButton");


const currentUserElement =
    document.getElementById("currentUser");


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


/* =========================================================
   CAMBIAR ENTRE LOGIN Y REGISTRO
   ========================================================= */

showRegister.addEventListener("click", function () {

    loginForm.classList.add("hidden");

    registerForm.classList.remove("hidden");

    authMessage.textContent = "";

});


showLogin.addEventListener("click", function () {

    registerForm.classList.add("hidden");

    loginForm.classList.remove("hidden");

    authMessage.textContent = "";

});


/* =========================================================
   MENSAJES DE AUTENTICACIÓN
   ========================================================= */

function showAuthMessage(message, error = false) {

    authMessage.textContent = message;

    if (error) {

        authMessage.style.color = "#ff4444";

    } else {

        authMessage.style.color = "#4caf50";

    }

}


/* =========================================================
   REGISTRO
   ========================================================= */

registerButton.addEventListener(
    "click",
    register
);


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


    if (!password) {

        showAuthMessage(
            "Escribe una contraseña.",
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


    if (password.length < 6) {

        showAuthMessage(
            "La contraseña debe tener al menos 6 caracteres.",
            true
        );

        return;
    }


    registerButton.disabled = true;

    showAuthMessage(
        "Creando cuenta..."
    );


    try {

        /*
         * 1. CREAR LA CUENTA EN FIREBASE AUTH
         */

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        /*
         * 2. EL USUARIO YA ESTÁ AUTENTICADO
         */

        const usernameLower =
            username.toLowerCase();


        /*
         * 3. COMPROBAR SI EL USUARIO YA EXISTE
         */

        const usernameQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "usernameLower",
                    "==",
                    usernameLower
                )
            );


        const usernameSnapshot =
            await getDocs(
                usernameQuery
            );


        if (!usernameSnapshot.empty) {

            showAuthMessage(
                "Ese nombre de usuario ya está ocupado.",
                true
            );

            await signOut(auth);

            return;
        }


        /*
         * 4. CREAR PERFIL EN FIRESTORE
         */

        await setDoc(

            doc(
                db,
                "users",
                user.uid
            ),

            {
                username: username,

                usernameLower:
                    usernameLower,

                email: email,

                createdAt:
                    serverTimestamp()
            }

        );


        /*
         * 5. LIMPIAR FORMULARIO
         */

        registerEmail.value = "";

        registerUsername.value = "";

        registerPassword.value = "";


        showAuthMessage(
            "Cuenta creada correctamente."
        );


    } catch (error) {

        console.error(
            "ERROR FIREBASE:",
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


        let message =
            "No se pudo crear la cuenta.";


        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message =
                "Ese correo ya está registrado.";

        }

        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "El correo electrónico no es válido.";

        }

        else if (
            error.code ===
            "auth/weak-password"
        ) {

            message =
                "La contraseña debe tener al menos 6 caracteres.";

        }

        else if (
            error.code ===
            "auth/operation-not-allowed"
        ) {

            message =
                "Correo y contraseña no están activados en Firebase.";

        }

        else if (
            error.code ===
            "permission-denied"
        ) {

            message =
                "Firebase rechazó el acceso a Firestore.";

        }

        else {

            message =
                "Error: " +
                error.code +
                " - " +
                error.message;

        }


        showAuthMessage(
            message,
            true
        );


    } finally {

        registerButton.disabled = false;

    }

}


/* =========================================================
   INICIAR SESIÓN
   ========================================================= */

loginButton.addEventListener(
    "click",
    login
);


async function login() {

    const email =
        loginEmail.value.trim();

    const password =
        loginPassword.value;


    if (!email || !password) {

        showAuthMessage(
            "Introduce tu correo y contraseña.",
            true
        );

        return;
    }


    loginButton.disabled = true;

    showAuthMessage(
        "Iniciando sesión..."
    );


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


    } catch (error) {

        console.error(
            "ERROR LOGIN:",
            error
        );


        let message =
            "No se pudo iniciar sesión.";


        if (
            error.code ===
                "auth/invalid-credential" ||
            error.code ===
                "auth/wrong-password" ||
            error.code ===
                "auth/user-not-found"
        ) {

            message =
                "Correo o contraseña incorrectos.";

        }


        showAuthMessage(
            message,
            true
        );


    } finally {

        loginButton.disabled = false;

    }

}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

logoutButton.addEventListener(
    "click",
    async function () {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );

        }

    }
);


/* =========================================================
   ESTADO DE AUTENTICACIÓN
   ========================================================= */

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            currentUser = null;

            currentProfile = null;

            currentConversationId = null;


            authScreen.classList.remove(
                "hidden"
            );

            appScreen.classList.add(
                "hidden"
            );


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


        try {

            const profileReference =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const profileSnapshot =
                await getDoc(
                    profileReference
                );


            if (!profileSnapshot.exists()) {

                console.error(
                    "El usuario no tiene perfil en Firestore."
                );

                await signOut(auth);

                return;
            }


            currentProfile =
                profileSnapshot.data();


            currentUserElement.textContent =
                "@" +
                currentProfile.username;


            authScreen.classList.add(
                "hidden"
            );


            appScreen.classList.remove(
                "hidden"
            );


            loadConversations();


        } catch (error) {

            console.error(
                "Error cargando perfil:",
                error
            );


            showAuthMessage(
                "Error cargando tu perfil: " +
                error.message,
                true
            );

        }

    }
);


/* =========================================================
   BUSCAR USUARIOS
   ========================================================= */

userSearch.addEventListener(
    "input",
    searchUsers
);


async function searchUsers() {

    const search =
        userSearch.value
            .trim()
            .toLowerCase();


    searchResults.innerHTML = "";


    if (!search) {

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


        usersSnapshot.forEach(
            function (userDocument) {

                if (
                    userDocument.id ===
                    currentUser.uid
                ) {

                    return;
                }


                const user =
                    userDocument.data();


                const username =
                    user.username || "";


                if (
                    username
                        .toLowerCase()
                        .includes(search)
                ) {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type = "button";

                    button.className =
                        "search-result";


                    button.textContent =
                        "@" +
                        username;


                    button.addEventListener(
                        "click",
                        function () {

                            openConversation(
                                userDocument.id,
                                user
                            );


                            userSearch.value =
                                "";

                            searchResults.innerHTML =
                                "";

                        }
                    );


                    searchResults.appendChild(
                        button
                    );

                }

            }
        );


    } catch (error) {

        console.error(
            "Error buscando usuarios:",
            error
        );

    }

}


/* =========================================================
   BUSCAR CONVERSACIÓN EXISTENTE
   ========================================================= */

async function findConversation(
    otherUserId
) {

    const conversationsQuery =
        query(
            collection(
                db,
                "conversations"
            ),

            where(
                "members",
                "array-contains",
                currentUser.uid
            )
        );


    const snapshot =
        await getDocs(
            conversationsQuery
        );


    for (
        const conversationDocument
        of snapshot.docs
    ) {

        const data =
            conversationDocument.data();


        if (
            Array.isArray(
                data.members
            ) &&
            data.members.length === 2 &&
            data.members.includes(
                otherUserId
            )
        ) {

            return conversationDocument.id;
        }

    }


    return null;
}


/* =========================================================
   ABRIR CONVERSACIÓN
   ========================================================= */

async function openConversation(
    otherUserId,
    otherUser
) {

    try {

        currentOtherUser = {

            id: otherUserId,

            ...otherUser

        };


        let conversationId =
            await findConversation(
                otherUserId
            );


        if (!conversationId) {

            const conversationReference =
                await addDoc(

                    collection(
                        db,
                        "conversations"
                    ),

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


            conversationId =
                conversationReference.id;

        }


        currentConversationId =
            conversationId;


        welcome.classList.add(
            "hidden"
        );


        chatWindow.classList.remove(
            "hidden"
        );


        chatTitle.textContent =
            "@" +
            otherUser.username;


        chatStatus.textContent =
            "Chat privado";


        loadMessages(
            conversationId
        );


    } catch (error) {

        console.error(
            "Error abriendo conversación:",
            error
        );

    }

}


/* =========================================================
   CARGAR MENSAJES
   ========================================================= */

function loadMessages(
    conversationId
) {

    messages.innerHTML = "";


    if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages = null;

    }


    const messagesQuery =
        query(

            collection(
                db,
                "conversations",
                conversationId,
                "messages"
            ),

            orderBy(
                "createdAt",
                "asc"
            )

        );


    unsubscribeMessages =
        onSnapshot(

            messagesQuery,

            function (snapshot) {

                messages.innerHTML = "";


                snapshot.forEach(
                    function (messageDocument) {

                        const message =
                            messageDocument.data();


                        renderMessage(
                            message
                        );

                    }
                );


                messages.scrollTop =
                    messages.scrollHeight;

            },

            function (error) {

                console.error(
                    "Error cargando mensajes:",
                    error
                );

            }

        );

}


/* =========================================================
   MOSTRAR MENSAJE
   ========================================================= */

function renderMessage(
    message
) {

    const messageElement =
        document.createElement(
            "div"
        );


    const isMine =
        message.senderId ===
        currentUser.uid;


    messageElement.className =
        isMine
            ? "message sent"
            : "message received";


    const contentElement =
        document.createElement(
            "div"
        );


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


/* =========================================================
   ENVIAR MENSAJE
   ========================================================= */

sendButton.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


async function sendMessage() {

    const content =
        messageInput.value.trim();


    if (!content) {

        return;
    }


    if (!currentConversationId) {

        return;
    }


    const originalContent =
        content;


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


    } catch (error) {

        console.error(
            "Error enviando mensaje:",
            error
        );


        messageInput.value =
            originalContent;

    } finally {

        sendButton.disabled = false;

    }

}


/* =========================================================
   CARGAR CHATS
   ========================================================= */

function loadConversations() {

    if (unsubscribeConversations) {

        unsubscribeConversations();

        unsubscribeConversations = null;

    }


    const conversationsQuery =
        query(

            collection(
                db,
                "conversations"
            ),

            where(
                "members",
                "array-contains",
                currentUser.uid
            )

        );


    unsubscribeConversations =
        onSnapshot(

            conversationsQuery,

            async function (snapshot) {

                chatList.innerHTML = "";


                for (
                    const conversationDocument
                    of snapshot.docs
                ) {

                    const conversation =
                        conversationDocument.data();


                    const otherUserId =
                        conversation.members.find(
                            function (id) {

                                return id !==
                                    currentUser.uid;

                            }
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


                    if (
                        !userSnapshot.exists()
                    ) {

                        continue;
                    }


                    const user =
                        userSnapshot.data();


                    const chatButton =
                        document.createElement(
                            "button"
                        );


                    chatButton.type =
                        "button";


                    chatButton.className =
                        "chat-list-item";


                    chatButton.textContent =
                        "@" +
                        user.username;


                    chatButton.addEventListener(
                        "click",
                        function () {

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

            function (error) {

                console.error(
                    "Error cargando chats:",
                    error
                );

            }

        );

}
