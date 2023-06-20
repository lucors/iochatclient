// AUTH VARIABLES


// AUTH UTILS


// AUTH WEBSOCKET STUFF
function wssSendName(name = null) {
    if (name) {
        nickname = name;
    }
    else {
        nickname = $("#auth-input").val();
    }
    nickname = nickname.slice(0, 50);
    if (nickname.indexOf(' ') >= 0) {
        $("#auth-error").html("Не используйте пробел в имени");
        return;
    }
    if (!nickname) {
        $("#auth-error").html("Введите имя");
        return;
    }
    wssSend("AUTH", nickname);
}

// AUTH wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "AUTH_FAIL",
    func: function(message){
        console.error(`AUTH_FAIL: ${message[1]}`);
        nickname = "";
        $("#auth-error").html(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "AUTH_OK",
    func: function(message){
        flags.admin = message[1];
        setStage("chat"); 
    }
});
wssMessageHandlers.push({
    mode: "AUTH_PASS",
    func: function(message){
        const pass = prompt(message[1]);
        if (!pass) {
            console.error("Пароль не задан");
            nickname = "";
            $("#auth-error").html("Пароль не задан");
            return;
        }
        wssSend("AUTH_PASS", [nickname, hashCode(pass)]);
    }
});

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