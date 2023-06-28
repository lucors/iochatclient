// MEMBERS VARIABLES


// MEMBERS UTILS
function nicknameHue(nick) {
    return (hashCode(nick) + 318) % 360;
}
function chatNewMem(who, root = "#chat-members") {
    const elem = $("<div>");
    elem.addClass("member")
        .attr("who", who)
        .html(who)
        .css({"filter": `hue-rotate(${nicknameHue(who)}deg)`});
    if (who === nickname) elem.addClass("self");
    $(root).append(elem);
}
function chatDelMem(who, root = "#chat-members") {
    $(`${root} .member[who="${who}"]`)
        .each((i, elem) => elem.remove());
}
function chatClearMem(root = "#chat-members") {
    $(`${root} .member`)
        .each((i, elem) => elem.remove());
}
function setChatOnlineCounter(count = "") {
    if (count === "") {
        $("#chat-members-count-title").html("Офлайн");
        $("#chat-members-count").html("");
    }
    else {
        $("#chat-members-count-title").html("Онлайн:");
        $("#chat-members-count").html(count);
    }
}
function setTotalOnlineCounter(count = "") {
    if (count === "") {
        $("#chat-clients-count-title").html("Офлайн");
        $("#chat-clients-count").html("");
    }
    else {
        $("#chat-clients-count-title").html("Всего онлайн:");
        $("#chat-clients-count").html(count);
    }
}


// MEMBERS MESSAGE HANDLERS
messageHandlers.memCount = (message) => {
    setChatOnlineCounter(message);
};
messageHandlers.memList = (message) => {
    if (!message.length) return chatClearMem();
    message.forEach(member => {
        chatNewMem(member);
    });
};
messageHandlers.memDel = (message) => {
    chatDelMem(message);
    chatPutMessage("notify", `${message} отключился`);
};
messageHandlers.memNew = (message) => {
    const newMemMsg = `
    <div 
    class="msgwho" 
    style="filter: hue-rotate(${nicknameHue(message)}deg);"
    >
    ${message}</div> подключился
    `; 
    chatNewMem(message);
    chatPutMessage("notify", newMemMsg);
};
messageHandlers.memKick = (message) => {
    let msg = `
    <div 
    class="msgwho" 
    style="filter: hue-rotate(${nicknameHue(message)}deg);"
    >${message}
    </div> исключен
    `; 
    if (message === nickname) {
        msg = "Вас исключили из чата.";
        console.warn("Вас исключили из чата.");
        socket.close();
        $(".member, .room").remove();
    }
    chatPutMessage("notify", msg);
};
messageHandlers.clientCount = (message) => {
    setTotalOnlineCounter(message);
};
messageHandlers.clientList = (message) => {
    if (!message.length) return chatClearMem("#chat-clients");
    message.forEach(member => {
        chatNewMem(member, "#chat-clients");
    });
};
messageHandlers.clientDel = (message) => {
    chatDelMem(message, "#chat-clients");
};
messageHandlers.clientNew = (message) => {
    const newMemMsg = `
    <div 
    class="msgwho" 
    style="filter: hue-rotate(${nicknameHue(message)}deg);"
    >
    ${message}</div> подключился
    `; 
    chatNewMem(message, "#chat-clients");
}

// MEMS STAGE HANDLERS
// MEMS uses CHAT stage