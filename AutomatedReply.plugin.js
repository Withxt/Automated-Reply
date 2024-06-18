/**
 * @name AutomatedReply
 * @version 1.0.0
 * @description Sends an automated message whenever you receive a direct message.
 * @author Withet
 * @authorId 725560508371173377
 */

module.exports = (() => {
    return class AutomatedReply {
        constructor() {
            this.defaultSettings = {
                replyMessage: "",
                replyCooldown: 60
            };
            this.settings = BdApi.loadData("AutomatedReply", "settings") || this.defaultSettings;
            this.lastReplyTime = 0;
        }

        load() {
            console.log("The plugin has been loaded.")
        }

        start() {
            this.observeMessages();
        }

        stop() {
            BdApi.Patcher.unpatchAll();
            const Dispatcher = BdApi.findModuleByProps("dispatch", "subscribe");
            Dispatcher.unsubscribe("MESSAGE_CREATE", this.messageObserver);
        }

        observeMessages() {
            const MessageModule = BdApi.findModuleByProps("sendMessage");
            const Dispatcher = BdApi.findModuleByProps("dispatch", "subscribe");

            this.messageObserver = (e) => {
                const message = e.message;
                const channel = BdApi.findModuleByProps("getChannel", "getDMFromUserId").getChannel(message.channel_id);

                if (channel.type === 1 && message.author.id !== BdApi.findModuleByProps("getCurrentUser").getCurrentUser().id) {
                    const currentTime = Date.now();
                    if (currentTime - this.lastReplyTime >= this.settings.replyCooldown * 1000) {
                        this.sendAutoReply(channel.id);
                        this.lastReplyTime = currentTime;
                    }
                }
            };

            Dispatcher.subscribe("MESSAGE_CREATE", this.messageObserver);
        }

        sendAutoReply(channelId) {
            const MessageModule = BdApi.findModuleByProps("sendMessage");
            MessageModule.sendMessage(channelId, { content: this.settings.replyMessage });
        }

        getSettingsPanel() {
            const panel = document.createElement("div");
            panel.style.padding = "10px";
            panel.style.color = "#ccc";
            panel.style.backgroundColor = "#2f3136";
            panel.style.borderRadius = "10px";

            const settings = [
                { id: "replyMessage", name: "Reply Message", type: "textbox", value: this.settings.replyMessage },
                { id: "replyCooldown", name: "Reply Cooldown (seconds)", type: "slider", value: this.settings.replyCooldown, min: 10, max: 600 }
            ];

            settings.forEach(setting => {
                const settingElement = document.createElement("div");
                settingElement.style.marginBottom = "15px";

                const label = document.createElement("label");
                label.textContent = setting.name;
                label.style.display = "block";
                label.style.marginBottom = "5px";
                label.style.fontWeight = "bold";
                settingElement.appendChild(label);

                if (setting.type === "textbox") {
                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = setting.value;
                    input.style.width = "100%";
                    input.style.padding = "5px";
                    input.style.border = "1px solid #ccc";
                    input.style.borderRadius = "5px";
                    input.addEventListener("input", (e) => {
                        this.settings[setting.id] = e.target.value;
                        BdApi.saveData("AutomatedReply", "settings", this.settings);
                    });
                    settingElement.appendChild(input);
                } else if (setting.type === "slider") {
                    const input = document.createElement("input");
                    input.type = "range";
                    input.min = setting.min;
                    input.max = setting.max;
                    input.value = setting.value;
                    input.style.width = "100%";
                    input.addEventListener("input", (e) => {
                        this.settings[setting.id] = e.target.value;
                        BdApi.saveData("AutomatedReply", "settings", this.settings);
                        label.textContent = `${setting.name} (${e.target.value} seconds)`;
                    });
                    settingElement.appendChild(input);

                    const valueLabel = document.createElement("span");
                    valueLabel.textContent = ` (${setting.value} seconds)`;
                    settingElement.appendChild(valueLabel);
                }

                panel.appendChild(settingElement);
            });

            return panel;
        }
    };
})();
