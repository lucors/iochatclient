// COMMON VARIABLES
let nickname = "";
const host = window.location.host || "localhost:9000";
let protocol = window.location.protocol;
let hue = 0;
let socket = null;
let messageHandlers; //Объект функций-обработчиков сообщений сервера
let currentStage = null;
let pingInterval = undefined;
const stages = {
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
const flags = {
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
function humanDatetime(dt) {
    let hours = dt.getHours().toString();
    if (hours.length < 2) hours = `0${hours}`;
    // 
    let minutes = dt.getMinutes().toString();
    if (minutes.length < 2) minutes = `0${minutes}`;
    // 
    let seconds = dt.getSeconds().toString();
    if (seconds.length < 2) seconds = `0${seconds}`;
    return `${hours}:${minutes}:${seconds}`;
}
function currentDatetime() {
    return humanDatetime(new Date());
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

    //Привязка обработчиков событий
    // Общие
    socket.once("connect",      messageHandlers.onOpen);
    socket.on("disconnect",     messageHandlers.onClose);
    socket.on("connect_error",  messageHandlers.onError);
    socket.on("message",        messageHandlers.onMessage);
    socket.on("test:ping",      messageHandlers.ping)
    // Авторизация
    socket.on("auth:fail",  messageHandlers.authFail);
    socket.on("auth:ok",    messageHandlers.authOk);
    socket.on("auth:pass",  messageHandlers.authPass);
    // Комната
    socket.on("room:list",          messageHandlers.roomList);
    socket.on("room:change:fail",   messageHandlers.roomChangeFail);
    socket.on("room:change:ok",     messageHandlers.roomChangeOk);
    // Участники
    socket.on("mem:count",          messageHandlers.memCount);
    socket.on("mem:list",           messageHandlers.memList);
    socket.on("mem:del",            messageHandlers.memDel);
    socket.on("mem:new",            messageHandlers.memNew);
    socket.on("mem:kick",           messageHandlers.memKick);
    socket.on("client:count",       messageHandlers.clientCount);
    socket.on("client:list",        messageHandlers.clientList);
    socket.on("client:del",         messageHandlers.clientDel);
    socket.on("client:new",         messageHandlers.clientNew);
    // Чат
    socket.on("msg:notify",         messageHandlers.notify);
    socket.on("msg:msg",            messageHandlers.msg);
    socket.on("msg:blur",           messageHandlers.msgBlur);
    socket.on("msg:direct",         messageHandlers.msgDirect);
    socket.on("history:list",       messageHandlers.history);
    socket.on("cfg:reload:ok",      messageHandlers.cfgreloadOk);
}
function wssSend(mode, data = undefined) {
    if (flags.debug) console.log(`%cs: ${mode}${(data === undefined) ? "" : "," + data}`, "color: #77DDE7");
    if (data === undefined) return socket.emit(mode);
    return socket.emit(mode, data);
}

// COMMON MESSAGE HANDLERS
messageHandlers = {
    ping: (timestamp) => {
        console.log(`PING timestamp: ${timestamp}`);
    },
    onError: (event) => {
        $("#auth-error").html("Ошибка соединения");
        console.error("Ошибка WebSocket");
        chatPutMessage("notify", "Ошибка WebSocket");
        socket.close();
    },
    onOpen: () => {
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
        socket.on("connect", messageHandlers.onRecon);
    },
    onRecon: () => {
        if (currentStage === "chat" && nickname) {
            console.warn("Соединение восстановлено");
            chatPutMessage("notify", "Соединение восстановлено");
            wssSendName();
            clearRooms();
        }
    },
    onClose: (event) => {
        if ($("#auth-error").html() !== "Ошибка соединения"){
            $("#auth-error").html("Соединение закрыто. Обновите страницу");
        }
        clearInterval(pingInterval);
        console.warn("Соединение закрыто");
        chatPutMessage("notify", "Соединение закрыто");
        setTotalOnlineCounter();
        setChatOnlineCounter();
    },
    onMessage: (raw) => {
        console.warn("Неподдерживаемое сообщение от сервера: " + raw);
    },
    error: (message) => {
        console.error(`SERVER ERROR: ${message}`);
    }
}


// COMMON STAGE HANDLERS
// no stage for COMMON