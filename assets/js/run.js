//-------------------------------------------------------------------------------------------------------
// DOCUMENT READY EVENT
//-------------------------------------------------------------------------------------------------------
$(document).ready(function(){
    flags.debug = !(document.location.host === "lucors.ru");
    setStage("auth");
});