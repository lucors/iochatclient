//Подключение клиенсткой библиотеки Socket.io 
function iolibPrepare(callback) {
    let path = `${protocol}//${host}`;
    if (!flags.debug){
        path += "/iochatserver";
    }
    $.getScript(`${path}/socket.io/socket.io.min.js`, callback);
}

//-------------------------------------------------------------------------------------------------------
// DOCUMENT READY EVENT
//-------------------------------------------------------------------------------------------------------
$(document).ready(function(){
    if (!["http:", "https", "ws:"].includes(protocol)) {
        protocol = "http:";
    }
    iolibPrepare(() => {
        mobilePrepare();
        setStage("auth");
    });
});