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


    /* =================================================
       NOMBRE DEL USUARIO EN GRUPOS
    ================================================= */

    if (
        currentConversationData &&
        currentConversationData.isGroup === true
    ) {

        const sender =
            usersCache.find(
                function (user) {

                    return (
                        user.uid ===
                        data.senderId
                    );
                }
            );


        const senderName =
            document.createElement("div");

        senderName.className =
            "message-sender";

        senderName.textContent =
            "@" +
            (
                sender?.username ||
                "usuario"
            );


        bubble.appendChild(
            senderName
        );
    }


    /* =================================================
       IMAGEN
    ================================================= */

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


    /* =================================================
       TEXTO
    ================================================= */

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


    /* =================================================
       HORA
    ================================================= */

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
