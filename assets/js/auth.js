// AUTH VARIABLES
let passhash = 0;

// AUTH UTILS


// AUTH WEBSOCKET STUFF
function wssSendName() {
    const authInput = $("#auth-input");
    if (currentStage !== "chat" || !nickname) {
        nickname = authInput.val()
        nickname = nickname.slice(0, 50);
    }
    if (nickname.indexOf(' ') >= 0) {
        $("#auth-error").html("Не используйте пробел в имени");
        authInput.focus();
        return;
    }
    if (!nickname) {
        $("#auth-error").html("Введите имя");
        authInput.focus();
        return;
    }
    wssSend("auth:auth", nickname);
}
function wssSendPass(promptMessage, cache = false) {
    if (cache) return wssSend("auth:pass", [nickname, passhash]);

    promptModal(promptMessage, (pass) => {
        if (!pass) {
            console.error("Пароль не задан");
            nickname = "";
            $("#auth-error").html("Пароль не задан");
            $("#auth-input").focus();
            return;
        }
        passhash = hashCode(pass);
        wssSend("auth:pass", [nickname, passhash]);
    });
}

// AUTH MESSAGE HANDLERS
messageHandlers.authFail = (message) => {
    console.error(`AUTH_FAIL: ${message}`);
    nickname = "";
    $("#auth-error").html(message);
    $("#auth-input").focus();
};
messageHandlers.authOk = (message) => {
    flags.admin = message;
    setStage("chat");
}
messageHandlers.authPass = (message) => {
    wssSendPass(message, false);
};

// AUTH STAGE HANDLERS
stages["auth"]["entry"] = function () {
    nickname = Cookies.get("wscname") || "";
    if (nickname) $("#auth-input").val(nickname);
    wssPrepare();
}
stages["auth"]["exit"] = function () {
    $("#auth-error").html("");
    $("#auth-send").off("click");
    $(document.body).off("keydown");
}