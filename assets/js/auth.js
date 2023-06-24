// AUTH VARIABLES
let passhash = 0;

// AUTH UTILS


// AUTH WEBSOCKET STUFF
function wssSendName() {
    if (currentStage !== "chat" || !nickname) {
        nickname = $("#auth-input").val()
        nickname = nickname.slice(0, 50);
    }
    if (nickname.indexOf(' ') >= 0) {
        $("#auth-error").html("Не используйте пробел в имени");
        return;
    }
    if (!nickname) {
        $("#auth-error").html("Введите имя");
        return;
    }
    wssSend("auth:auth", nickname);
}
function wssSendPass(promptMessage, cache = false) {
    if (!cache) {
        const pass = prompt(promptMessage);
        if (!pass) {
            console.error("Пароль не задан");
            nickname = "";
            $("#auth-error").html("Пароль не задан");
            return;
        }
        passhash = hashCode(pass);
    }
    wssSend("auth:pass", [nickname, passhash]);
}

// AUTH MESSAGE HANDLERS
messageHandlers.authFail = (message) => {
    console.error(`AUTH_FAIL: ${message}`);
    nickname = "";
    $("#auth-error").html(message);
};
messageHandlers.authOk = (message) => {
    flags.admin = message;
    setStage("chat"); 
}
messageHandlers.authPass = (message) => {
    wssSendPass(message, false);
};

// AUTH STAGE HANDLERS
stages["auth"]["entry"] = function(){
    nickname = Cookies.get("wscname") || "";
    if (nickname) $("#auth-input").val(nickname);
    wssConnect();
}
stages["auth"]["exit"] = function(){
    $("#auth-error").html("");
    $("#auth-send").off("click");
    $(document.body).off("keydown");
}