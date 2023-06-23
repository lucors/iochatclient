// CHAT COMMANDS HANDLERS
chatCommandsHandlers.push({
    command: "@help",
    admin: false,
    func: function(message){
        let helpText = `
            Доступны следующие команды:<br>
            @blur &lt;text&gt; — <i>отправить размытое сообщение;</i><br>
            @direct &lt;user&gt; &lt;text&gt; — <i>отправить личное сообщение;</i><br>
        `;
        if (flags.admin) {
            helpText += `
            @hash &lt;text&gt; — <i>получить хэш строки;</i><br>
            @notify &lt;text&gt; — <i>отправить уведомление во все каналы;</i><br>
            @rnotify &lt;text&gt; — <i>отправить уведомление в этот канал;</i><br>
            @server &lt;text&gt; — <i>отправить сообщение от лица сервера;</i><br>
            @reconfig — <i>перезагрузить конфигурацию на сервере;</i><br>
            @kick — <i>кикнуть пользователя;</i><br>
            `;
        }
        helpText += ` @help — <i>показать эту справку.</i>`;
        chatPutMessage("server", helpText, {title: "Справка"});
    }
});
chatCommandsHandlers.push({
    command: "@blur",
    admin: false,
    func: function(message){
        message = message.substr(message.indexOf(' ')+1);
        if (message === "") {
            console.warn("Не отправляйте пустые сообщения");
            return false;
        }
        wssSend("msg:blur", message);
    }
});
chatCommandsHandlers.push({
    command: "@direct",
    admin: false,
    func: function(message){
        let whom = message.split(" ");
        if (whom.length < 3) {
            console.warn("Ошибка direct отправки");
            return false;
        }
        const correctMember = $.map($("#chat-members .member"), function(e){return e.innerHTML})
            .includes(whom[1]);
        if (!correctMember) {
            console.warn("Ошибка direct отправки, пользователь не определен");
            return false;
        }
        //TODO: изменить механизм определения whom и части сообщения
        wssSend("msg:direct", [whom[1], whom.slice(2).join(" ")]);
    }
});
chatCommandsHandlers.push({
    command: "@hash",
    admin: false,
    func: function(message){
        message = message.substr(message.indexOf(' ')+1);
        chatPutMessage("server", `${message} <br> ${hashCode(message)}`, {
            title: "Хэш строки"
        });
    }
});
chatCommandsHandlers.push({
    command: "@notify",
    admin: true,
    func: function(message){
        broadcast(message.substr(message.indexOf(' ')+1));
    }
});
chatCommandsHandlers.push({
    command: "@rnotify",
    admin: true,
    func: function(message){
        broadcastr(message.substr(message.indexOf(' ')+1));
    }
});
chatCommandsHandlers.push({
    command: "@server",
    admin: true,
    func: function(message){
        message = message.substr(message.indexOf(' ')+1);
        if (message === "") {
            console.warn("Не отправляйте пустые сообщения");
            return false;
        }
        wssSend("msg:server", message);
    }
});
chatCommandsHandlers.push({
    command: "@reconfig",
    admin: true,
    func: function(message){
        wssSend("cfg:reload");
        chatPutMessage("server", "Ожидайте завершение конфигурации", {
            title: "Конфигурация"
        });
    }
});
chatCommandsHandlers.push({
    command: "@kick",
    admin: true,
    func: function(message){
        let whom = message.split(" ");
        if (whom.length < 2) {
            console.warn("Ошибка kick");
            return false;
        }
        const correctMember = $.map($("#chat-clients .member"), function(e){return e.innerHTML})
            .includes(whom[1]);
        if (!correctMember) {
            console.warn("Ошибка kick, пользователь не определен");
            return false;
        }
        wssSend("mem:kick", whom[1]);
    }
});