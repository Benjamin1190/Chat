import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";


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
const functions = getFunctions(firebaseApp);

const ADMIN_EMAIL = "minibenja2016@gmail.com";


/* =========================================================
   ELEMENTOS
========================================================= */

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
const logoutButton = document.getElementById("logoutButton");

const userSearch = document.getElementById("userSearch");
const searchResults = document.getElementById("searchResults");

const createGroupButton = document.getElementById("createGroupButton");
const chatList = document.getElementById("chatList");

const welcome = document.getElementById("welcome");
const chatWindow = document.getElementById("chatWindow");

const chatTitle = document.getElementById("chatTitle");
const chatStatus = document.getElementById("chatStatus");

const messagesElement = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const characterCounter = document.getElementById("characterCounter");
const sendButton = document.getElementById("sendButton");

const deleteChatButton = document.getElementById("deleteChatButton");

const groupModal = document.getElementById("groupModal");
const groupName = document.getElementById("groupName");
const groupUsers = document.getElementById("groupUsers");

const cancelGroupButton = document.getElementById("cancelGroupButton");
const confirmGroupButton = document.getElementById("confirmGroupButton");

const adminButton = document.getElementById("adminButton");

const adminPanel = document.getElementById("adminPanel");
const adminCloseButton = document.getElementById("adminCloseButton");

const adminUserCount = document.getElementById("adminUserCount");
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
   ESTADO
========================================================= */

let currentUser = null;
let currentUserProfile = null;

let allUsers = [];
let allConversations = [];

let selectedConversationId = null;
let selectedConversation = null;

let selectedAdminUser = null;

let unsubscribeConversations = null;
let unsubscribeMessages = null;
let unsubscribeTyping = null;

let typingTimeout = null;


/* =========================================================
   UTILIDADES
========================================================= */

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}


function formatDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "";
  }

  return date.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}


function formatCreatedDate(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return "Desconocida";
  }

  return timestamp.toDate().toLocaleString("es-UY");
}


function isAdminUser() {
  return (
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL
  );
}


/* =========================================================
   ENLACES CLICKEABLES
========================================================= */

function makeLinksClickable(text) {
  const escaped = escapeHtml(text);

  const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;

  return escaped.replace(urlRegex, (url) => {
    let href = url;

    if (href.toLowerCase().startsWith("www.")) {
      href = "https://" + href;
    }

    return `
      <a
        href="${href}"
        target="_blank"
        rel="noopener noreferrer"
        class="chat-link"
      >${url}</a>
    `;
  });
}


/* =========================================================
   LOGIN / REGISTRO
========================================================= */

function showLoginForm() {
  loginForm?.classList.remove("hidden");
  registerForm?.classList.add("hidden");

  if (authMessage) {
    authMessage.textContent = "";
  }
}


function showRegisterForm() {
  loginForm?.classList.add("hidden");
  registerForm?.classList.remove("hidden");

  if (authMessage) {
    authMessage.textContent = "";
  }
}


showRegister?.addEventListener("click", () => {
  showRegisterForm();
});


showLogin?.addEventListener("click", () => {
  showLoginForm();
});


loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    authMessage.textContent = "Completá todos los campos.";
    return;
  }

  loginButton.disabled = true;
  authMessage.textContent = "Iniciando sesión...";

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginForm.reset();
    authMessage.textContent = "";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      authMessage.textContent =
        "Correo o contraseña incorrectos.";
    } else if (error.code === "auth/invalid-email") {
      authMessage.textContent =
        "El correo no es válido.";
    } else if (error.code === "auth/too-many-requests") {
      authMessage.textContent =
        "Demasiados intentos. Esperá un momento.";
    } else {
      authMessage.textContent =
        error.message;
    }
  }

  loginButton.disabled = false;
});


registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = registerEmail.value.trim();
  const username = registerUsername.value.trim();
  const password = registerPassword.value;

  if (!email || !username || !password) {
    authMessage.textContent =
      "Completá todos los campos.";
    return;
  }

  if (username.length < 3) {
    authMessage.textContent =
      "El nombre debe tener al menos 3 caracteres.";
    return;
  }

  if (password.length < 6) {
    authMessage.textContent =
      "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  registerButton.disabled = true;
  authMessage.textContent =
    "Comprobando nombre de usuario...";

  try {
    const usernameLower =
      username.toLowerCase();

    const usernameQuery = query(
      collection(db, "users"),
      where(
        "usernameLower",
        "==",
        usernameLower
      )
    );

    const usernameSnapshot =
      await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      authMessage.textContent =
        "Ese nombre de usuario ya está usado.";

      registerButton.disabled = false;
      return;
    }

    authMessage.textContent =
      "Creando cuenta...";

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = credential.user;

    /*
      Creamos el perfil inmediatamente después
      de crear la cuenta de Authentication.
    */

    await setDoc(
      doc(db, "users", user.uid),
      {
        username: username,
        usernameLower: usernameLower,
        email: email,
        createdAt: serverTimestamp()
      }
    );

    authMessage.textContent =
      "Cuenta creada correctamente.";

    registerForm.reset();

  } catch (error) {
    console.error(
      "ERROR REGISTRO:",
      error
    );

    if (error.code === "auth/email-already-in-use") {
      authMessage.textContent =
        "Ese correo ya está registrado.";

    } else if (error.code === "auth/invalid-email") {
      authMessage.textContent =
        "El correo no es válido.";

    } else if (error.code === "auth/weak-password") {
      authMessage.textContent =
        "La contraseña es demasiado débil.";

    } else if (error.code === "permission-denied") {
      authMessage.textContent =
        "Firebase rechazó la creación del perfil.";

    } else {
      authMessage.textContent =
        "Error: " + error.message;
    }
  }

  registerButton.disabled = false;
});


logoutButton?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
});


/* =========================================================
   ESTADO DE AUTENTICACIÓN
========================================================= */

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    currentUserProfile = null;

    authScreen?.classList.remove("hidden");
    app?.classList.add("hidden");

    adminPanel?.classList.add("hidden");

    stopConversationListener();
    stopMessageListener();
    stopTypingListener();

    return;
  }

  try {
    const profileRef =
      doc(db, "users", user.uid);

    const profileSnapshot =
      await getDoc(profileRef);

    /*
      Si Authentication tiene usuario pero
      Firestore no tiene perfil, lo reconstruimos.
    */

    if (!profileSnapshot.exists()) {

      const fallbackUsername =
        user.email?.split("@")[0] ||
        "Usuario";

      await setDoc(
        profileRef,
        {
          username: fallbackUsername,
          usernameLower:
            fallbackUsername.toLowerCase(),
          email: user.email || "",
          createdAt: serverTimestamp()
        }
      );

      currentUserProfile = {
        username: fallbackUsername,
        email: user.email || ""
      };

    } else {

      currentUserProfile =
        profileSnapshot.data();
    }

    authScreen?.classList.add("hidden");
    app?.classList.remove("hidden");

    if (currentUserElement) {
      currentUserElement.textContent =
        currentUserProfile.username ||
        user.email ||
        "Usuario";
    }

    if (adminButton) {
      if (isAdminUser()) {
        adminButton.classList.remove("hidden");
      } else {
        adminButton.classList.add("hidden");
      }
    }

    await loadUsers();

    startConversationListener();

    if (
      window.location.pathname === "/admin" &&
      isAdminUser()
    ) {
      openAdminPanel();
    }

  } catch (error) {
    console.error(
      "ERROR CARGANDO PERFIL:",
      error
    );

    authMessage.textContent =
      "No se pudo cargar tu perfil: " +
      error.message;
  }
});


/* =========================================================
   USUARIOS
========================================================= */

async function loadUsers() {
  if (!currentUser) {
    return;
  }

  try {
    const snapshot =
      await getDocs(
        collection(db, "users")
      );

    allUsers = [];

    snapshot.forEach((userDoc) => {
      allUsers.push({
        uid: userDoc.id,
        ...userDoc.data()
      });
    });

    allUsers.sort((a, b) => {
      return (a.username || "").localeCompare(
        b.username || "",
        "es"
      );
    });

  } catch (error) {
    console.error(
      "ERROR CARGANDO USUARIOS:",
      error
    );
  }
}


function getUserById(uid) {
  return (
    allUsers.find(
      (user) => user.uid === uid
    ) || null
  );
}


function getUsername(uid) {
  if (uid === currentUser?.uid) {
    return (
      currentUserProfile?.username ||
      currentUser?.email ||
      "Vos"
    );
  }

  const user = getUserById(uid);

  return user?.username || "Usuario";
}


/* =========================================================
   BUSCAR USUARIOS
========================================================= */

userSearch?.addEventListener(
  "input",
  () => {

    const search =
      userSearch.value
        .trim()
        .toLowerCase();

    if (!search) {
      searchResults.innerHTML = "";
      searchResults.classList.add("hidden");
      return;
    }

    const results =
      allUsers.filter((user) => {

        if (
          user.uid === currentUser?.uid
        ) {
          return false;
        }

        const username =
          (user.username || "")
            .toLowerCase();

        const email =
          (user.email || "")
            .toLowerCase();

        return (
          username.includes(search) ||
          email.includes(search)
        );
      });

    renderSearchResults(results);
  }
);


function renderSearchResults(results) {
  searchResults.innerHTML = "";

  if (results.length === 0) {

    searchResults.innerHTML = `
      <div class="search-empty">
        No se encontraron usuarios.
      </div>
    `;

    searchResults.classList.remove("hidden");
    return;
  }

  results.forEach((user) => {

    const button =
      document.createElement("button");

    button.className =
      "search-result";

    button.innerHTML = `
      <strong>
        ${escapeHtml(
          user.username || "Usuario"
        )}
      </strong>

      <span>
        ${escapeHtml(
          user.email || ""
        )}
      </span>
    `;

    button.addEventListener(
      "click",
      () => {

        openPrivateConversation(user);

        userSearch.value = "";
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
      }
    );

    searchResults.appendChild(button);
  });

  searchResults.classList.remove("hidden");
}


/* =========================================================
   CONVERSACIONES
========================================================= */

function startConversationListener() {
  stopConversationListener();

  if (!currentUser) {
    return;
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
      (snapshot) => {

        allConversations = [];

        snapshot.forEach((conversationDoc) => {

          allConversations.push({
            id: conversationDoc.id,
            ...conversationDoc.data()
          });
        });

        allConversations.sort(
          (a, b) => {

            const timeA =
              a.lastMessageAt?.toMillis?.() ||
              0;

            const timeB =
              b.lastMessageAt?.toMillis?.() ||
              0;

            return timeB - timeA;
          }
        );

        renderConversationList();

        if (selectedConversationId) {

          const updated =
            allConversations.find(
              (conversation) =>
                conversation.id ===
                selectedConversationId
            );

          if (updated) {

            selectedConversation =
              updated;

            updateChatHeader();
          }
        }
      },
      (error) => {

        console.error(
          "ERROR CONVERSACIONES:",
          error
        );
      }
    );
}


function stopConversationListener() {
  if (unsubscribeConversations) {
    unsubscribeConversations();
    unsubscribeConversations = null;
  }
}


function renderConversationList() {
  chatList.innerHTML = "";

  if (allConversations.length === 0) {

    chatList.innerHTML = `
      <div class="chat-list-empty">
        No tenés conversaciones todavía.
      </div>
    `;

    return;
  }

  allConversations.forEach(
    (conversation) => {

      const button =
        document.createElement("button");

      button.className =
        "chat-list-item";

      const title =
        getConversationTitle(
          conversation
        );

      const preview =
        conversation.lastMessage ||
        "Sin mensajes";

      button.innerHTML = `
        <div class="chat-list-main">

          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${escapeHtml(preview)}
          </span>

        </div>

        <div class="chat-list-time">
          ${formatDate(
            conversation.lastMessageAt
          )}
        </div>
      `;

      button.addEventListener(
        "click",
        () => {
          openConversation(
            conversation
          );
        }
      );

      chatList.appendChild(button);
    }
  );
}


function getConversationTitle(
  conversation
) {

  if (
    conversation.type === "group"
  ) {
    return (
      conversation.name ||
      "Grupo"
    );
  }

  const otherUid =
    conversation.members?.find(
      (uid) =>
        uid !== currentUser?.uid
    );

  return (
    getUsername(otherUid) ||
    "Chat"
  );
}


async function openPrivateConversation(
  user
) {

  if (!currentUser || !user) {
    return;
  }

  const existing =
    allConversations.find(
      (conversation) => {

        return (
          conversation.type ===
            "private" &&

          Array.isArray(
            conversation.members
          ) &&

          conversation.members.length ===
            2 &&

          conversation.members.includes(
            currentUser.uid
          ) &&

          conversation.members.includes(
            user.uid
          )
        );
      }
    );

  if (existing) {
    openConversation(existing);
    return;
  }

  try {

    const conversationRef =
      await addDoc(
        collection(
          db,
          "conversations"
        ),
        {
          type: "private",

          members: [
            currentUser.uid,
            user.uid
          ],

          createdAt:
            serverTimestamp(),

          lastMessage: "",

          lastMessageAt:
            serverTimestamp()
        }
      );

    const conversation = {
      id: conversationRef.id,
      type: "private",
      members: [
        currentUser.uid,
        user.uid
      ],
      lastMessage: "",
      lastMessageAt: null
    };

    openConversation(
      conversation
    );

  } catch (error) {

    console.error(
      "ERROR CREANDO CHAT:",
      error
    );

    alert(
      "No se pudo crear el chat: " +
      error.message
    );
  }
}


function openConversation(
  conversation
) {

  selectedConversation =
    conversation;

  selectedConversationId =
    conversation.id;

  welcome?.classList.add("hidden");
  chatWindow?.classList.remove("hidden");

  updateChatHeader();

  startMessageListener(
    conversation.id
  );

  startTypingListener(
    conversation.id
  );
}


function updateChatHeader() {

  if (!selectedConversation) {
    return;
  }

  if (
    selectedConversation.type ===
    "group"
  ) {

    chatTitle.textContent =
      selectedConversation.name ||
      "Grupo";

  } else {

    const otherUid =
      selectedConversation.members?.find(
        (uid) =>
          uid !== currentUser?.uid
      );

    chatTitle.textContent =
      getUsername(otherUid) ||
      "Usuario";
  }
}


/* =========================================================
   MENSAJES
========================================================= */

function startMessageListener(
  conversationId
) {

  stopMessageListener();

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
      (snapshot) => {
        renderMessages(snapshot);
      },
      (error) => {

        console.error(
          "ERROR MENSAJES:",
          error
        );
      }
    );
}


function stopMessageListener() {

  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
}


function renderMessages(
  snapshot
) {

  messagesElement.innerHTML = "";

  snapshot.forEach(
    (messageDoc) => {

      const message = {
        id: messageDoc.id,
        ...messageDoc.data()
      };

      const ownMessage =
        message.senderId ===
        currentUser?.uid;

      /*
        Primero usamos senderName guardado
        en el mensaje.
        Si es un mensaje viejo,
        buscamos el usuario.
      */

      const senderName =
        message.senderName ||
        getUsername(
          message.senderId
        ) ||
        "Usuario";

      const element =
        document.createElement("div");

      element.className =
        ownMessage
          ? "message own"
          : "message";

      let senderHtml = "";

      if (
        selectedConversation?.type ===
          "group" &&
        !ownMessage
      ) {

        senderHtml = `
          <div class="message-sender">
            ${escapeHtml(senderName)}
          </div>
        `;
      }

      let deleteHtml = "";

      if (ownMessage) {

        deleteHtml = `
          <button
            class="delete-message"
            title="Eliminar mensaje"
          >
            🗑
          </button>
        `;
      }

      element.innerHTML = `
        <div class="message-content">

          ${senderHtml}

          <div class="message-text">
            ${makeLinksClickable(
              message.content || ""
            )}
          </div>

          <div class="message-footer">

            <span class="message-time">
              ${formatDate(
                message.createdAt
              )}
            </span>

            ${deleteHtml}

          </div>

        </div>
      `;

      const deleteButton =
        element.querySelector(
          ".delete-message"
        );

      deleteButton?.addEventListener(
        "click",
        async (event) => {

          event.stopPropagation();

          await deleteOwnMessage(
            message.id
          );
        }
      );

      messagesElement.appendChild(
        element
      );
    }
  );

  messagesElement.scrollTop =
    messagesElement.scrollHeight;
}


/* =========================================================
   ENVIAR MENSAJE
========================================================= */

async function sendMessage() {

  if (!currentUser) {
    return;
  }

  if (!selectedConversationId) {
    return;
  }

  const content =
    messageInput.value.trim();

  if (!content) {
    return;
  }

  if (content.length > 4000) {
    return;
  }

  sendButton.disabled = true;

  try {

    const senderName =
      currentUserProfile?.username ||
      currentUser.email ||
      "Usuario";

    await addDoc(
      collection(
        db,
        "conversations",
        selectedConversationId,
        "messages"
      ),
      {
        senderId:
          currentUser.uid,

        senderName:
          senderName,

        content:
          content,

        createdAt:
          serverTimestamp()
      }
    );

    await updateDoc(
      doc(
        db,
        "conversations",
        selectedConversationId
      ),
      {
        lastMessage:
          content,

        lastMessageAt:
          serverTimestamp()
      }
    );

    await setTyping(false);

    messageInput.value = "";

    updateCharacterCounter();

  } catch (error) {

    console.error(
      "ERROR ENVIANDO MENSAJE:",
      error
    );

    alert(
      "No se pudo enviar el mensaje: " +
      error.message
    );
  }

  sendButton.disabled = false;

  messageInput.focus();
}


sendButton?.addEventListener(
  "click",
  sendMessage
);


messageInput?.addEventListener(
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


/* =========================================================
   CONTADOR
========================================================= */

function updateCharacterCounter() {

  if (
    !characterCounter ||
    !messageInput
  ) {
    return;
  }

  characterCounter.textContent =
    `${messageInput.value.length}/4000`;
}


messageInput?.addEventListener(
  "input",
  () => {

    updateCharacterCounter();

    handleTyping();
  }
);


/* =========================================================
   BORRAR MENSAJE PROPIO
========================================================= */

async function deleteOwnMessage(
  messageId
) {

  if (
    !selectedConversationId ||
    !currentUser
  ) {
    return;
  }

  try {

    const messageRef =
      doc(
        db,
        "conversations",
        selectedConversationId,
        "messages",
        messageId
      );

    const snapshot =
      await getDoc(messageRef);

    if (!snapshot.exists()) {
      return;
    }

    const message =
      snapshot.data();

    if (
      message.senderId !==
      currentUser.uid
    ) {
      return;
    }

    await deleteDoc(
      messageRef
    );

  } catch (error) {

    console.error(
      "ERROR BORRANDO MENSAJE:",
      error
    );
  }
}


/* =========================================================
   ESCRIBIENDO
========================================================= */

async function setTyping(
  isTyping
) {

  if (
    !currentUser ||
    !selectedConversationId
  ) {
    return;
  }

  const typingRef =
    doc(
      db,
      "conversations",
      selectedConversationId,
      "typing",
      currentUser.uid
    );

  try {

    if (isTyping) {

      await setDoc(
        typingRef,
        {
          uid:
            currentUser.uid,

          username:
            currentUserProfile?.username ||
            currentUser.email ||
            "Usuario",

          updatedAt:
            serverTimestamp()
        }
      );

    } else {

      await deleteDoc(
        typingRef
      );
    }

  } catch (error) {

    console.error(
      "ERROR TYPING:",
      error
    );
  }
}


function handleTyping() {

  if (!selectedConversationId) {
    return;
  }

  setTyping(true);

  clearTimeout(
    typingTimeout
  );

  typingTimeout =
    setTimeout(
      () => {
        setTyping(false);
      },
      2500
    );
}


function startTypingListener(
  conversationId
) {

  stopTypingListener();

  const typingCollection =
    collection(
      db,
      "conversations",
      conversationId,
      "typing"
    );

  unsubscribeTyping =
    onSnapshot(
      typingCollection,
      (snapshot) => {

        const writers = [];

        snapshot.forEach(
          (typingDoc) => {

            const data =
              typingDoc.data();

            if (
              data.uid !==
              currentUser?.uid
            ) {

              writers.push(
                data.username ||
                getUsername(
                  data.uid
                ) ||
                "Alguien"
              );
            }
          }
        );

        updateTypingText(
          writers
        );
      },
      (error) => {

        console.error(
          "ERROR TYPING LISTENER:",
          error
        );
      }
    );
}


function stopTypingListener() {

  if (unsubscribeTyping) {

    unsubscribeTyping();

    unsubscribeTyping = null;
  }
}


function updateTypingText(
  writers
) {

  if (!chatStatus) {
    return;
  }

  if (writers.length === 0) {

    chatStatus.textContent = "";

    return;
  }

  if (writers.length === 1) {

    chatStatus.textContent =
      `${writers[0]} está escribiendo...`;

    return;
  }

  if (writers.length === 2) {

    chatStatus.textContent =
      `${writers[0]} y ${writers[1]} están escribiendo...`;

    return;
  }

  chatStatus.textContent =
    "Varias personas están escribiendo...";
}


/* =========================================================
   ELIMINAR CONVERSACIÓN
========================================================= */

deleteChatButton?.addEventListener(
  "click",
  async () => {

    if (!selectedConversationId) {
      return;
    }

    const confirmed =
      confirm(
        "¿Querés eliminar esta conversación?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteConversation(
        selectedConversationId
      );

      selectedConversationId =
        null;

      selectedConversation =
        null;

      stopMessageListener();
      stopTypingListener();

      chatWindow?.classList.add("hidden");
      welcome?.classList.remove("hidden");

    } catch (error) {

      console.error(
        "ERROR ELIMINANDO CHAT:",
        error
      );

      alert(
        "No se pudo eliminar el chat: " +
        error.message
      );
    }
  }
);


async function deleteConversation(
  conversationId
) {

  const messagesRef =
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

  const snapshot =
    await getDocs(
      messagesRef
    );

  let batch =
    writeBatch(db);

  let count = 0;

  for (
    const messageDoc of snapshot.docs
  ) {

    batch.delete(
      messageDoc.ref
    );

    count++;

    if (count >= 450) {

      await batch.commit();

      batch =
        writeBatch(db);

      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  await deleteDoc(
    doc(
      db,
      "conversations",
      conversationId
    )
  );
}


/* =========================================================
   GRUPOS
========================================================= */

createGroupButton?.addEventListener(
  "click",
  async () => {

    if (!currentUser) {
      return;
    }

    await loadUsers();

    renderGroupUsers();

    groupName.value = "";

    groupModal?.classList.remove(
      "hidden"
    );
  }
);


function renderGroupUsers() {

  groupUsers.innerHTML = "";

  allUsers
    .filter(
      (user) =>
        user.uid !== currentUser?.uid
    )
    .forEach(
      (user) => {

        const label =
          document.createElement(
            "label"
          );

        label.className =
          "group-user";

        label.innerHTML = `
          <input
            type="checkbox"
            value="${user.uid}"
          >

          <span>

            <strong>
              ${escapeHtml(
                user.username ||
                "Usuario"
              )}
            </strong>

            <small>
              ${escapeHtml(
                user.email || ""
              )}
            </small>

          </span>
        `;

        groupUsers.appendChild(
          label
        );
      }
    );
}


function closeGroupModal() {
  groupModal?.classList.add(
    "hidden"
  );
}


cancelGroupButton?.addEventListener(
  "click",
  closeGroupModal
);


confirmGroupButton?.addEventListener(
  "click",
  async () => {

    if (!currentUser) {
      return;
    }

    const name =
      groupName.value.trim();

    if (!name) {

      alert(
        "Escribí un nombre para el grupo."
      );

      return;
    }

    const selectedInputs =
      [
        ...groupUsers.querySelectorAll(
          'input[type="checkbox"]:checked'
        )
      ];

    if (
      selectedInputs.length === 0
    ) {

      alert(
        "Seleccioná al menos una persona."
      );

      return;
    }

    /*
      Map evita usuarios repetidos.
    */

    const membersMap =
      new Map();

    membersMap.set(
      currentUser.uid,
      true
    );

    selectedInputs.forEach(
      (input) => {

        membersMap.set(
          input.value,
          true
        );
      }
    );

    const members =
      [...membersMap.keys()];

    confirmGroupButton.disabled =
      true;

    try {

      const conversationRef =
        await addDoc(
          collection(
            db,
            "conversations"
          ),
          {
            type: "group",

            name: name,

            ownerId:
              currentUser.uid,

            members:
              members,

            createdAt:
              serverTimestamp(),

            lastMessage: "",

            lastMessageAt:
              serverTimestamp()
          }
        );

      closeGroupModal();

      openConversation({
        id:
          conversationRef.id,

        type:
          "group",

        name:
          name,

        ownerId:
          currentUser.uid,

        members:
          members,

        lastMessage:
          "",

        lastMessageAt:
          null
      });

    } catch (error) {

      console.error(
        "ERROR CREANDO GRUPO:",
        error
      );

      alert(
        "No se pudo crear el grupo: " +
        error.message
      );
    }

    confirmGroupButton.disabled =
      false;
  }
);


/* =========================================================
   ADMIN
========================================================= */

adminButton?.addEventListener(
  "click",
  () => {

    if (!isAdminUser()) {

      alert(
        "No tenés permisos de administrador."
      );

      return;
    }

    openAdminPanel();
  }
);


function openAdminPanel() {

  if (!isAdminUser()) {
    return;
  }

  adminPanel?.classList.remove(
    "hidden"
  );

  renderAdminUsers();
}


adminCloseButton?.addEventListener(
  "click",
  () => {

    adminPanel?.classList.add(
      "hidden"
    );
  }
);


/* =========================================================
   ADMIN - USUARIOS
========================================================= */

function renderAdminUsers() {

  adminUsers.innerHTML = "";

  const search =
    adminSearch?.value
      .trim()
      .toLowerCase() || "";

  const filtered =
    allUsers.filter(
      (user) => {

        if (!search) {
          return true;
        }

        return (
          (user.username || "")
            .toLowerCase()
            .includes(search) ||

          (user.email || "")
            .toLowerCase()
            .includes(search) ||

          user.uid
            .toLowerCase()
            .includes(search)
        );
      }
    );

  if (adminUserCount) {

    adminUserCount.textContent =
      `${filtered.length} usuarios`;
  }

  if (filtered.length === 0) {

    adminEmpty?.classList.remove(
      "hidden"
    );

    return;
  }

  adminEmpty?.classList.add(
    "hidden"
  );

  filtered.forEach(
    (user) => {

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "admin-user-item";

      button.innerHTML = `
        <strong>
          ${escapeHtml(
            user.username ||
            "Usuario"
          )}
        </strong>

        <span>
          ${escapeHtml(
            user.email || ""
          )}
        </span>
      `;

      button.addEventListener(
        "click",
        () => {
          selectAdminUser(
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


adminSearch?.addEventListener(
  "input",
  () => {
    renderAdminUsers();
  }
);


/* =========================================================
   ADMIN - USUARIO
========================================================= */

async function selectAdminUser(
  user
) {

  selectedAdminUser =
    user;

  adminDetails?.classList.remove(
    "hidden"
  );

  adminDetailName.textContent =
    user.username ||
    "Usuario";

  adminDetailEmail.textContent =
    user.email ||
    "";

  adminDetailUid.textContent =
    user.uid ||
    "";

  adminDetailCreated.textContent =
    formatCreatedDate(
      user.createdAt
    );

  await loadAdminUserHistory(
    user
  );
}


/* =========================================================
   ADMIN - HISTORIAL
========================================================= */

async function loadAdminUserHistory(
  user
) {

  adminHistory.innerHTML =
    "<p>Cargando historial...</p>";

  try {

    const conversationsQuery =
      query(
        collection(
          db,
          "conversations"
        ),
        where(
          "members",
          "array-contains",
          user.uid
        )
      );

    const snapshot =
      await getDocs(
        conversationsQuery
      );

    const conversations = [];

    snapshot.forEach(
      (conversationDoc) => {

        conversations.push({
          id:
            conversationDoc.id,

          ...conversationDoc.data()
        });
      }
    );

    conversations.sort(
      (a, b) => {

        const timeA =
          a.lastMessageAt?.toMillis?.() ||
          0;

        const timeB =
          b.lastMessageAt?.toMillis?.() ||
          0;

        return timeB - timeA;
      }
    );

    adminHistory.innerHTML = "";

    if (
      conversations.length === 0
    ) {

      adminHistory.innerHTML =
        "<p>Este usuario no tiene conversaciones.</p>";

      return;
    }

    for (
      const conversation
      of conversations
    ) {

      await renderAdminConversation(
        conversation
      );
    }

  } catch (error) {

    console.error(
      "ERROR HISTORIAL ADMIN:",
      error
    );

    adminHistory.innerHTML =
      "<p>No se pudo cargar el historial.</p>";
  }
}


async function renderAdminConversation(
  conversation
) {

  const container =
    document.createElement(
      "section"
    );

  container.className =
    "admin-conversation";

  let title;

  if (
    conversation.type ===
    "group"
  ) {

    title =
      conversation.name ||
      "Grupo";

  } else {

    const otherUid =
      conversation.members?.find(
        (uid) =>
          uid !==
          selectedAdminUser?.uid
      );

    title =
      getUsername(
        otherUid
      ) ||
      "Chat privado";
  }

  container.innerHTML = `
    <h3>
      ${escapeHtml(title)}
    </h3>

    <div class="admin-message-list">
      Cargando mensajes...
    </div>
  `;

  adminHistory.appendChild(
    container
  );

  const messageList =
    container.querySelector(
      ".admin-message-list"
    );

  const messagesQuery =
    query(
      collection(
        db,
        "conversations",
        conversation.id,
        "messages"
      ),
      orderBy(
        "createdAt",
        "asc"
      )
    );

  const snapshot =
    await getDocs(
      messagesQuery
    );

  messageList.innerHTML = "";

  if (snapshot.empty) {

    messageList.innerHTML =
      "<p>Sin mensajes.</p>";

    return;
  }

  snapshot.forEach(
    (messageDoc) => {

      const message =
        messageDoc.data();

      const sender =
        message.senderName ||
        getUsername(
          message.senderId
        ) ||
        "Usuario";

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "admin-message";

      element.innerHTML = `
        <div class="admin-message-info">

          <strong>
            ${escapeHtml(sender)}
          </strong>

          <span>
            ${formatDate(
              message.createdAt
            )}
          </span>

        </div>

        <div class="admin-message-content">
          ${makeLinksClickable(
            message.content || ""
          )}
        </div>

        <button
          class="admin-delete-message"
        >
          Eliminar
        </button>
      `;

      element
        .querySelector(
          ".admin-delete-message"
        )
        ?.addEventListener(
          "click",
          async () => {

            await adminDeleteMessage(
              conversation.id,
              messageDoc.id
            );

            await loadAdminUserHistory(
              selectedAdminUser
            );
          }
        );

      messageList.appendChild(
        element
      );
    }
  );
}


/* =========================================================
   ADMIN - BORRAR MENSAJE
========================================================= */

async function adminDeleteMessage(
  conversationId,
  messageId
) {

  if (!isAdminUser()) {
    return;
  }

  try {

    const deleteFunction =
      httpsCallable(
        functions,
        "adminDeleteMessage"
      );

    await deleteFunction({
      conversationId:
        conversationId,

      messageId:
        messageId
    });

  } catch (error) {

    console.error(
      "ERROR ADMIN BORRANDO MENSAJE:",
      error
    );

    alert(
      "No se pudo eliminar el mensaje: " +
      error.message
    );
  }
}


/* =========================================================
   ADMIN - SINCRONIZAR USUARIOS
========================================================= */

adminSyncButton?.addEventListener(
  "click",
  async () => {

    if (!isAdminUser()) {
      return;
    }

    adminSyncButton.disabled =
      true;

    adminSyncStatus.textContent =
      "Comprobando usuarios...";

    try {

      const syncFunction =
        httpsCallable(
          functions,
          "adminSyncUsers"
        );

      const result =
        await syncFunction({});

      const data =
        result.data;

      adminSyncStatus.textContent =
        `Authentication: ${data.authUserCount} | ` +
        `Firestore: ${data.firestoreUserCount} | ` +
        `Eliminados: ${data.removedCount}`;

      await loadUsers();

      renderAdminUsers();

      if (
        selectedAdminUser &&
        data.removedUsers?.some(
          (user) =>
            user.uid ===
            selectedAdminUser.uid
        )
      ) {

        selectedAdminUser =
          null;

        adminDetails?.classList.add(
          "hidden"
        );

        adminHistory.innerHTML =
          "";
      }

    } catch (error) {

      console.error(
        "ERROR SINCRONIZANDO:",
        error
      );

      adminSyncStatus.textContent =
        "Error: " +
        error.message;
    }

    adminSyncButton.disabled =
      false;
  }
);


/* =========================================================
   LIMPIEZA
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (
      currentUser &&
      selectedConversationId
    ) {

      setTyping(false);
    }
  }
);


/* =========================================================
   INICIO
========================================================= */

showLoginForm();

updateCharacterCounter();
