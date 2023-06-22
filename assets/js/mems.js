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


// MEMBERS wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "COUNT",
    func: function(message){
        setTotalOnlineCounter(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "ROOM_COUNT",
    func: function(message){
        setChatOnlineCounter(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "MEMBERS",
    func: function(message){
        message[1].forEach(member => {
            chatNewMem(member);
        });
    }
});
wssMessageHandlers.push({
    mode: "DEL_MEM",
    func: function(message){
        chatDelMem(message[1]);
        chatPutMessage("notify", `${message[1]} отключился`);
    }
});
wssMessageHandlers.push({
    mode: "NEW_MEM",
    func: function(message){
        const newMemMsg = `
        <div 
        class="msgwho" 
        style="filter: hue-rotate(${nicknameHue(message[1])}deg);"
        >
        ${message[1]}</div> подключился
        `; 
        chatNewMem(message[1]);
        chatPutMessage("notify", newMemMsg);
    }
});
wssMessageHandlers.push({
    mode: "KICK",
    func: function(message){
        let msg = `
        <div 
        class="msgwho" 
        style="filter: hue-rotate(${nicknameHue(message[1])}deg);"
        >${message[1]}
        </div> исключен
        `; 
        if (message[1] === nickname) {
            msg = "Вас исключили из чата.";
            console.warn("Вас исключили из чата.");
            socket.close();
            $(".member, .room").remove();
        }
        chatPutMessage("notify", msg);
    }
});


wssMessageHandlers.push({
    mode: "CLIENTS",
    func: function(message){
        message[1].forEach(member => {
            chatNewMem(member, "#chat-clients");
        });
    }
});
wssMessageHandlers.push({
    mode: "DEL_CLI",
    func: function(message){
        chatDelMem(message[1], "#chat-clients");
    }
});
wssMessageHandlers.push({
    mode: "NEW_CLI",
    func: function(message){
        const newMemMsg = `
        <div 
        class="msgwho" 
        style="filter: hue-rotate(${nicknameHue(message[1])}deg);"
        >
        ${message[1]}</div> подключился
        `; 
        chatNewMem(message[1], "#chat-clients");
    }
});