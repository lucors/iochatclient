//Подключение клиенсткой библиотеки Socket.io 
function iolibPrepare(callback) {
    let path = `${location.protocol}://${host}`;
    if (!flags.debug){
        path += "/iochatserver";
    }
    $.getScript(`${path}/socket.io/socket.io.min.js`, callback);
}

//-------------------------------------------------------------------------------------------------------
// DOCUMENT READY EVENT
//-------------------------------------------------------------------------------------------------------
$(document).ready(function(){
    iolibPrepare(() => {
        mobilePrepare();
        setStage("auth");
    });
});