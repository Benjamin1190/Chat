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

import {
    createClient
} from "https://esm.sh/@supabase/supabase-js@2.45.4";

import {
    firebaseConfig,
    ADMIN_USERNAME,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_BUCKET
} from "./config.js";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =====================================================
   SUPABASE (solo para guardar las imágenes)
===================================================== */

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =====================================================
   IMÁGENES
===================================================== */

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

let pendingImageFile = null;


/* =====================================================
   VARIABLES
===================================================== */

let currentUser = null;
let currentProfile = null;

let currentConversationId = null;
let currentOtherUser = null;
let currentConversationData = null;

let messagesUnsubscribe = null;
let conversationsUnsubscribe = null;

let creatingAccount = false;

let usersCache = [];
let adminUsersCache = [];


/* =====================================================
   ELEMENTOS
===================================================== */

const authScreen = document.getElementById("authScreen");

// El contenedor principal de la app en el HTML tiene id="app"
const appScreen = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

// En el HTML los botones se llaman "showRegister" / "showLogin"
const showRegisterButton =
    document.getElementById("showRegister");

const showLoginButton =
    document.getElementById("showLogin");


// En el HTML el nombre de usuario se muestra en el <strong id="currentUser">
const currentUsername =
    document.getElementById("currentUser");

// No existe un elemento dedicado al email en el sidebar; se deja en null
// de forma segura (todo el código que lo usa está protegido con "if").
const currentEmail =
    document.getElementById("currentEmail");

const logoutButton =
    document.getElementById("logoutButton");

const userSearch =
    document.getElementById("userSearch");

const searchResults =
    document.getElementById("searchResults");

const chatList =
    document.getElementById("chatList");

// En el HTML la pantalla de bienvenida tiene id="welcome"
const welcomeScreen =
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

const attachButton =
    document.getElementById("attachButton");

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const imagePreviewThumb =
    document.getElementById("imagePreviewThumb");

const removeImageButton =
    document.getElementById("removeImageButton");


/* =====================================================
   GRUPOS
===================================================== */

const createGroupButton =
    document.getElementById("createGroupButton");

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


/* =====================================================
   ADMIN
===================================================== */

const adminButton =
    document.getElementById("adminButton");

const adminPanel =
    document.getElementById("adminPanel");

const adminCloseButton =
    document.getElementById("adminCloseButton");

const adminSearch =
    document.getElementById("adminSearch");

const adminSyncButton =
    document.getElementById("adminSyncButton");

const adminSyncStatus =
    document.getElementById("adminSyncStatus");

const adminUsers =
    document.getElementById("adminUsers");

const adminEmpty =
    document.getElementById("adminEmpty");

const adminDetails =
    document.getElementById("adminDetails");

const adminDetailName =
    document.getElementById("adminDetailName");

const adminDetailEmail =
    document.getElementById("adminDetailEmail");

const adminDetailUid =
    document.getElementById("adminDetailUid");

const adminDetailCreated =
    document.getElementById("adminDetailCreated");

const adminHistory =
    document.getElementById("adminHistory");


/* =====================================================
   PANTALLAS
===================================================== */

function showLoginScreen() {

    if (authScreen) {
        authScreen.classList.remove("hidden");
    }

    if (appScreen) {
        appScreen.classList.add("hidden");
    }

    if (loginForm) {
        loginForm.classList.remove("hidden");
    }

    if (registerForm) {
        registerForm.classList.add("hidden");
    }
}


function showAppScreen() {

    if (authScreen) {
        authScreen.classList.add("hidden");
    }

    if (appScreen) {
        appScreen.classList.remove("hidden");
    }
}


function showWelcome() {

    if (welcomeScreen) {
        welcomeScreen.classList.remove("hidden");
    }

    if (chatWindow) {
        chatWindow.classList.add("hidden");
    }
}


/* =====================================================
   CAMBIAR LOGIN / REGISTRO
===================================================== */

if (showRegisterButton) {

    showRegisterButton.addEventListener("click", function () {

        if (loginForm) {
            loginForm.classList.add("hidden");
        }

        if (registerForm) {
            registerForm.classList.remove("hidden");
        }
    });
}


if (showLoginButton) {

    showLoginButton.addEventListener("click", function () {

        if (registerForm) {
            registerForm.classList.add("hidden");
        }

        if (loginForm) {
            loginForm.classList.remove("hidden");
        }
    });
}


/* =====================================================
   REGISTRAR
===================================================== */

async function register() {

    const username =
        registerUsername?.value.trim();

    const email =
        registerEmail?.value.trim();

    const password =
        registerPassword?.value;


    if (!username || !email || !password) {

        alert("Completá todos los campos.");

        return;
    }


    if (username.length < 3) {

        alert(
            "El nombre de usuario debe tener al menos 3 caracteres."
        );

        return;
    }


    if (password.length < 6) {

        alert(
            "La contraseña debe tener al menos 6 caracteres."
        );

        return;
    }


    creatingAccount = true;


    try {

        const usernameLower =
            username.toLowerCase();


        const usersQuery =
            query(
                collection(db, "users"),
                where(
                    "usernameLower",
                    "==",
                    usernameLower
                )
            );


        const existingUsers =
            await getDocs(usersQuery);


        if (!existingUsers.empty) {

            alert(
                "Ese nombre de usuario ya existe."
            );

            creatingAccount = false;

            return;
        }


        const account =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        await setDoc(
            doc(
                db,
                "users",
                account.user.uid
            ),
            {
                username: username,
                usernameLower: usernameLower,
                email: email,
                createdAt: serverTimestamp()
            }
        );


        alert(
            "Cuenta creada correctamente."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Error al crear la cuenta:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );

    } finally {

        creatingAccount = false;
    }
}


/* =====================================================
   INICIAR SESIÓN
===================================================== */

async function login() {

    const email =
        loginEmail?.value.trim();

    const password =
        loginPassword?.value;


    if (!email || !password) {

        alert(
            "Ingresá el correo y la contraseña."
        );

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
            "Error al iniciar sesión:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );
    }
}


/* =====================================================
   FORMULARIOS
===================================================== */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            login();
        }
    );
}


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            register();
        }
    );
}


/* =====================================================
   AUTENTICACIÓN
===================================================== */

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            if (creatingAccount) {
                return;
            }

            currentUser = null;
            currentProfile = null;

            showLoginScreen();

            return;
        }


        currentUser = user;


        try {

            const profileSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (!profileSnapshot.exists()) {

                alert(
                    "Tu cuenta existe, pero no se encontró tu perfil."
                );

                return;
            }


            currentProfile =
                profileSnapshot.data();


            if (currentUsername) {

                currentUsername.textContent =
                    "@" +
                    currentProfile.username;
            }


            if (currentEmail) {

                currentEmail.textContent =
                    currentProfile.email ||
                    user.email ||
                    "";
            }


            updateAdminButton();

            showAppScreen();

            await loadUsers();

            loadConversations();

            showWelcome();


        } catch (error) {

            console.error(error);

            alert(
                "Error de Firebase:\n\n" +
                error.code +
                "\n\n" +
                error.message
            );
        }
    }
);


/* =====================================================
   ADMIN BUTTON
===================================================== */

function updateAdminButton() {

    if (!adminButton) {
        return;
    }


    const isAdmin =
        currentProfile &&
        currentProfile.usernameLower ===
            ADMIN_USERNAME;


    if (isAdmin) {

        adminButton.classList.remove(
            "hidden"
        );

    } else {

        adminButton.classList.add(
            "hidden"
        );
    }
}


/* =====================================================
   CERRAR SESIÓN
===================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                if (messagesUnsubscribe) {
                    messagesUnsubscribe();
                    messagesUnsubscribe = null;
                }

                if (conversationsUnsubscribe) {
                    conversationsUnsubscribe();
                    conversationsUnsubscribe = null;
                }

                await signOut(auth);

            } catch (error) {

                console.error(error);

                alert(
                    "No se pudo cerrar sesión."
                );
            }
        }
    );
}


/* =====================================================
   CARGAR PERSONAS
===================================================== */

async function loadUsers() {

    if (!currentUser) {
        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );


        usersCache = [];


        snapshot.forEach(
            function (item) {

                if (
                    item.id ===
                    currentUser.uid
                ) {
                    return;
                }


                usersCache.push({
                    uid: item.id,
                    ...item.data()
                });
            }
        );


        usersCache.sort(
            function (a, b) {

                return (
                    (a.username || "")
                        .toLowerCase()
                        .localeCompare(
                            (b.username || "")
                                .toLowerCase()
                        )
                );
            }
        );


        showPeople("");

    } catch (error) {

        console.error(
            "Error cargando personas:",
            error
        );
    }
}


/* =====================================================
   MOSTRAR PERSONAS
===================================================== */

function showPeople(search) {

    if (!searchResults) {
        return;
    }


    const text =
        (search || "")
            .trim()
            .toLowerCase();


    const results =
        usersCache.filter(
            function (user) {

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


                return (
                    username.includes(text) ||
                    email.includes(text)
                );
            }
        );


    searchResults.innerHTML = "";


    if (results.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-state";

        empty.textContent =
            "No hay personas.";

        searchResults.appendChild(
            empty
        );

        searchResults.classList.remove(
            "hidden"
        );

        return;
    }


    results.forEach(
        function (user) {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "search-user";


            const avatar =
                document.createElement("div");

            avatar.className =
                "user-avatar";

            avatar.textContent =
                (
                    user.username ||
                    "?"
                )
                    .charAt(0)
                    .toUpperCase();


            const info =
                document.createElement("div");

            info.className =
                "user-search-information";


            const name =
                document.createElement("strong");

            name.textContent =
                "@" +
                (
                    user.username ||
                    "usuario"
                );


            const email =
                document.createElement("span");

            email.textContent =
                user.email ||
                "";


            info.appendChild(name);
            info.appendChild(email);

            button.appendChild(avatar);
            button.appendChild(info);


            button.addEventListener(
                "click",
                function () {

                    openUserChat(user);

                    if (userSearch) {
                        userSearch.value = "";
                    }

                    searchResults.classList.add(
                        "hidden"
                    );
                }
            );


            searchResults.appendChild(
                button
            );
        }
    );


    searchResults.classList.remove(
        "hidden"
    );
}


if (userSearch) {

    userSearch.addEventListener(
        "input",
        function () {

            showPeople(
                userSearch.value
            );
        }
    );


    userSearch.addEventListener(
        "focus",
        function () {

            showPeople(
                userSearch.value
            );
        }
    );
}


/* =====================================================
   CHAT INDIVIDUAL
===================================================== */

async function openUserChat(user) {

    try {

        const conversationId =
            await findOrCreateChat(
                user.uid
            );


        const data =
            await getDoc(
                doc(
                    db,
                    "conversations",
                    conversationId
                )
            );


        openChat(
            conversationId,
            data.exists()
                ? data.data()
                : {
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
            "No se pudo abrir el chat:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );
    }
}


/* =====================================================
   BUSCAR CHAT EXISTENTE
===================================================== */

async function findOrCreateChat(otherUid) {

    const q =
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
        await getDocs(q);


    for (
        const item of snapshot.docs
    ) {

        const data =
            item.data();


        if (
            data.isGroup === true
        ) {
            continue;
        }


        if (
            Array.isArray(
                data.members
            ) &&
            data.members.length === 2 &&
            data.members.includes(
                otherUid
            )
        ) {

            return item.id;
        }
    }


    const newChat =
        await addDoc(
            collection(
                db,
                "conversations"
            ),
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


    return newChat.id;
}


/* =====================================================
   ABRIR CHAT
===================================================== */

function openChat(
    conversationId,
    conversationData,
    otherUser
) {

    currentConversationId =
        conversationId;

    currentConversationData =
        conversationData;

    currentOtherUser =
        otherUser || null;


    if (welcomeScreen) {
        welcomeScreen.classList.add(
            "hidden"
        );
    }

    if (chatWindow) {
        chatWindow.classList.remove(
            "hidden"
        );
    }


    if (
        conversationData &&
        conversationData.isGroup === true
    ) {

        if (chatTitle) {

            chatTitle.textContent =
                conversationData.groupName ||
                "Grupo";
        }


        if (chatStatus) {

            const count =
                Array.isArray(
                    conversationData.members
                )
                    ? conversationData.members.length
                    : 0;


            chatStatus.textContent =
                "Grupo · " +
                count +
                " personas";
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
                otherUser?.email ||
                "Chat";
        }
    }


    loadMessages(
        conversationId
    );
}


/* =====================================================
   MENSAJES
===================================================== */

function loadMessages(conversationId) {

    if (messagesUnsubscribe) {

        messagesUnsubscribe();

        messagesUnsubscribe = null;
    }


    if (!messages) {
        return;
    }


    messages.innerHTML = "";


    const q =
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


    messagesUnsubscribe =
        onSnapshot(
            q,
            function (snapshot) {

                messages.innerHTML = "";


                if (snapshot.empty) {

                    const empty =
                        document.createElement("div");

                    empty.className =
                        "empty-messages";

                    empty.textContent =
                        "Todavía no hay mensajes.";

                    messages.appendChild(
                        empty
                    );

                    return;
                }


                snapshot.forEach(
                    function (item) {

                        showMessage(
                            item.data()
                        );
                    }
                );


                messages.scrollTop =
                    messages.scrollHeight;
            },


            function (error) {

                console.error(error);

                messages.innerHTML =
                    "<div class='empty-state'>Error cargando mensajes.</div>";
            }
        );
}


/* =====================================================
   MOSTRAR MENSAJE
===================================================== */

function showMessage(data) {

    if (!messages) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message-wrapper";


    if (
        data.senderId ===
        currentUser.uid
    ) {

        wrapper.classList.add(
            "own"
        );

    } else {

        wrapper.classList.add(
            "other"
        );
    }


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";


    if (data.imageUrl) {

        const image =
            document.createElement("img");

        image.className =
            "message-image";

        image.src =
            data.imageUrl;

        image.alt =
            "Imagen enviada";

        image.loading =
            "lazy";


        image.addEventListener(
            "click",
            function () {

                window.open(
                    data.imageUrl,
                    "_blank"
                );
            }
        );


        bubble.appendChild(
            image
        );
    }


    if (data.content) {

        const text =
            document.createElement("div");

        text.className =
            "message-text";

        text.textContent =
            data.content;

        bubble.appendChild(
            text
        );
    }


    const time =
        document.createElement("div");

    time.className =
        "message-time";


    if (
        data.createdAt &&
        typeof data.createdAt.toDate ===
            "function"
    ) {

        time.textContent =
            data.createdAt
                .toDate()
                .toLocaleTimeString(
                    "es-UY",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );
    }


    wrapper.appendChild(
        bubble
    );

    wrapper.appendChild(
        time
    );

    messages.appendChild(
        wrapper
    );
}


/* =====================================================
   SELECCIONAR IMAGEN
===================================================== */

if (attachButton) {

    attachButton.addEventListener(
        "click",
        function () {

            if (imageInput) {
                imageInput.click();
            }
        }
    );
}


if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            const file =
                imageInput.files &&
                imageInput.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Elegí un archivo de imagen válido."
                );

                imageInput.value = "";

                return;
            }


            if (
                file.size >
                MAX_IMAGE_SIZE
            ) {

                alert(
                    "La imagen no puede pesar más de 5 MB."
                );

                imageInput.value = "";

                return;
            }


            pendingImageFile = file;


            if (
                imagePreview &&
                imagePreviewThumb
            ) {

                imagePreviewThumb.src =
                    URL.createObjectURL(
                        file
                    );

                imagePreview.classList.remove(
                    "hidden"
                );
            }
        }
    );
}


if (removeImageButton) {

    removeImageButton.addEventListener(
        "click",
        clearPendingImage
    );
}


function clearPendingImage() {

    pendingImageFile = null;


    if (imageInput) {
        imageInput.value = "";
    }


    if (imagePreview) {

        imagePreview.classList.add(
            "hidden"
        );
    }


    if (imagePreviewThumb) {

        imagePreviewThumb.src = "";
    }
}


/* =====================================================
   ENVIAR
===================================================== */

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


    if (!content && !pendingImageFile) {
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

        let imageUrl = null;


        if (pendingImageFile) {

            const safeName =
                pendingImageFile.name.replace(
                    /[^a-zA-Z0-9.\-_]/g,
                    "_"
                );


            const path =
                currentConversationId +
                "/" +
                Date.now() +
                "_" +
                safeName;


            const uploadResult =
                await supabase
                    .storage
                    .from(
                        SUPABASE_BUCKET
                    )
                    .upload(
                        path,
                        pendingImageFile,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );


            if (uploadResult.error) {

                throw uploadResult.error;
            }


            const publicUrlResult =
                supabase
                    .storage
                    .from(
                        SUPABASE_BUCKET
                    )
                    .getPublicUrl(
                        path
                    );


            imageUrl =
                publicUrlResult.data.publicUrl;
        }


        const messageData = {
            senderId: currentUser.uid,
            content: content,
            createdAt: serverTimestamp()
        };


        if (imageUrl) {
            messageData.imageUrl = imageUrl;
        }


        await addDoc(
            collection(
                db,
                "conversations",
                currentConversationId,
                "messages"
            ),
            messageData
        );


        await setDoc(
            doc(
                db,
                "conversations",
                currentConversationId
            ),
            {
                lastMessage:
                    content ||
                    (
                        imageUrl
                            ? "📷 Imagen"
                            : ""
                    ),
                lastMessageAt: serverTimestamp()
            },
            {
                merge: true
            }
        );


        messageInput.value = "";

        clearPendingImage();

        updateCounter();

        messageInput.focus();


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo enviar el mensaje:\n\n" +
            (error.code || error.name || "Error") +
            "\n\n" +
            (error.message || "")
        );

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }
    }
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
        updateCounter
    );


    messageInput.addEventListener(
        "keydown",
        function (event) {

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


function updateCounter() {

    if (
        messageInput &&
        characterCounter
    ) {

        characterCounter.textContent =
            messageInput.value.length +
            "/4000";
    }
}


/* =====================================================
   LISTA DE CHATS
===================================================== */

function loadConversations() {

    if (!currentUser || !chatList) {
        return;
    }


    if (conversationsUnsubscribe) {

        conversationsUnsubscribe();

        conversationsUnsubscribe = null;
    }


    const q =
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


    conversationsUnsubscribe =
        onSnapshot(
            q,
            async function (snapshot) {

                chatList.innerHTML = "";


                if (snapshot.empty) {

                    const empty =
                        document.createElement("div");

                    empty.className =
                        "empty-state";

                    empty.textContent =
                        "No tenés chats todavía.";

                    chatList.appendChild(
                        empty
                    );

                    return;
                }


                for (
                    const item of snapshot.docs
                ) {

                    const data =
                        item.data();


                    if (
                        data.isGroup === true
                    ) {

                        chatList.appendChild(
                            createGroupChatItem(
                                item.id,
                                data
                            )
                        );

                        continue;
                    }


                    const otherUid =
                        (
                            data.members || []
                        ).find(
                            function (uid) {

                                return (
                                    uid !==
                                    currentUser.uid
                                );
                            }
                        );


                    if (!otherUid) {
                        continue;
                    }


                    let user =
                        usersCache.find(
                            function (u) {

                                return (
                                    u.uid ===
                                    otherUid
                                );
                            }
                        );


                    if (!user) {

                        try {

                            const userSnapshot =
                                await getDoc(
                                    doc(
                                        db,
                                        "users",
                                        otherUid
                                    )
                                );


                            if (
                                userSnapshot.exists()
                            ) {

                                user = {
                                    uid: otherUid,
                                    ...userSnapshot.data()
                                };
                            }

                        } catch (error) {

                            console.error(error);
                        }
                    }


                    if (!user) {
                        continue;
                    }


                    chatList.appendChild(
                        createChatItem(
                            item.id,
                            data,
                            user
                        )
                    );
                }
            },


            function (error) {

                console.error(error);

                chatList.innerHTML =
                    "<div class='empty-state'>Error cargando chats.</div>";
            }
        );
}


/* =====================================================
   ITEM CHAT
===================================================== */

function createChatItem(
    id,
    data,
    user
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "chat-list-item";


    const avatar =
        document.createElement("div");

    avatar.className =
        "chat-avatar";

    avatar.textContent =
        (
            user.username ||
            "?"
        )
            .charAt(0)
            .toUpperCase();


    const info =
        document.createElement("div");

    info.className =
        "chat-list-information";


    const name =
        document.createElement("strong");

    name.textContent =
        "@" +
        (
            user.username ||
            "usuario"
        );


    const last =
        document.createElement("span");

    last.textContent =
        data.lastMessage ||
        "Sin mensajes";


    info.appendChild(name);
    info.appendChild(last);

    button.appendChild(avatar);
    button.appendChild(info);


    button.addEventListener(
        "click",
        function () {

            openChat(
                id,
                data,
                user
            );
        }
    );


    return button;
}


/* =====================================================
   ITEM GRUPO
===================================================== */

function createGroupChatItem(
    id,
    data
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "chat-list-item";


    const avatar =
        document.createElement("div");

    avatar.className =
        "chat-avatar";

    avatar.textContent =
        "👥";


    const info =
        document.createElement("div");

    info.className =
        "chat-list-information";


    const name =
        document.createElement("strong");

    name.textContent =
        data.groupName ||
        "Grupo";


    const last =
        document.createElement("span");

    last.textContent =
        data.lastMessage ||
        "Grupo nuevo";


    info.appendChild(name);
    info.appendChild(last);

    button.appendChild(avatar);
    button.appendChild(info);


    button.addEventListener(
        "click",
        function () {

            openChat(
                id,
                data,
                null
            );
        }
    );


    return button;
}


/* =====================================================
   BORRAR CHAT
===================================================== */

if (deleteChatButton) {

    deleteChatButton.addEventListener(
        "click",
        async function () {

            if (!currentConversationId) {
                return;
            }


            if (
                !confirm(
                    "¿Querés borrar esta conversación?"
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


                currentConversationId =
                    null;

                currentOtherUser =
                    null;

                currentConversationData =
                    null;


                if (messagesUnsubscribe) {

                    messagesUnsubscribe();

                    messagesUnsubscribe = null;
                }


                showWelcome();


            } catch (error) {

                console.error(error);

                alert(
                    "No se pudo borrar el chat:\n\n" +
                    error.code +
                    "\n\n" +
                    error.message
                );
            }
        }
    );
}


/* =====================================================
   CREAR GRUPO
===================================================== */

if (createGroupButton) {

    createGroupButton.addEventListener(
        "click",
        openGroupModal
    );
}


async function openGroupModal() {

    if (!groupModal) {
        return;
    }


    if (groupName) {
        groupName.value = "";
    }


    await loadGroupUsers();


    groupModal.classList.remove(
        "hidden"
    );
}


if (cancelGroupButton) {

    cancelGroupButton.addEventListener(
        "click",
        closeGroupModal
    );
}


function closeGroupModal() {

    if (groupModal) {

        groupModal.classList.add(
            "hidden"
        );
    }
}


async function loadGroupUsers() {

    if (!groupUsers) {
        return;
    }


    if (usersCache.length === 0) {

        await loadUsers();
    }


    groupUsers.innerHTML = "";


    if (usersCache.length === 0) {

        groupUsers.textContent =
            "No hay otras personas registradas.";

        return;
    }


    usersCache.forEach(
        function (user) {

            const label =
                document.createElement("label");

            label.className =
                "group-user";


            const checkbox =
                document.createElement("input");

            checkbox.type =
                "checkbox";

            checkbox.value =
                user.uid;


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
        }
    );
}


if (confirmGroupButton) {

    confirmGroupButton.addEventListener(
        "click",
        createGroup
    );
}


async function createGroup() {

    const name =
        groupName?.value.trim();


    if (!name) {

        alert(
            "Escribí un nombre para el grupo."
        );

        return;
    }


    if (!groupUsers) {
        return;
    }


    const checked =
        Array.from(
            groupUsers.querySelectorAll(
                "input[type='checkbox']:checked"
            )
        );


    if (checked.length === 0) {

        alert(
            "Seleccioná al menos una persona."
        );

        return;
    }


    const members = [
        currentUser.uid,
        ...checked.map(
            function (checkbox) {

                return checkbox.value;
            }
        )
    ];


    try {

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


        openChat(
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
            "No se pudo crear el grupo:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );
    }
}


/* =====================================================
   ADMIN
===================================================== */

if (adminButton) {

    adminButton.addEventListener(
        "click",
        openAdmin
    );
}


async function openAdmin() {

    if (
        !currentProfile ||
        currentProfile.usernameLower !==
            ADMIN_USERNAME
    ) {
        return;
    }


    if (!adminPanel) {
        return;
    }


    adminPanel.classList.remove(
        "hidden"
    );


    if (adminDetails) {
        adminDetails.classList.add(
            "hidden"
        );
    }


    await loadAdminUsers();
}


if (adminCloseButton) {

    adminCloseButton.addEventListener(
        "click",
        function () {

            if (adminPanel) {

                adminPanel.classList.add(
                    "hidden"
                );
            }
        }
    );
}


if (adminSyncButton) {

    adminSyncButton.addEventListener(
        "click",
        loadAdminUsers
    );
}


if (adminSearch) {

    adminSearch.addEventListener(
        "input",
        renderAdminUsers
    );
}


/* =====================================================
   ADMIN - USUARIOS
===================================================== */

async function loadAdminUsers() {

    if (!adminUsers) {
        return;
    }


    if (adminSyncStatus) {

        adminSyncStatus.textContent =
            "Cargando...";
    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        adminUsersCache = [];


        snapshot.forEach(
            function (item) {

                adminUsersCache.push({
                    uid: item.id,
                    ...item.data()
                });
            }
        );


        adminUsersCache.sort(
            function (a, b) {

                return (
                    (a.username || "")
                        .toLowerCase()
                        .localeCompare(
                            (
                                b.username ||
                                ""
                            ).toLowerCase()
                        )
                );
            }
        );


        renderAdminUsers();


        if (adminSyncStatus) {

            adminSyncStatus.textContent =
                adminUsersCache.length +
                " usuarios";
        }


    } catch (error) {

        console.error(error);

        if (adminSyncStatus) {

            adminSyncStatus.textContent =
                "Error";
        }


        alert(
            "Error cargando usuarios:\n\n" +
            error.code +
            "\n\n" +
            error.message
        );
    }
}


/* =====================================================
   ADMIN - LISTA
===================================================== */

function renderAdminUsers() {

    if (!adminUsers) {
        return;
    }


    const search =
        (
            adminSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const filtered =
        adminUsersCache.filter(
            function (user) {

                return (
                    (
                        user.username ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)
                    ||
                    (
                        user.email ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)
                    ||
                    (
                        user.uid ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)
                );
            }
        );


    adminUsers.innerHTML = "";


    if (adminEmpty) {

        adminEmpty.classList.toggle(
            "hidden",
            filtered.length > 0
        );
    }


    filtered.forEach(
        function (user) {

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
                    "usuario"
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
                function () {

                    showAdminDetails(
                        user
                    );
                }
            );


            adminUsers.appendChild(
                button
            );
        }
    );
}


/* =====================================================
   ADMIN - DETALLES
===================================================== */

async function showAdminDetails(user) {

    if (!adminDetails) {
        return;
    }


    adminDetails.classList.remove(
        "hidden"
    );


    if (adminDetailName) {

        adminDetailName.textContent =
            "@" +
            (
                user.username ||
                "usuario"
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

        if (
            user.createdAt &&
            typeof user.createdAt.toDate ===
                "function"
        ) {

            adminDetailCreated.textContent =
                user.createdAt
                    .toDate()
                    .toLocaleString(
                        "es-UY"
                    );

        } else {

            adminDetailCreated.textContent =
                "Desconocido";
        }
    }


    await loadAdminHistory(
        user.uid
    );
}


/* =====================================================
   ADMIN - HISTORIAL
===================================================== */

async function loadAdminHistory(uid) {

    if (!adminHistory) {
        return;
    }


    adminHistory.textContent =
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
                "No tiene conversaciones.";

            return;
        }


        for (
            const item of snapshot.docs
        ) {

            const data =
                item.data();


            const box =
                document.createElement("div");

            box.className =
                "admin-history-item";


            const title =
                document.createElement("strong");


            if (
                data.isGroup === true
            ) {

                title.textContent =
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
                        function (id) {

                            return id !== uid;
                        }
                    );


                const other =
                    adminUsersCache.find(
                        function (u) {

                            return (
                                u.uid ===
                                otherUid
                            );
                        }
                    );


                title.textContent =
                    "@" +
                    (
                        other?.username ||
                        "usuario"
                    );
            }


            const last =
                document.createElement("span");

            last.textContent =
                data.lastMessage ||
                "Sin mensajes";


            box.appendChild(title);
            box.appendChild(last);


            adminHistory.appendChild(
                box
            );
        }


    } catch (error) {

        console.error(error);

        adminHistory.textContent =
            "No se pudo cargar el historial.";
    }
}


/* =====================================================
   FIN
===================================================== */

updateCounter();
