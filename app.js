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

const authScreen =
document.getElementById("authScreen");

const app =
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

const createGroupButton =
document.getElementById("createGroupButton");

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

const characterCounter =
document.getElementById("characterCounter");

const sendButton =
document.getElementById("sendButton");

const deleteChatButton =
document.getElementById("deleteChatButton");

/* =========================
GRUPOS
========================= */

const groupModal =
document.getElementById("groupModal");

const groupName =
document.getElementById("groupName");

const groupUsers =
document.getElementById("groupUsers");

const cancelGroupButton =
document.getElementById("cancelGroupButton");

const confirmGroupButton =
document.getElementById("confirmGroupButton");

/* =========================
VARIABLES
========================= */

let currentUser = null;

let currentProfile = null;

let currentConversationId = null;

let currentOtherUser = null;

let currentConversationData = null;

let unsubscribeMessages = null;

let unsubscribeChats = null;

let creatingAccount = false;

let searchTimeout = null;

/* =========================
AUTENTICACIÓN
========================= */

function showAuthMessage(
message,
error = false
) {

```
authMessage.textContent =
    message;

authMessage.style.color =
    error
        ? "#ff4d4d"
        : "";
```

}

function showApp() {

```
authScreen.classList.add(
    "hidden"
);

app.classList.remove(
    "hidden"
);
```

}

function showAuth() {

```
app.classList.add(
    "hidden"
);

authScreen.classList.remove(
    "hidden"
);
```

}

function showLoginForm() {

```
loginForm.classList.remove(
    "hidden"
);

registerForm.classList.add(
    "hidden"
);

showAuthMessage("");
```

}

function showRegisterForm() {

```
loginForm.classList.add(
    "hidden"
);

registerForm.classList.remove(
    "hidden"
);

showAuthMessage("");
```

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

```
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

    const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


    const user =
        userCredential.user;


    const usernameLower =
        username.toLowerCase();


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


    currentUser =
        user;


    currentProfile = {
        username: username,

        usernameLower:
            usernameLower,

        email: email
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
        "ERROR REGISTRO:",
        error
    );


    let message =
        error.code +
        " - " +
        error.message;


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
            "La contraseña es demasiado débil.";
    }

    else if (
        error.code ===
        "auth/operation-not-allowed"
    ) {

        message =
            "Email/contraseña no está habilitado en Firebase.";
    }

    else if (
        error.code ===
        "permission-denied"
    ) {

        message =
            "Firebase rechazó el acceso a Firestore.";
    }


    showAuthMessage(
        message,
        true
    );

} finally {

    registerButton.disabled = false;

    creatingAccount = false;
}
```

}

registerButton.addEventListener(
"click",
register
);

/* =========================
LOGIN
========================= */

async function login() {

```
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

    const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );


    const user =
        userCredential.user;


    const userSnapshot =
        await getDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );


    if (!userSnapshot.exists()) {

        showAuthMessage(
            "La cuenta existe, pero no tiene perfil.",
            true
        );

        await signOut(auth);

        return;
    }


    currentUser =
        user;


    currentProfile =
        userSnapshot.data();


    await enterApp();

} catch (error) {

    console.error(
        "ERROR LOGIN:",
        error
    );


    let message =
        error.code +
        " - " +
        error.message;


    if (
        error.code ===
        "auth/invalid-credential"
    ) {

        message =
            "Correo o contraseña incorrectos.";
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
        "auth/network-request-failed"
    ) {

        message =
            "No se pudo conectar con Firebase.";
    }

    else if (
        error.code ===
        "permission-denied"
    ) {

        message =
            "Firebase rechazó el acceso a Firestore.";
    }


    showAuthMessage(
        message,
        true
    );

} finally {

    loginButton.disabled = false;
}
```

}

loginButton.addEventListener(
"click",
login
);

loginPassword.addEventListener(
"keydown",
event => {

```
    if (event.key === "Enter") {

        event.preventDefault();

        login();
    }
}
```

);

registerPassword.addEventListener(
"keydown",
event => {

```
    if (event.key === "Enter") {

        event.preventDefault();

        register();
    }
}
```

);

/* =========================
PERFIL
========================= */

async function loadUserProfile(user) {

```
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
```

}

/* =========================
ENTRAR
========================= */

async function enterApp() {

```
if (!currentUser) {
    return;
}


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
```

}

/* =========================
ESTADO AUTH
========================= */

onAuthStateChanged(
auth,
async user => {

```
    if (!user) {

        currentUser = null;

        currentProfile = null;

        showAuth();

        return;
    }


    currentUser =
        user;


    if (creatingAccount) {

        return;
    }


    try {

        currentProfile =
            await loadUserProfile(
                user
            );


        if (!currentProfile) {

            await signOut(auth);

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
```

);

/* =========================
LOGOUT
========================= */

logoutButton.addEventListener(
"click",
async () => {

```
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

    currentConversationData = null;

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
}
```

);

/* =========================
BUSCAR USUARIOS
========================= */

userSearch.addEventListener(
"input",
() => {

```
    clearTimeout(
        searchTimeout
    );


    searchTimeout =
        setTimeout(
            searchUsers,
            300
        );
}
```

);

async function searchUsers() {

```
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


    if (
        foundUsers.length === 0
    ) {

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
        "Error buscando:",
        error
    );


    searchResults.innerHTML =
        `
        <div class="no-results">
            Error buscando usuarios.
        </div>
        `;
}
```

}

/* =========================
CHAT PRIVADO
========================= */

async function openConversationWithUser(
otherUserId,
otherUsername
) {

```
if (!currentUser) {
    return;
}


try {

    const conversationId =
        await findOrCreateConversation(
            otherUserId
        );


    const conversationSnapshot =
        await getDoc(
            doc(
                db,
                "conversations",
                conversationId
            )
        );


    currentConversationId =
        conversationId;


    currentOtherUser = {
        id:
            otherUserId,

        username:
            otherUsername
    };


    currentConversationData =
        conversationSnapshot.data();


    chatTitle.textContent =
        otherUsername;


    chatStatus.textContent =
        "Chat privado";


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
        "Error abriendo chat:",
        error
    );
}
```

}

/* =========================
BUSCAR / CREAR CHAT
========================= */

async function findOrCreateConversation(
otherUserId
) {

```
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
        data.type === "group"
    ) {

        continue;
    }


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

            lastMessage:
                "",

            lastMessageAt:
                serverTimestamp()
        }
    );


return newConversation.id;
```

}

/* =========================
MENSAJES
========================= */

async function loadMessages(
conversationId
) {

```
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
                "Error mensajes:",
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
```

}

/* =========================
MOSTRAR MENSAJE
========================= */

function displayMessage(
messageId,
data
) {

```
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


/*
   BOTÓN ELIMINAR
   SOLO PARA TUS MENSAJES
*/

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


            if (
                !confirm(
                    "¿Eliminar este mensaje?"
                )
            ) {

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
                    "Error eliminando mensaje:",
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
```

}

/* =========================
ENVIAR MENSAJE
========================= */

async function sendMessage() {

```
const content =
    messageInput.value.trim();


if (!content) {
    return;
}


if (content.length >
    MAX_MESSAGE_LENGTH) {

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
        "Error enviando:",
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
```

}

sendButton.addEventListener(
"click",
sendMessage
);

messageInput.addEventListener(
"keydown",
event => {

```
    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}
```

);

/* =========================
CONTADOR
========================= */

function updateCharacterCounter() {

```
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
```

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

```
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


                const isGroup =
                    data.type === "group";


                if (isGroup) {

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


                    const user =
                        userSnapshot.data();


                    conversations.push({

                        id:
                            conversationDocument.id,

                        username:
                            user.username ||
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
                        "Error usuario:",
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
                "Error chats:",
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
```

}

/* =========================
ELEMENTO CHAT
========================= */

function createChatElement(
conversation
) {

```
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


element.innerHTML = `

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
    () => {

        openConversation(
            conversation.id
        );
    }
);


chatList.appendChild(
    element
);
```

}

/* =========================
ABRIR CHAT
========================= */

async function openConversation(
conversationId
) {

```
try {

    const snapshot =
        await getDoc(
            doc(
                db,
                "conversations",
                conversationId
            )
        );


    if (!snapshot.exists()) {
        return;
    }


    const data =
        snapshot.data();


    currentConversationId =
        conversationId;


    currentConversationData =
        data;


    if (
        data.type === "group"
    ) {

        currentOtherUser = null;


        chatTitle.textContent =
            data.name ||
            "Grupo";


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


        let username =
            "Usuario";


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
                userSnapshot.exists()
            ) {

                username =
                    userSnapshot.data()
                        .username ||
                    "Usuario";
            }

        } catch (error) {

            console.error(error);
        }


        currentOtherUser = {

            id:
                otherUserId,

            username:
                username
        };


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
        "Error abriendo conversación:",
        error
    );
}
```

}

/* =========================
ELIMINAR CHAT
========================= */

deleteChatButton.addEventListener(
"click",
async () => {

```
    if (!currentConversationId) {
        return;
    }


    if (
        !confirm(
            "¿Eliminar este chat de Firebase?"
        )
    ) {

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


        currentConversationId =
            null;


        currentOtherUser =
            null;


        currentConversationData =
            null;


        messages.innerHTML = "";


        chatWindow.classList.add(
            "hidden"
        );


        welcome.classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(
            "Error eliminando chat:",
            error
        );


        alert(
            "No se pudo eliminar el chat:\n" +
            error.message
        );
    }
}
```

);

/* =========================
CREAR GRUPO
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

```
groupName.value = "";

groupUsers.innerHTML = "";


if (!currentUser) {
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


            label.innerHTML = `

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
        "Error cargando usuarios:",
        error
    );


    alert(
        "No se pudieron cargar los usuarios."
    );
}
```

}

function closeGroupModal() {

```
groupModal.classList.add(
    "hidden"
);
```

}

confirmGroupButton.addEventListener(
"click",
createGroup
);

/* =========================
CREAR GRUPO
========================= */

async function createGroup() {

```
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
        "Error creando grupo:",
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
```

}

/* =========================
SEGURIDAD HTML
========================= */

function escapeHtml(text) {

```
const div =
    document.createElement(
        "div"
    );


div.textContent =
    text || "";


return div.innerHTML;
```

}
