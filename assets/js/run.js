//-------------------------------------------------------------------------------------------------------
// DOCUMENT READY EVENT
//-------------------------------------------------------------------------------------------------------
$(document).ready(function(){
    if (!["http:", "https:", "ws:"].includes(protocol)) {
        protocol = "http:";
    }
    mobilePrepare();
    setStage("auth");
});