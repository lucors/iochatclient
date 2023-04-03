// CHAT VARIABLES


// CHAT UTILS
function chatPutMessage(type, text, options = {}) {
    const elem = $("<div>");
    elem
        .html("")
        .addClass("msg");
    switch (options.spec) {
        case 1:
            elem.addClass("direct");
            break;
        case 2: 
            elem.addClass("blur");
            break;
        default:
            break;
    }
    switch (type) {
        case "self":
            elem.css({"filter": `hue-rotate(${hue}deg)`});
            break;
        case "outer": 
            if (options.who) {
                elem.css({"filter": `hue-rotate(${nicknameHue(options.who)}deg)`})
            }
            elem.addClass("outer");
            break;
        case "server": 
            elem.addClass("server");
            break;
        case "notify":
            elem.addClass("notify");
            break;
        default:
            break;
    }

    if (options.title) {
        let msgtitle = `<div class="msgtitle">`
        msgtitle += `<div class="msgwho">${options.title}</div>`;
        if (type !== "notify") {
            msgtitle += `<div class="msgtime">${currentDatetime()}</div>`;
        }
        msgtitle += `</div>`;
        elem.html(msgtitle);
    }
    elem.html(elem.html() + `<div class="msgtext">${text}</div>`);
    $("#chat-messages").append(elem);
    scrollToBottom("#chat-messages");
}
function getMessageDir(who) {
    if (who === "Сервер") return "server";
    if (who === nickname) return "self";
    return "outer";
}
function chatInputDownHandler(e) {
    switch (e.key) {
        case "Enter":
            return wssSendMessage();
        case "Tab":
            const hinte = $("#chat-input-hint");
            if (hinte.val()) {
                $(this).val(hinte.val());
                hinte.val("");
            }
            e.preventDefault();
            $(this).focus();
            return;
        default: 
            break;
    }
}
function chatInputUpHandler(e) {
    switch (e.key) {
        default: 
            generateHint($(this).val());
            break;
    }
}
function hint(val = undefined) {
    if (val === undefined) {
        return $("#chat-input-hint").val();
    }
    return $("#chat-input-hint").val(val);
}
function generateHint(text) {
    hint("");
    if (!text) return;

    let reg = new RegExp(`^${text}`, 'g');
    if (reg.test("@help")) return hint("@help");
    if (reg.test("@blur")) return hint("@blur ");
    if (reg.test("@direct")) return hint("@direct ");
    const lastw = text.split(" ").at(-1);
    if (!lastw) return;
    //Пользователи
    $.map($(".member"), function(e){return e.innerHTML})
        .sort()
        .some((v) => {
            reg = new RegExp(`^${lastw}`, 'g');
            if (reg.test(v)) {
                const lastspace = text.lastIndexOf(" ");
                if (lastspace < 0){
                    hint(v);
                    return true;
                }
                hint(text.slice(0, text.lastIndexOf(" ")+1) + v);
                return true;
            }
        });
}


// CHAT WEBSOCKET STUFF
function wssSendMessage() {
    if (nickname === "") return;
    let message = $("#chat-input").val().slice(0, 2000);
    if (message === "") {
        console.warn("Не отправляйте пустые сообщения");
        return false;
    }

    if (/^@help/g.test(message)) {
        const helpText = `
            Доступны следующие команды:<br>
            @blur <text> -- отправить размытое сообщение;<br>
            @direct <user> <text> -- отправить личное сообщение;<br>
            @help -- показать эту справку.  
        `;
        chatPutMessage("server", helpText, {title: "Справка"});
    }
    else if (/^@blur/g.test(message)) {
        message = message.substr(message.indexOf(' ')+1);
        if (message === "") {
            console.warn("Не отправляйте пустые сообщения");
            return false;
        }
        wssSend("MSG_BLUR", message);
    }
    else if (/^@direct/g.test(message)) {
        let whom = message.split(" ");
        if (whom.length < 3) {
            console.warn("Ошибка direct отправки");
            return false;
        }
        //TODO: изменить механизм определения whom и части сообщения
        wssSend("MSG_DIRECT", [whom[1], whom.slice(2).join(" ")]);
    }
    else {
        wssSend("MSG", message);
    }
    $("#chat-input").val("");
    return true;
}
function broadcastr(msg, rid=undefined) {
    if (!msg) return;
    if (rid === undefined) {
        return wssSend("BROADCAST_R", msg);
    }
    wssSend("BROADCAST_R", [rid, msg]);
}
function broadcast(msg) {
    if (!msg) return;
    wssSend("BROADCAST", msg);
}

// CHAT wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "NOTIFY",
    func: function(message){
        chatPutMessage("notify", message[1]);
    }
});
wssMessageHandlers.push({
    mode: "MSG",
    func: function(message){
        chatPutMessage(getMessageDir(message[1][0]), message[1][1], {
            title:  message[1][0],
            who:    message[1][0],
        });
    }
});
wssMessageHandlers.push({
    mode: "MSG_DIRECT",
    func: function(message){
        chatPutMessage(getMessageDir(message[1][0]), message[1][2], {
            title:  `${message[1][0]} => ${message[1][1]}`,
            who:    message[1][0],
            spec:   1,
        });
    }
});
wssMessageHandlers.push({
    mode: "MSG_BLUR",
    func: function(message){
        chatPutMessage(getMessageDir(message[1][0]), message[1][1], {
            title:  message[1][0],
            who:    message[1][0],
            spec:   2,
        });
    }
});
wssMessageHandlers.push({
    mode: "HISTORY",
    func: function(message){
        message[1].msg.forEach(data => {
            chatPutMessage(getMessageDir(data[0]), data[1], {
                title:  data[0],
                who:    data[0],
            });
        });
        message[1].blur.forEach(data => {
            chatPutMessage(getMessageDir(data[0]), data[1], {
                title:  data[0],
                who:    data[0],
                spec:   2,
            });
        });
    }
});


// CHAT STAGE HANDLERS
stages["chat"]["entry"] = function(){
    pingInterval = setInterval(()=> {
        wssSend("PING");
    }, 30*1000);

    Cookies.set("wscname", nickname);
    hue = nicknameHue(nickname);
    $("#chat-send-form").css({"filter": `hue-rotate(${hue}deg)`});
    if (flags.admin) $("#chat-clients").removeClass("hide");
        
    // Отправка сообщений
    $("#chat-send").click(wssSendMessage);
    $("#chat-input").on("keydown", chatInputDownHandler);
    $("#chat-input").on("keyup", chatInputUpHandler);

    // Выбор комнаты
    $("#chat-rooms .room").click(changeRoom);
}
stages["chat"]["exit"] = function(){
    if (flags.debug) console.log("chat exit ОК");
}