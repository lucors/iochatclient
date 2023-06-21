// COMMON VARIABLES
let nickname = "";
let host = window.location.host || "localhost:9000";
let protocol = window.location.protocol;
let hue = 0;
let socket = null;
let wssMessageHandlers = []; //[{mode: string, func: function()},...]
let currentStage = null;
let pingInterval = undefined;
let stages = {
    auth: {
        entry: null,
        exit: null,
    },
    rooms: {
        entry: null,
        exit: null,
    },
    chat: {
        entry: null,
        exit: null,
    },
};
let flags = {
    debug: (host === "localhost:9000"),
    admin: false,
}


// COMMON UTILS
function hashCode(str) {
    for(var i = 0, hc = 0; i < str.length; i++)
        hc = Math.imul(31, hc) + str.charCodeAt(i) | 0;
    return Math.abs(hc);
}
function scrollToBottom(selector) {
    $(selector).each((i, elem) => {
        elem.scrollTop = elem.scrollHeight;
    });
}
function currentDatetime() {
    const today = new Date();
    let hours = today.getHours().toString();
    if (hours.length < 2) hours = `0${hours}`;
    // 
    let minutes = today.getMinutes().toString();
    if (minutes.length < 2) minutes = `0${minutes}`;
    // 
    let seconds = today.getSeconds().toString();
    if (seconds.length < 2) seconds = `0${seconds}`;
    return `${hours}:${minutes}:${seconds}`;
}
// Обработка этапов
function setStage(stage) {
    if (stage == currentStage) return;
    if (!(stage in stages)) return;
    if (currentStage) {
        if (flags.debug) console.log(`%cЗавершение этапа: ${currentStage}`, "color: #F7AD6E");
        if (!stages[currentStage]["exit"]) {
            console.error(`Не описан обязательный обработчик для события exit, этап: ${currentStage}`);
            return;
        }
        stages[currentStage]["exit"]();
    }
    if (flags.debug) console.log(`%cНачало этапа: ${stage}`, "color: #F7AD6E");
    currentStage = stage;
    $(document.body)
        .removeClass(Object.keys(stages).join(" "))
        .addClass(stage);
    if (!stages[stage]["entry"]) {
        console.error(`Не описан обязательный обработчик для события entry, этап: ${stage}`);
        return;
    }
    stages[stage]["entry"]();
}


// COMMON WEBSOCKET STUFF
function wssConnect() {
    let socketHost = `${protocol}//${host}`;
    const socketOptions = {
        path: "/iochatserver/socket.io",
        transports: ["websocket", "polling"]
    };
    if (flags.debug){
        socketOptions.path = "";
        socketHost = `http://${host}`;
    }
    socket = io(socketHost, socketOptions);
    //Обработчики сокета
    socket.once("connect", wssOpen);
    socket.on("disconnect", wssClose);
    socket.on("connect_error", wssError);
    socket.on("error", wssError);
    socket.on("message", wssMessage);
}
function wssRecon() {
    if (currentStage === "chat" && nickname) {
        console.warn("Соединение восстановлено");
        chatPutMessage("notify", "Соединение восстановлено");
        wssSendName();
        clearRooms();
    }
}
function wssOpen() {
    $("#auth-send").click(wssSendName);
    $(document.body).on("keydown", function (e) {
        if (!$(document.body).hasClass("auth")) return;
        switch (e.key) {
            case ' ': 
                e.preventDefault();
                return;
            case "Enter":
                return wssSendName();
            default:
                $("#auth-input").focus();
        }
    });
    socket.on("connect", wssRecon);
}
function wssClose(event) {
    if ($("#auth-error").html() !== "Ошибка соединения"){
        $("#auth-error").html("Соединение закрыто. Обновите страницу");
    }
    clearInterval(pingInterval);
    console.warn("Соединение закрыто");
    chatPutMessage("notify", "Соединение закрыто");
    setTotalOnlineCounter();
    setChatOnlineCounter();
}
function wssError(event) {
    $("#auth-error").html("Ошибка соединения");
    console.error("Ошибка WebSocket");
    chatPutMessage("notify", "Ошибка WebSocket");
    socket.close();
}
function wssMessage(event) {
    try {
        if (flags.debug) console.log(`%cr: ` + event, "color: #bada55");
        const message = JSON.parse(event);
        const _done = wssMessageHandlers.some(handler => {
            if (handler.mode == message[0]) {
                handler.func(message);
                return true;
            }
        });
        if (!_done) {
            console.error(`Ошибка обработки сообщения. mode: ${message[0]}`);
        }
    }
    catch (error) {
        console.error("Ошибка: ", error);
    }
}
function wssSend(mode, data = undefined) {
    let msg = [mode];
    if (data !== undefined) msg.push(data);
    if (flags.debug) console.log(`%cs: ` + JSON.stringify(msg), "color: #77DDE7");
    return socket.send(JSON.stringify(msg));
}

// COMMON wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "PING",
    func: function(message){
        console.log(`PING timestamp: ${message[1]}`);
    }
});
wssMessageHandlers.push({
    mode: "ERROR",
    func: function(message){
        console.error(`SERVER ERROR: ${message[1]}`);
    }
});


// COMMON STAGE HANDLERS
// no stage for COMMON