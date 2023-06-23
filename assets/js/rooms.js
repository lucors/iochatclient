// ROOMS VARIABLES
let currentRoom = 0;

// ROOMS UTILS
function putRoom(room) {
    const elem = $("<div>");
    elem.addClass("room")
        .attr("rid", room.rid)
        .html(room.title);
    $("#chat-rooms").append(elem);
}
function changeRoom() {
    $("#chat-rooms-error").html("");
    currentRoom = $(this).attr("rid");
    wssSend("room:change", currentRoom);
}
function clearRooms() {
    $("#chat-rooms .room")
        .each((i, elem) => elem.remove());
}

// ROOMS WEBSOCKET STUFF


// ROOMS MESSAGE HANDLERS
messageHandlers.roomList = (message) => {
    message.forEach(room => {
        putRoom(room);
    });
};
messageHandlers.roomChangeFail = (message) => {
    console.error(`ROOM_CHANGE_FAIL: ${message}`);
    $("#chat-rooms-error").html(message);
};
messageHandlers.roomChangeOk = (message) => {
    $("#chat-messages, #chat-members").empty();
    $("#chat-rooms .room")
        .removeClass("current")
        .attr("style", "");
    $(`.room[rid=${message}]`)
        .addClass("current")
        .css({"filter": `hue-rotate(${hue}deg)`});
};

// ROOMS STAGE HANDLERS
// ROOMS uses CHAT stage