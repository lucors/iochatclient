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
    wssSend("ROOM_CHANGE", currentRoom);
}
function clearRooms() {
    $("#chat-rooms .room")
        .each((i, elem) => elem.remove());
}

// ROOMS WEBSOCKET STUFF


// ROOMS wssMessage HANDLERS
wssMessageHandlers.push({
    mode: "ROOMS",
    func: function(message){
        message[1].forEach(room => {
            putRoom(room);
        });
    }
});
wssMessageHandlers.push({
    mode: "ROOM_CHANGE_FAIL",
    func: function(message){
        console.error(`ROOM_CHANGE_FAIL: ${message[1]}`);
        $("#chat-rooms-error").html(message[1]);
    }
});
wssMessageHandlers.push({
    mode: "ROOM_CHANGE_OK",
    func: function(message){
        $("#chat-messages, #chat-members").empty();
        $("#chat-rooms .room")
            .removeClass("current")
            .attr("style", "");
        $(`.room[rid=${message[1]}]`)
            .addClass("current")
            .css({"filter": `hue-rotate(${hue}deg)`});
    }
});


// ROOMS STAGE HANDLERS
// ROOMS uses CHAT stage