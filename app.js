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
  writeBatch,
  arrayUnion,
  arrayRemove
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
const cancelGroupButtonBottom = document.getElementById("cancelGroupButtonBottom");
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

let typingTimeout = null;
let unsubscribeTyping = null;


/* =========================================================
   FUNCIONES GENERALES
========================================================= */

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}


function formatDate(timestamp) {
  if (!timestamp) return "";

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
  if (!timestamp) return "Desconocida";

  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleString("es-UY");
  }

  return "Desconocida";
}


function isAdminUser() {
  return (
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL
  );
}


/* =========================================================
   URLS CLICKEABLES
========================================================= */

function makeLinksClickable(text) {
  const escaped = escapeHtml(text);

  const urlRegex =
    /((https?:\/\/|www\.)[^\s<]+)/gi;

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
   AUTENTICACIÓN
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
    await signInWithEmailAndPassword(auth, email, password);

    authMessage.textContent = "";
    loginForm.reset();

  } catch (error) {
    console.error(error);

    switch (error.code) {
      case "auth/invalid-credential":
        authMessage.textContent = "Correo o contraseña incorrectos.";
        break;

      case "auth/invalid-email":
        authMessage.textContent = "El correo no es válido.";
        break;

      case "auth/too-many-requests":
        authMessage.textContent = "Demasiados intentos. Esperá un momento.";
        break;

      default:
        authMessage.textContent = error.message;
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
    authMessage.textContent = "Completá todos los campos.";
    return;
  }

  if (username.length < 3) {
    authMessage.textContent = "El nombre debe tener al menos 3 caracteres.";
    return;
  }

  if (password.length < 6) {
    authMessage.textContent = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  registerButton.disabled = true;
  authMessage.textContent = "Creando cuenta...";

  try {
    const usernameLower = username.toLowerCase();

    /*
      Primero comprobamos que el nombre de usuario no exista.
      Esto NO requiere ser administrador.
    */

    const usernameQuery = query(
      collection(db, "users"),
      where("usernameLower", "==", usernameLower)
    );

    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      authMessage.textContent = "Ese nombre de usuario ya está usado.";
      registerButton.disabled = false;
      return;
    }

    /*
      Creamos primero la cuenta en Firebase Authentication.
    */

    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = credential.user;

    /*
      Después creamos el perfil de Firestore.
      El UID es exactamente el mismo de Authentication.
    */

    await setDoc(doc(db, "users", user.uid), {
      username: username,
      usernameLower: usernameLower,
      email: email,
      createdAt: serverTimestamp()
    });

    authMessage.textContent = "Cuenta creada correctamente.";

    registerForm.reset();

  } catch (error) {
    console.error(error);

    switch (error.code) {
      case "auth/email-already-in-use":
        authMessage.textContent = "Ese correo ya está registrado.";
        break;

      case "auth/invalid-email":
        authMessage.textContent = "El correo no es válido.";
        break;

      case "auth/weak-password":
        authMessage.textContent = "La contraseña es demasiado débil.";
        break;

      case "permission-denied":
        authMessage.textContent =
          "Firebase rechazó la creación del perfil. Revisá las reglas de Firestore.";
        break;

      default:
        authMessage.textContent = error.message;
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

    if (adminPanel) {
      adminPanel.classList.add("hidden");
    }

    stopConversationListener();
    stopMessageListener();
    stopTypingListener();

    return;
  }

  try {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      /*
        Si por alguna razón existe la cuenta en Authentication
        pero no su perfil, lo creamos automáticamente.
      */

      const fallbackUsername =
        user.email?.split("@")[0] || "Usuario";

      await setDoc(profileRef, {
        username: fallbackUsername,
        usernameLower: fallbackUsername.toLowerCase(),
        email: user.email || "",
        createdAt: serverTimestamp()
      });

      currentUserProfile = {
        username: fallbackUsername,
        email: user.email || ""
      };

    } else {
      currentUserProfile = profileSnapshot.data();
    }

    authScreen?.classList.add("hidden");
    app?.classList.remove("hidden");

    if (currentUserElement) {
      currentUserElement.textContent =
        currentUserProfile.username || user.email;
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

    /*
      Si la URL es /admin, intentamos abrir el panel.
    */

    if (window.location.pathname === "/admin") {
      if (isAdminUser()) {
        openAdminPanel();
      }
    }

  } catch (error) {
    console.error("Error cargando usuario:", error);

    authMessage.textContent =
      "No se pudo cargar tu perfil.";
  }
});


/* =========================================================
   USUARIOS
========================================================= */

async function loadUsers() {
  if (!currentUser) return;

  try {
    const snapshot = await getDocs(collection(db, "users"));

    allUsers = [];

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      allUsers.push({
        uid: docSnapshot.id,
        ...data
      });
    });

    allUsers.sort((a, b) => {
      return (a.username || "").localeCompare(
        b.username || "",
        "es"
      );
    });

  } catch (error) {
    console.error("Error cargando usuarios:", error);
  }
}


function getUserById(uid) {
  return allUsers.find((user) => user.uid === uid) || null;
}


function getUsername(uid) {
  if (uid === currentUser?.uid) {
    return currentUserProfile?.username || currentUser?.email || "Vos";
  }

  const user = getUserById(uid);

  return user?.username || "Usuario";
}


/* =========================================================
   BÚSQUEDA DE USUARIOS
========================================================= */

userSearch?.addEventListener("input", () => {
  const search = userSearch.value.trim().toLowerCase();

  if (!search) {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    return;
  }

  const results = allUsers.filter((user) => {
    if (user.uid === currentUser?.uid) {
      return false;
    }

    const username = (user.username || "").toLowerCase();
    const email = (user.email || "").toLowerCase();

    return (
      username.includes(search) ||
      email.includes(search)
    );
  });

  renderSearchResults(results);
});


function renderSearchResults(results) {
  if (!searchResults) return;

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
    const element = document.createElement("button");

    element.className = "search-result";

    element.innerHTML = `
      <strong>${escapeHtml(user.username || "Usuario")}</strong>
      <span>${escapeHtml(user.email || "")}</span>
    `;

    element.addEventListener("click", () => {
      openPrivateConversation(user);

      userSearch.value = "";
      searchResults.innerHTML = "";
      searchResults.classList.add("hidden");
    });

    searchResults.appendChild(element);
  });

  searchResults.classList.remove("hidden");
}


/* =========================================================
   CONVERSACIONES
========================================================= */

function startConversationListener() {
  stopConversationListener();

  if (!currentUser) return;

  const conversationsQuery = query(
    collection(db, "conversations"),
    where("members", "array-contains", currentUser.uid)
  );

  unsubscribeConversations = onSnapshot(
    conversationsQuery,
    async (snapshot) => {
      allConversations = [];

      snapshot.forEach((docSnapshot) => {
        allConversations.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      allConversations.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis?.() || 0;
        const timeB = b.lastMessageAt?.toMillis?.() || 0;

        return timeB - timeA;
      });

      renderConversationList();

      /*
        Si el chat actual cambió, actualizamos su título.
      */

      if (selectedConversationId) {
        const updated = allConversations.find(
          (conversation) =>
            conversation.id === selectedConversationId
        );

        if (updated) {
          selectedConversation = updated;
          updateChatHeader();
        }
      }
    },
    (error) => {
      console.error("Error escuchando conversaciones:", error);
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
  if (!chatList) return;

  chatList.innerHTML = "";

  if (allConversations.length === 0) {
    chatList.innerHTML = `
      <div class="chat-list-empty">
        No tenés conversaciones todavía.
      </div>
    `;

    return;
  }

  allConversations.forEach((conversation) => {
    const element = document.createElement("button");

    element.className = "chat-list-item";

    const title = getConversationTitle(conversation);

    const preview =
      conversation.lastMessage || "Sin mensajes";

    element.innerHTML = `
      <div class="chat-list-main">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(preview)}</span>
      </div>

      <div class="chat-list-time">
        ${formatDate(conversation.lastMessageAt)}
      </div>
    `;

    element.addEventListener("click", () => {
      openConversation(conversation);
    });

    chatList.appendChild(element);
  });
}


function getConversationTitle(conversation) {
  if (conversation.type === "group") {
    return conversation.name || "Grupo";
  }

  const otherUid = conversation.members?.find(
    (uid) => uid !== currentUser?.uid
  );

  return getUsername(otherUid) || "Chat";
}


async function openPrivateConversation(user) {
  if (!currentUser || !user) return;

  const existing = allConversations.find((conversation) => {
    return (
      conversation.type === "private" &&
      Array.isArray(conversation.members) &&
      conversation.members.length === 2 &&
      conversation.members.includes(currentUser.uid) &&
      conversation.members.includes(user.uid)
    );
  });

  if (existing) {
    openConversation(existing);
    return;
  }

  try {
    const conversationRef = await addDoc(
      collection(db, "conversations"),
      {
        type: "private",
        members: [currentUser.uid, user.uid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp()
      }
    );

    const newConversation = {
      id: conversationRef.id,
      type: "private",
      members: [currentUser.uid, user.uid],
      lastMessage: "",
      lastMessageAt: null
    };

    openConversation(newConversation);

  } catch (error) {
    console.error("Error creando conversación:", error);
  }
}


function openConversation(conversation) {
  selectedConversation = conversation;
  selectedConversationId = conversation.id;

  welcome?.classList.add("hidden");
  chatWindow?.classList.remove("hidden");

  updateChatHeader();

  startMessageListener(conversation.id);
  startTypingListener(conversation.id);
}


function updateChatHeader() {
  if (!selectedConversation) return;

  if (selectedConversation.type === "group") {
    chatTitle.textContent =
      selectedConversation.name || "Grupo";

  } else {
    const otherUid =
      selectedConversation.members?.find(
        (uid) => uid !== currentUser?.uid
      );

    chatTitle.textContent =
      getUsername(otherUid) || "Usuario";
  }

  chatStatus.textContent = "";
}


/* =========================================================
   MENSAJES
========================================================= */

function startMessageListener(conversationId) {
  stopMessageListener();

  const messagesQuery = query(
    collection(
      db,
      "conversations",
      conversationId,
      "messages"
    ),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(
    messagesQuery,
    (snapshot) => {
      renderMessages(snapshot);
    },
    (error) => {
      console.error("Error escuchando mensajes:", error);
    }
  );
}


function stopMessageListener() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
}


function renderMessages(snapshot) {
  if (!messagesElement) return;

  messagesElement.innerHTML = "";

  snapshot.forEach((docSnapshot) => {
    const message = {
      id: docSnapshot.id,
      ...docSnapshot.data()
    };

    const element = document.createElement("div");

    const ownMessage =
      message.senderId === currentUser?.uid;

    element.className =
      ownMessage
        ? "message own"
        : "message";

    const senderName =
      getUsername(message.senderId);

    const senderHtml =
      selectedConversation?.type === "group" && !ownMessage
        ? `<div class="message-sender">${escapeHtml(senderName)}</div>`
        : "";

    const deleteButton =
      ownMessage
        ? `
          <button
            class="delete-message"
            data-message-id="${message.id}"
            title="Eliminar mensaje"
          >
            🗑
          </button>
        `
        : "";

    element.innerHTML = `
      <div class="message-content">
        ${senderHtml}

        <div class="message-text">
          ${makeLinksClickable(message.content || "")}
        </div>

        <div class="message-footer">
          <span class="message-time">
            ${formatDate(message.createdAt)}
          </span>

          ${deleteButton}
        </div>
      </div>
    `;

    const deleteButtonElement =
      element.querySelector(".delete-message");

    deleteButtonElement?.addEventListener(
      "click",
      async (event) => {
        event.stopPropagation();

        await deleteOwnMessage(message.id);
      }
    );

    messagesElement.appendChild(element);
  });

  messagesElement.scrollTop =
    messagesElement.scrollHeight;
}


async function sendMessage() {
  if (!currentUser) return;
  if (!selectedConversationId) return;

  const content = messageInput.value.trim();

  if (!content) return;

  if (content.length > 4000) {
    return;
  }

  sendButton.disabled = true;

  try {
    const conversationRef = doc(
      db,
      "conversations",
      selectedConversationId
    );

    await addDoc(
      collection(
        db,
        "conversations",
        selectedConversationId,
        "messages"
      ),
      {
        senderId: currentUser.uid,
        content: content,
        createdAt: serverTimestamp()
      }
    );

    await updateDoc(conversationRef, {
      lastMessage: content,
      lastMessageAt: serverTimestamp()
    });

    await setTyping(false);

    messageInput.value = "";

    updateCharacterCounter();

  } catch (error) {
    console.error("Error enviando mensaje:", error);
  }

  sendButton.disabled = false;

  messageInput.focus();
}


sendButton?.addEventListener("click", sendMessage);


messageInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});


function updateCharacterCounter() {
  if (!characterCounter || !messageInput) return;

  characterCounter.textContent =
    `${messageInput.value.length}/4000`;
}


messageInput?.addEventListener("input", () => {
  updateCharacterCounter();
  handleTyping();
});


async function deleteOwnMessage(messageId) {
  if (!selectedConversationId || !currentUser) return;

  try {
    const messageRef = doc(
      db,
      "conversations",
      selectedConversationId,
      "messages",
      messageId
    );

    const messageSnapshot = await getDoc(messageRef);

    if (!messageSnapshot.exists()) {
      return;
    }

    const message = messageSnapshot.data();

    if (message.senderId !== currentUser.uid) {
      return;
    }

    await deleteDoc(messageRef);

  } catch (error) {
    console.error("Error eliminando mensaje:", error);
  }
}


/* =========================================================
   ESCRIBIENDO...
========================================================= */

async function setTyping(isTyping) {
  if (!currentUser || !selectedConversationId) {
    return;
  }

  const typingRef = doc(
    db,
    "conversations",
    selectedConversationId,
    "typing",
    currentUser.uid
  );

  if (isTyping) {
    await setDoc(typingRef, {
      uid: currentUser.uid,
      username:
        currentUserProfile?.username ||
        currentUser.email ||
        "Usuario",
      updatedAt: serverTimestamp()
    });
  } else {
    try {
      await deleteDoc(typingRef);
    } catch (error) {
      console.error(error);
    }
  }
}


function handleTyping() {
  if (!selectedConversationId) return;

  setTyping(true).catch((error) => {
    console.error("Error marcando escritura:", error);
  });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    setTyping(false).catch((error) => {
      console.error("Error quitando escritura:", error);
    });
  }, 2500);
}


function startTypingListener(conversationId) {
  stopTypingListener();

  const typingQuery = collection(
    db,
    "conversations",
    conversationId,
    "typing"
  );

  unsubscribeTyping = onSnapshot(
    typingQuery,
    (snapshot) => {
      const writers = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        if (data.uid !== currentUser?.uid) {
          writers.push(
            data.username ||
            getUsername(data.uid) ||
            "Alguien"
          );
        }
      });

      updateTypingText(writers);
    },
    (error) => {
      console.error("Error escuchando typing:", error);
    }
  );
}


function stopTypingListener() {
  if (unsubscribeTyping) {
    unsubscribeTyping();
    unsubscribeTyping = null;
  }
}


function updateTypingText(writers) {
  if (!chatStatus) return;

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

deleteChatButton?.addEventListener("click", async () => {
  if (!selectedConversationId) return;

  const confirmed = confirm(
    "¿Querés eliminar esta conversación?"
  );

  if (!confirmed) return;

  try {
    await deleteConversation(selectedConversationId);

    selectedConversationId = null;
    selectedConversation = null;

    stopMessageListener();
    stopTypingListener();

    chatWindow?.classList.add("hidden");
    welcome?.classList.remove("hidden");

  } catch (error) {
    console.error("Error eliminando conversación:", error);
  }
});


async function deleteConversation(conversationId) {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const snapshot = await getDocs(messagesRef);

  let batch = writeBatch(db);
  let count = 0;

  for (const messageDoc of snapshot.docs) {
    batch.delete(messageDoc.ref);
    count++;

    if (count >= 450) {
      await batch.commit();

      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  await deleteDoc(
    doc(db, "conversations", conversationId)
  );
}


/* =========================================================
   CREAR GRUPO
========================================================= */

createGroupButton?.addEventListener("click", async () => {
  if (!currentUser) return;

  await loadUsers();

  renderGroupUsers();

  groupName.value = "";

  groupModal?.classList.remove("hidden");
});


function renderGroupUsers() {
  if (!groupUsers) return;

  groupUsers.innerHTML = "";

  allUsers
    .filter((user) => user.uid !== currentUser?.uid)
    .forEach((user) => {
      const label = document.createElement("label");

      label.className = "group-user";

      label.innerHTML = `
        <input
          type="checkbox"
          value="${user.uid}"
        >

        <span>
          <strong>${escapeHtml(user.username || "Usuario")}</strong>
          <small>${escapeHtml(user.email || "")}</small>
        </span>
      `;

      groupUsers.appendChild(label);
    });
}


function closeGroupModal() {
  groupModal?.classList.add("hidden");
}


cancelGroupButton?.addEventListener(
  "click",
  closeGroupModal
);

cancelGroupButtonBottom?.addEventListener(
  "click",
  closeGroupModal
);


confirmGroupButton?.addEventListener(
  "click",
  async () => {
    if (!currentUser) return;

    const name = groupName.value.trim();

    if (!name) {
      alert("Escribí un nombre para el grupo.");
      return;
    }

    const selectedUsers = [
      ...groupUsers.querySelectorAll(
        'input[type="checkbox"]:checked'
      )
    ];

    if (selectedUsers.length === 0) {
      alert("Seleccioná al menos una persona.");
      return;
    }

    /*
      Map evita UID repetidos.
    */

    const membersMap = new Map();

    membersMap.set(
      currentUser.uid,
      true
    );

    selectedUsers.forEach((input) => {
      membersMap.set(input.value, true);
    });

    const members = [...membersMap.keys()];

    confirmGroupButton.disabled = true;

    try {
      const conversationRef = await addDoc(
        collection(db, "conversations"),
        {
          type: "group",
          name: name,
          ownerId: currentUser.uid,
          members: members,
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageAt: serverTimestamp()
        }
      );

      closeGroupModal();

      const newConversation = {
        id: conversationRef.id,
        type: "group",
        name: name,
        ownerId: currentUser.uid,
        members: members,
        lastMessage: "",
        lastMessageAt: null
      };

      openConversation(newConversation);

    } catch (error) {
      console.error("Error creando grupo:", error);

      alert(
        "No se pudo crear el grupo: " +
        error.message
      );
    }

    confirmGroupButton.disabled = false;
  }
);


/* =========================================================
   ADMIN
========================================================= */

adminButton?.addEventListener("click", () => {
  if (!isAdminUser()) {
    alert("No tenés permisos de administrador.");
    return;
  }

  openAdminPanel();
});


function openAdminPanel() {
  if (!isAdminUser()) {
    return;
  }

  adminPanel?.classList.remove("hidden");

  renderAdminUsers();
}


adminCloseButton?.addEventListener("click", () => {
  adminPanel?.classList.add("hidden");
});


/* =========================================================
   ADMIN - USUARIOS
========================================================= */

function renderAdminUsers() {
  if (!adminUsers) return;

  const search =
    adminSearch?.value.trim().toLowerCase() || "";

  const filteredUsers = allUsers.filter((user) => {
    if (!search) return true;

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
  });

  adminUsers.innerHTML = "";

  if (adminUserCount) {
    adminUserCount.textContent =
      `${filteredUsers.length} usuarios`;
  }

  if (filteredUsers.length === 0) {
    adminEmpty?.classList.remove("hidden");
    return;
  }

  adminEmpty?.classList.add("hidden");

  filteredUsers.forEach((user) => {
    const element = document.createElement("button");

    element.className = "admin-user-item";

    element.innerHTML = `
      <strong>
        ${escapeHtml(user.username || "Usuario")}
      </strong>

      <span>
        ${escapeHtml(user.email || "")}
      </span>
    `;

    element.addEventListener("click", () => {
      selectAdminUser(user);
    });

    adminUsers.appendChild(element);
  });
}


adminSearch?.addEventListener("input", () => {
  renderAdminUsers();
});


/* =========================================================
   ADMIN - SELECCIONAR USUARIO
========================================================= */

async function selectAdminUser(user) {
  selectedAdminUser = user;

  adminDetails?.classList.remove("hidden");

  if (adminDetailName) {
    adminDetailName.textContent =
      user.username || "Usuario";
  }

  if (adminDetailEmail) {
    adminDetailEmail.textContent =
      user.email || "";
  }

  if (adminDetailUid) {
    adminDetailUid.textContent =
      user.uid || "";
  }

  if (adminDetailCreated) {
    adminDetailCreated.textContent =
      formatCreatedDate(user.createdAt);
  }

  await loadAdminUserHistory(user);
}


/* =========================================================
   ADMIN - HISTORIAL
========================================================= */

async function loadAdminUserHistory(user) {
  if (!adminHistory) return;

  adminHistory.innerHTML =
    "<p>Cargando historial...</p>";

  try {
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("members", "array-contains", user.uid)
    );

    const snapshot =
      await getDocs(conversationsQuery);

    const conversations = [];

    snapshot.forEach((docSnapshot) => {
      conversations.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      });
    });

    conversations.sort((a, b) => {
      const timeA =
        a.lastMessageAt?.toMillis?.() || 0;

      const timeB =
        b.lastMessageAt?.toMillis?.() || 0;

      return timeB - timeA;
    });

    adminHistory.innerHTML = "";

    if (conversations.length === 0) {
      adminHistory.innerHTML =
        "<p>Este usuario no tiene conversaciones.</p>";

      return;
    }

    for (const conversation of conversations) {
      await renderAdminConversation(
        conversation
      );
    }

  } catch (error) {
    console.error(
      "Error cargando historial admin:",
      error
    );

    adminHistory.innerHTML =
      "<p>No se pudo cargar el historial.</p>";
  }
}


async function renderAdminConversation(conversation) {
  const container =
    document.createElement("section");

  container.className =
    "admin-conversation";

  const title =
    conversation.type === "group"
      ? conversation.name || "Grupo"
      : getAdminPrivateConversationTitle(
          conversation
        );

  container.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <div class="admin-message-list">
      Cargando mensajes...
    </div>
  `;

  adminHistory.appendChild(container);

  const messageList =
    container.querySelector(
      ".admin-message-list"
    );

  const messagesQuery = query(
    collection(
      db,
      "conversations",
      conversation.id,
      "messages"
    ),
    orderBy("createdAt", "asc")
  );

  const snapshot =
    await getDocs(messagesQuery);

  messageList.innerHTML = "";

  if (snapshot.empty) {
    messageList.innerHTML =
      "<p>Sin mensajes.</p>";

    return;
  }

  snapshot.forEach((docSnapshot) => {
    const message =
      docSnapshot.data();

    const sender =
      getUsername(message.senderId);

    const messageElement =
      document.createElement("div");

    messageElement.className =
      "admin-message";

    messageElement.innerHTML = `
      <div class="admin-message-info">
        <strong>${escapeHtml(sender)}</strong>

        <span>
          ${formatDate(message.createdAt)}
        </span>
      </div>

      <div class="admin-message-content">
        ${makeLinksClickable(message.content || "")}
      </div>

      <button
        class="admin-delete-message"
        data-message-id="${docSnapshot.id}"
      >
        Eliminar
      </button>
    `;

    messageElement
      .querySelector(".admin-delete-message")
      ?.addEventListener(
        "click",
        async () => {
          await adminDeleteMessage(
            conversation.id,
            docSnapshot.id
          );

          await loadAdminUserHistory(
            selectedAdminUser
          );
        }
      );

    messageList.appendChild(
      messageElement
    );
  });
}


function getAdminPrivateConversationTitle(
  conversation
) {
  const otherUid =
    conversation.members?.find(
      (uid) =>
        uid !== selectedAdminUser?.uid
    );

  return getUsername(otherUid) || "Chat privado";
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
      conversationId,
      messageId
    });

  } catch (error) {
    console.error(
      "Error eliminando mensaje como admin:",
      error
    );

    alert(
      "No se pudo eliminar el mensaje: " +
      error.message
    );
  }
}


/* =========================================================
   ADMIN - SINCRONIZAR AUTH CON FIRESTORE
========================================================= */

adminSyncButton?.addEventListener(
  "click",
  async () => {
    if (!isAdminUser()) {
      return;
    }

    adminSyncButton.disabled = true;

    if (adminSyncStatus) {
      adminSyncStatus.textContent =
        "Comprobando usuarios de Firebase Authentication...";
    }

    try {
      const syncFunction =
        httpsCallable(
          functions,
          "adminSyncUsers"
        );

      const result =
        await syncFunction({});

      const data = result.data;

      if (adminSyncStatus) {
        adminSyncStatus.textContent =
          `Authentication: ${data.authUserCount} | ` +
          `Firestore: ${data.firestoreUserCount} | ` +
          `Eliminados: ${data.removedCount}`;
      }

      await loadUsers();

      renderAdminUsers();

      if (
        selectedAdminUser &&
        data.removedUsers?.some(
          (user) =>
            user.uid === selectedAdminUser.uid
        )
      ) {
        selectedAdminUser = null;

        adminDetails?.classList.add("hidden");

        if (adminHistory) {
          adminHistory.innerHTML = "";
        }
      }

    } catch (error) {
      console.error(
        "Error sincronizando usuarios:",
        error
      );

      if (adminSyncStatus) {
        adminSyncStatus.textContent =
          "Error: " + error.message;
      }
    }

    adminSyncButton.disabled = false;
  }
);


/* =========================================================
   URL / ADMIN DIRECTO
========================================================= */

window.addEventListener("popstate", () => {
  if (window.location.pathname === "/admin") {
    if (isAdminUser()) {
      openAdminPanel();
    }
  }
});


/* =========================================================
   LIMPIEZA AL CERRAR / CAMBIAR DE PÁGINA
========================================================= */

window.addEventListener("beforeunload", () => {
  if (currentUser && selectedConversationId) {
    setTyping(false).catch(() => {});
  }
});


/* =========================================================
   INICIO
========================================================= */

showLoginForm();

updateCharacterCounter();
