import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

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


const firebaseConfig = {
  apiKey: "AIzaSyAQkoJ1NZ05MSHAkP2JXQlNkhg14uIulps",
  authDomain: "chat-44405.firebaseapp.com",
  projectId: "chat-44405",
  storageBucket: "chat-44405.firebasestorage.app",
  messagingSenderId: "239453189829",
  appId: "1:239453189829:web:3fa427b9f8cacae74422ac",
  measurementId: "G-TSJWY9EVS7"
};


const appFirebase = initializeApp(firebaseConfig);

const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);
const functions = getFunctions(appFirebase);

const ADMIN_EMAIL = "minibenja2016@gmail.com";


const $ = (id) => document.getElementById(id);


let currentUser = null;
let currentUserProfile = null;
let currentConversationId = null;
let currentConversationData = null;

let unsubscribeChats = null;
let unsubscribeMessages = null;

let allUsers = [];
let adminUsers = [];
let selectedAdminUser = null;


/* =========================
   UTILIDADES
========================= */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(timestamp) {

  if (!timestamp) {
    return "-";
  }

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-UY", {
    dateStyle: "short",
    timeStyle: "short"
  });
}


function formatShortDate(timestamp) {

  if (!timestamp) {
    return "";
  }

  let date;

  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("es-UY");
}


function getErrorMessage(error) {

  const code = error?.code || "";

  const messages = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/too-many-requests": "Demasiados intentos. Esperá un momento.",
    "permission-denied": "No tenés permisos para realizar esta acción."
  };

  return messages[code] || error?.message || "Ocurrió un error.";
}


function showAuthMessage(message) {
  $("authMessage").textContent = message;
}


function isAdminUser() {

  return (
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL
  );
}


/* =========================
   LOGIN / REGISTRO
========================= */

$("showRegister").addEventListener("click", () => {

  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");

  $("showRegister").classList.add("hidden");
  $("showLogin").classList.remove("hidden");

  showAuthMessage("");
});


$("showLogin").addEventListener("click", () => {

  $("registerForm").classList.add("hidden");
  $("loginForm").classList.remove("hidden");

  $("showLogin").classList.add("hidden");
  $("showRegister").classList.remove("hidden");

  showAuthMessage("");
});


$("loginForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  $("loginButton").disabled = true;
  showAuthMessage("");

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    showAuthMessage(getErrorMessage(error));

  } finally {

    $("loginButton").disabled = false;

  }
});


$("registerForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = $("registerEmail").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;

  const usernameLower = username.toLowerCase();

  if (username.length < 2) {
    showAuthMessage("El nombre de usuario es demasiado corto.");
    return;
  }

  $("registerButton").disabled = true;
  showAuthMessage("");

  try {

    const usernameQuery = query(
      collection(db, "users"),
      where("usernameLower", "==", usernameLower)
    );

    const existing = await getDocs(usernameQuery);

    if (!existing.empty) {
      showAuthMessage("Ese nombre de usuario ya está usado.");
      return;
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        username,
        usernameLower,
        email,
        createdAt: serverTimestamp()
      }
    );

  } catch (error) {

    showAuthMessage(getErrorMessage(error));

  } finally {

    $("registerButton").disabled = false;

  }
});


$("logoutButton").addEventListener("click", async () => {

  await signOut(auth);

});


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (!user) {

    $("authScreen").classList.remove("hidden");
    $("app").classList.add("hidden");
    $("adminPanel").classList.add("hidden");

    currentUserProfile = null;

    if (unsubscribeChats) {
      unsubscribeChats();
      unsubscribeChats = null;
    }

    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }

    return;
  }


  try {

    const userDoc = await getDoc(
      doc(db, "users", user.uid)
    );

    if (userDoc.exists()) {

      currentUserProfile = userDoc.data();

    } else {

      currentUserProfile = {
        username: user.email.split("@")[0],
        email: user.email
      };

    }

    $("currentUser").textContent =
      currentUserProfile.username || user.email;


    $("authScreen").classList.add("hidden");
    $("app").classList.remove("hidden");


    if (isAdminUser()) {

      $("adminButton").classList.remove("hidden");

    } else {

      $("adminButton").classList.add("hidden");

    }


    await loadAllUsers();
    startChatListener();

    if (window.location.pathname === "/admin") {

      if (isAdminUser()) {
        openAdminPanel();
      } else {
        window.history.replaceState({}, "", "/");
      }

    }

  } catch (error) {

    console.error(error);
    showAuthMessage(getErrorMessage(error));

  }

});


/* =========================
   USERS
========================= */

async function loadAllUsers() {

  const snapshot = await getDocs(
    collection(db, "users")
  );

  allUsers = snapshot.docs.map((userDoc) => ({
    id: userDoc.id,
    ...userDoc.data()
  }));

  allUsers.sort((a, b) => {
    return (a.username || "").localeCompare(
      b.username || "",
      "es"
    );
  });
}


$("userSearch").addEventListener("input", () => {

  const text = $("userSearch").value.trim().toLowerCase();

  if (!text) {
    $("searchResults").innerHTML = "";
    return;
  }

  const results = allUsers.filter((user) => {

    if (user.id === currentUser.uid) {
      return false;
    }

    return (
      (user.usernameLower || "").includes(text) ||
      (user.username || "").toLowerCase().includes(text) ||
      (user.email || "").toLowerCase().includes(text)
    );

  }).slice(0, 20);


  $("searchResults").innerHTML = results.map((user) => {

    return `
      <div class="search-user" data-user-id="${escapeHtml(user.id)}">
        <strong>${escapeHtml(user.username || "Usuario")}</strong>
        <div>${escapeHtml(user.email || "")}</div>
      </div>
    `;

  }).join("");


  document.querySelectorAll(".search-user").forEach((element) => {

    element.addEventListener("click", async () => {

      const user = allUsers.find(
        item => item.id === element.dataset.userId
      );

      if (user) {
        await openPrivateChat(user);
      }

    });

  });

});


/* =========================
   CONVERSACIONES
========================= */

function startChatListener() {

  if (unsubscribeChats) {
    unsubscribeChats();
  }


  const conversationsQuery = query(
    collection(db, "conversations"),
    where("members", "array-contains", currentUser.uid)
  );


  unsubscribeChats = onSnapshot(
    conversationsQuery,
    (snapshot) => {

      const conversations = snapshot.docs.map((conversationDoc) => ({
        id: conversationDoc.id,
        ...conversationDoc.data()
      }));

      conversations.sort((a, b) => {

        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;

        return bTime - aTime;

      });

      renderChatList(conversations);

    },
    (error) => {

      console.error("Chat listener:", error);

    }
  );
}


function getConversationName(conversation) {

  if (conversation.type === "group") {
    return conversation.name || "Grupo";
  }


  const otherUid = conversation.members.find(
    uid => uid !== currentUser.uid
  );


  const otherUser = allUsers.find(
    user => user.id === otherUid
  );


  return otherUser?.username || "Usuario";

}


function renderChatList(conversations) {

  $("chatList").innerHTML = "";


  for (const conversation of conversations) {

    const name = getConversationName(conversation);

    const element = document.createElement("div");

    element.className = "chat-item";

    if (conversation.id === currentConversationId) {
      element.classList.add("selected");
    }


    element.innerHTML = `
      <div class="chat-item-title">
        ${conversation.type === "group" ? "👥 " : ""}
        ${escapeHtml(name)}
      </div>

      <div class="chat-item-preview">
        ${escapeHtml(conversation.lastMessage || "Sin mensajes")}
      </div>

      <div class="chat-item-preview">
        ${escapeHtml(formatShortDate(conversation.lastMessageAt))}
      </div>
    `;


    element.addEventListener("click", () => {

      openConversation(
        conversation.id,
        conversation
      );

    });


    $("chatList").appendChild(element);

  }

}


async function openPrivateChat(user) {

  if (!currentUser || user.id === currentUser.uid) {
    return;
  }


  const conversationsQuery = query(
    collection(db, "conversations"),
    where("members", "array-contains", currentUser.uid)
  );


  const snapshot = await getDocs(conversationsQuery);


  let existing = null;


  for (const conversationDoc of snapshot.docs) {

    const data = conversationDoc.data();

    if (
      data.type === "private" &&
      Array.isArray(data.members) &&
      data.members.length === 2 &&
      data.members.includes(user.id)
    ) {

      existing = {
        id: conversationDoc.id,
        ...data
      };

      break;
    }

  }


  if (!existing) {

    const conversationRef = await addDoc(
      collection(db, "conversations"),
      {
        type: "private",
        members: [
          currentUser.uid,
          user.id
        ],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp()
      }
    );


    existing = {
      id: conversationRef.id,
      type: "private",
      members: [
        currentUser.uid,
        user.id
      ],
      lastMessage: ""
    };

  }


  $("searchResults").innerHTML = "";
  $("userSearch").value = "";

  await openConversation(
    existing.id,
    existing
  );

}


async function openConversation(conversationId, conversation) {

  currentConversationId = conversationId;
  currentConversationData = conversation;


  $("welcome").classList.add("hidden");
  $("chatWindow").classList.remove("hidden");


  $("chatTitle").textContent =
    getConversationName(conversation);


  if (conversation.type === "group") {

    $("chatStatus").textContent =
      `${conversation.members?.length || 0} participantes`;

  } else {

    $("chatStatus").textContent =
      "Conversación privada";

  }


  if (unsubscribeMessages) {
    unsubscribeMessages();
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


  unsubscribeMessages = onSnapshot(
    messagesQuery,
    (snapshot) => {

      renderMessages(snapshot.docs);

    },
    (error) => {

      console.error("Messages listener:", error);

    }
  );


  renderChatListSelection();

}


function renderChatListSelection() {

  document.querySelectorAll(".chat-item").forEach((element) => {
    element.classList.remove("selected");
  });

}


/* =========================
   MENSAJES
========================= */

function renderMessages(messageDocs) {

  $("messages").innerHTML = "";


  for (const messageDoc of messageDocs) {

    const message = messageDoc.data();

    const element = document.createElement("div");

    element.className = "message";


    if (message.senderId === currentUser.uid) {
      element.classList.add("mine");
    }


    let senderName = "";

    if (
      currentConversationData?.type === "group" &&
      message.senderId !== currentUser.uid
    ) {

      const sender = allUsers.find(
        user => user.id === message.senderId
      );

      senderName = sender?.username || "Usuario";

    }


    element.innerHTML = `

      ${
        senderName
          ? `<div class="message-sender">${escapeHtml(senderName)}</div>`
          : ""
      }

      <div class="message-content">
        ${escapeHtml(message.content)}
      </div>

      <div class="message-time">
        ${escapeHtml(formatDate(message.createdAt))}
      </div>

      ${
        message.senderId === currentUser.uid
          ? `
            <button
              class="message-delete"
              data-message-id="${escapeHtml(messageDoc.id)}"
            >
              Eliminar
            </button>
          `
          : ""
      }

    `;


    const deleteButton =
      element.querySelector(".message-delete");


    if (deleteButton) {

      deleteButton.addEventListener("click", async () => {

        await deleteOwnMessage(
          deleteButton.dataset.messageId
        );

      });

    }


    $("messages").appendChild(element);

  }


  $("messages").scrollTop =
    $("messages").scrollHeight;

}


async function deleteOwnMessage(messageId) {

  if (!currentConversationId) {
    return;
  }


  if (!confirm("¿Eliminar este mensaje?")) {
    return;
  }


  await deleteDoc(
    doc(
      db,
      "conversations",
      currentConversationId,
      "messages",
      messageId
    )
  );

}


$("messageInput").addEventListener("input", () => {

  const length = $("messageInput").value.length;

  $("characterCounter").textContent =
    `${length}/1000`;

});


$("messageInput").addEventListener("keydown", (event) => {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendMessage();

  }

});


$("sendButton").addEventListener("click", sendMessage);


async function sendMessage() {

  const content =
    $("messageInput").value.trim();


  if (!content || !currentConversationId) {
    return;
  }


  $("sendButton").disabled = true;


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
        content,
        createdAt: serverTimestamp()
      }
    );


    await updateDoc(
      doc(
        db,
        "conversations",
        currentConversationId
      ),
      {
        lastMessage: content,
        lastMessageAt: serverTimestamp()
      }
    );


    $("messageInput").value = "";
    $("characterCounter").textContent = "0/1000";

  } catch (error) {

    console.error(error);
    alert(getErrorMessage(error));

  } finally {

    $("sendButton").disabled = false;

  }

}


/* =========================
   ELIMINAR CONVERSACIÓN
========================= */

$("deleteChatButton").addEventListener(
  "click",
  deleteCurrentConversation
);


async function deleteMessagesAndConversation(
  conversationId
) {

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );


  const snapshot = await getDocs(messagesRef);

  let batch = writeBatch(db);
  let operations = 0;


  for (const messageDoc of snapshot.docs) {

    batch.delete(messageDoc.ref);

    operations++;


    if (operations >= 450) {

      await batch.commit();

      batch = writeBatch(db);
      operations = 0;

    }

  }


  if (operations > 0) {
    await batch.commit();
  }


  await deleteDoc(
    doc(db, "conversations", conversationId)
  );

}


async function deleteCurrentConversation() {

  if (!currentConversationId) {
    return;
  }


  if (!confirm(
    "¿Eliminar esta conversación y todos sus mensajes?"
  )) {

    return;

  }


  try {

    await deleteMessagesAndConversation(
      currentConversationId
    );


    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }


    currentConversationId = null;
    currentConversationData = null;


    $("chatWindow").classList.add("hidden");
    $("welcome").classList.remove("hidden");

    $("messages").innerHTML = "";

  } catch (error) {

    console.error(error);
    alert(getErrorMessage(error));

  }

}


/* =========================
   GRUPOS
========================= */

$("createGroupButton").addEventListener(
  "click",
  openGroupModal
);


$("cancelGroupButton").addEventListener(
  "click",
  closeGroupModal
);


$("cancelGroupButtonBottom").addEventListener(
  "click",
  closeGroupModal
);


function closeGroupModal() {

  $("groupModal").classList.add("hidden");
  $("groupName").value = "";
  $("groupUsers").innerHTML = "";

}


async function openGroupModal() {

  await loadGroupUsers();

  $("groupModal").classList.remove("hidden");

}


async function loadGroupUsers() {

  const usersById = new Map();


  for (const user of allUsers) {

    if (user.id !== currentUser.uid) {
      usersById.set(user.id, user);
    }

  }


  const users = Array.from(
    usersById.values()
  ).sort((a, b) =>
    (a.username || "").localeCompare(
      b.username || "",
      "es"
    )
  );


  $("groupUsers").innerHTML = users.map((user) => {

    return `
      <label class="group-user">

        <input
          type="checkbox"
          value="${escapeHtml(user.id)}"
        >

        <span>
          <strong>${escapeHtml(user.username || "Usuario")}</strong>
          <br>
          <small>${escapeHtml(user.email || "")}</small>
        </span>

      </label>
    `;

  }).join("");

}


$("confirmGroupButton").addEventListener(
  "click",
  createGroup
);


async function createGroup() {

  const name =
    $("groupName").value.trim();


  if (!name) {

    alert("Escribí un nombre para el grupo.");
    return;

  }


  const selected = Array.from(
    document.querySelectorAll(
      "#groupUsers input[type='checkbox']:checked"
    )
  ).map(input => input.value);


  const members = [
    currentUser.uid,
    ...selected
  ];


  const uniqueMembers = [
    ...new Set(members)
  ];


  if (uniqueMembers.length < 2) {

    alert("Seleccioná al menos un usuario.");
    return;

  }


  try {

    await addDoc(
      collection(db, "conversations"),
      {
        type: "group",
        name,
        ownerId: currentUser.uid,
        members: uniqueMembers,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp()
      }
    );


    closeGroupModal();

  } catch (error) {

    console.error(error);
    alert(getErrorMessage(error));

  }

}


/* =========================================================
   ADMIN
========================================================= */

$("adminButton").addEventListener(
  "click",
  openAdminPanel
);


$("adminCloseButton").addEventListener(
  "click",
  closeAdminPanel
);


function openAdminPanel() {

  if (!isAdminUser()) {
    return;
  }


  $("adminPanel").classList.remove("hidden");
  $("adminPanel").classList.remove("show-details");


  window.history.pushState(
    {},
    "",
    "/admin"
  );


  loadAdminUsers();

}


function closeAdminPanel() {

  $("adminPanel").classList.add("hidden");
  $("adminPanel").classList.remove("show-details");


  if (window.location.pathname === "/admin") {

    window.history.pushState(
      {},
      "",
      "/"
    );

  }

}


window.addEventListener("popstate", () => {

  if (
    window.location.pathname === "/admin" &&
    isAdminUser()
  ) {

    openAdminPanel();

  } else {

    $("adminPanel").classList.add("hidden");

  }

});


$("adminSearch").addEventListener(
  "input",
  renderAdminUsers
);


$("adminSyncButton").addEventListener(
  "click",
  synchronizeAdminUsers
);


async function loadAdminUsers() {

  if (!isAdminUser()) {
    return;
  }


  try {

    const snapshot = await getDocs(
      collection(db, "users")
    );


    adminUsers = snapshot.docs.map((userDoc) => ({
      id: userDoc.id,
      ...userDoc.data()
    }));


    adminUsers.sort((a, b) => {

      return (a.username || "").localeCompare(
        b.username || "",
        "es"
      );

    });


    $("adminUserCount").textContent =
      `${adminUsers.length} usuarios`;


    renderAdminUsers();

  } catch (error) {

    console.error(error);

    $("adminSyncStatus").textContent =
      getErrorMessage(error);

  }

}


function renderAdminUsers() {

  const text =
    $("adminSearch").value.trim().toLowerCase();


  const filtered = adminUsers.filter((user) => {

    if (!text) {
      return true;
    }

    return (
      (user.username || "").toLowerCase().includes(text) ||
      (user.email || "").toLowerCase().includes(text) ||
      user.id.toLowerCase().includes(text)
    );

  });


  $("adminUsers").innerHTML = filtered.map((user) => {

    const selected =
      selectedAdminUser?.id === user.id
        ? "selected"
        : "";


    return `
      <div
        class="admin-user ${selected}"
        data-user-id="${escapeHtml(user.id)}"
      >

        <strong>
          ${escapeHtml(user.username || "Usuario")}
        </strong>

        <span>
          ${escapeHtml(user.email || "")}
        </span>

      </div>
    `;

  }).join("");


  document.querySelectorAll(
    ".admin-user"
  ).forEach((element) => {

    element.addEventListener(
      "click",
      () => {

        const user = adminUsers.find(
          item => item.id === element.dataset.userId
        );


        if (user) {
          openAdminUser(user);
        }

      }
    );

  });

}


async function openAdminUser(user) {

  selectedAdminUser = user;


  $("adminPanel").classList.add(
    "show-details"
  );


  $("adminEmpty").classList.add(
    "hidden"
  );


  $("adminDetails").classList.remove(
    "hidden"
  );


  $("adminDetailName").textContent =
    user.username || "Usuario";


  $("adminDetailEmail").textContent =
    user.email || "";


  $("adminDetailUid").textContent =
    user.id;


  $("adminDetailCreated").textContent =
    formatDate(user.createdAt);


  $("adminHistory").innerHTML =
    "<p>Cargando historial...</p>";


  renderAdminUsers();


  await loadAdminHistory(user.id);

}


async function loadAdminHistory(uid) {

  try {

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("members", "array-contains", uid)
    );


    const snapshot =
      await getDocs(conversationsQuery);


    const conversations = snapshot.docs.map(
      conversationDoc => ({
        id: conversationDoc.id,
        ...conversationDoc.data()
      })
    );


    conversations.sort((a, b) => {

      const aTime =
        a.lastMessageAt?.toMillis?.() || 0;

      const bTime =
        b.lastMessageAt?.toMillis?.() || 0;

      return bTime - aTime;

    });


    if (conversations.length === 0) {

      $("adminHistory").innerHTML = `
        <div class="admin-no-messages">
          Este usuario no tiene conversaciones.
        </div>
      `;

      return;

    }


    const htmlParts = [];


    for (const conversation of conversations) {

      const messagesSnapshot =
        await getDocs(
          query(
            collection(
              db,
              "conversations",
              conversation.id,
              "messages"
            ),
            orderBy("createdAt", "asc")
          )
        );


      const title =
        conversation.type === "group"
          ? `👥 ${conversation.name || "Grupo"}`
          : getAdminPrivateConversationName(
              conversation,
              uid
            );


      let messagesHtml = "";


      if (messagesSnapshot.empty) {

        messagesHtml = `
          <div class="admin-no-messages">
            Sin mensajes.
          </div>
        `;

      } else {

        for (const messageDoc of messagesSnapshot.docs) {

          const message = messageDoc.data();

          const sender =
            adminUsers.find(
              user => user.id === message.senderId
            );


          messagesHtml += `

            <div class="admin-message">

              <div class="admin-message-header">

                <strong>
                  ${escapeHtml(
                    sender?.username ||
                    message.senderId ||
                    "Usuario"
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    formatDate(message.createdAt)
                  )}
                </span>

              </div>

              <div class="admin-message-content">
                ${escapeHtml(message.content)}
              </div>

              <div class="admin-message-actions">

                <button
                  class="admin-delete-message"
                  data-conversation-id="${escapeHtml(conversation.id)}"
                  data-message-id="${escapeHtml(messageDoc.id)}"
                >
                  🗑️ Eliminar mensaje
                </button>

              </div>

            </div>

          `;

        }

      }


      htmlParts.push(`

        <div class="admin-conversation">

          <div class="admin-conversation-header">

            <strong>
              ${escapeHtml(title)}
            </strong>

            <span>
              ${conversation.members?.length || 0}
              participantes
            </span>

          </div>

          ${messagesHtml}

        </div>

      `);

    }


    $("adminHistory").innerHTML =
      htmlParts.join("");


    document.querySelectorAll(
      ".admin-delete-message"
    ).forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteAdminMessage(
            button.dataset.conversationId,
            button.dataset.messageId
          );

        }
      );

    });


  } catch (error) {

    console.error(error);

    $("adminHistory").innerHTML = `
      <div class="admin-no-messages">
        Error: ${escapeHtml(
          getErrorMessage(error)
        )}
      </div>
    `;

  }

}


function getAdminPrivateConversationName(
  conversation,
  selectedUid
) {

  const otherUid =
    conversation.members?.find(
      uid => uid !== selectedUid
    );


  const user =
    adminUsers.find(
      item => item.id === otherUid
    );


  return `💬 ${user?.username || "Conversación privada"}`;

}


/* =========================
   ADMIN - BORRAR MENSAJE
========================= */

async function deleteAdminMessage(
  conversationId,
  messageId
) {

  if (!isAdminUser()) {
    return;
  }


  if (!confirm(
    "¿Eliminar definitivamente este mensaje?"
  )) {

    return;

  }


  try {

    const deleteMessage =
      httpsCallable(
        functions,
        "adminDeleteMessage"
      );


    await deleteMessage({
      conversationId,
      messageId
    });


    await loadAdminHistory(
      selectedAdminUser.id
    );


  } catch (error) {

    console.error(error);

    alert(
      getErrorMessage(error)
    );

  }

}


/* =========================
   ADMIN - SINCRONIZAR
========================= */

async function synchronizeAdminUsers() {

  if (!isAdminUser()) {
    return;
  }


  $("adminSyncButton").disabled = true;


  $("adminSyncStatus").textContent =
    "Comprobando Firebase Authentication...";


  try {

    const syncUsers =
      httpsCallable(
        functions,
        "adminSyncUsers"
      );


    const result =
      await syncUsers();


    const data = result.data;


    $("adminSyncStatus").textContent =
      `Completado. ${data.removedCount || 0} usuarios huérfanos eliminados.`;


    await loadAdminUsers();


  } catch (error) {

    console.error(error);

    $("adminSyncStatus").textContent =
      getErrorMessage(error);

  } finally {

    $("adminSyncButton").disabled = false;

  }

}
