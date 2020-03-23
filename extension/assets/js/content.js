/*! wpp-downloader 2020-03-23 */

$(document).ready(function() {
    chrome.runtime.onConnect.addListener(port => {
        let isConnected = true;
        port.onDisconnect.addListener(p => {
            let error = p.error || chrome.runtime.lastError;
            if (error) {
                console.error(`Port disconnected due to an error: ${error}`);
            }
            isConnected = false;
        });
        port.onMessage.addListener(msg => {
            if (msg.command == "loadData") {
                loadData().then(data => {
                    postMessage("updateDone", data);
                });
            }
        });
        function postMessage(command, data) {
            if (isConnected) {
                port.postMessage({
                    command: command,
                    data: data
                });
            }
        }
        let contactList = [];
        let Contact = class {
            constructor() {
                this.name = this.profile_pic = "";
                this.contacts = [];
            }
            post() {
                const hashStr = this.name + this.contacts.reduce((acc, val) => `${acc}.${val.value}`, "");
                this.id = Math.abs(hashCode(hashStr));
                const exists = contactList.find(c => c.id === this.id);
                if (exists) return;
                contactList.push(this);
                postMessage("appendContact", this);
            }
        };
        async function loadData() {
            contactList = [];
            const user = {};
            const $active = $(".X7YrQ ._2UaNq._3mMX1");
            user.profile_pic = $active.find("img.jZhyM._13Xdg._F7Vk").attr("src");
            user.name = $active.find("._2WP9Q ._3NWy8 span").attr("title");
            if (!user.name) user.name = $active.find("._2WP9Q ._3H4MS span").attr("title");
            const $contactMessages = $(".FTBzM").filter(function() {
                return isContactMessage(this);
            });
            postMessage("updateChatInfo", {
                user: user,
                hasContacts: $contactMessages.length
            });
            await Promise.all($contactMessages.map(async function() {
                await loadMsgContacts(this);
            }));
            return contactList;
        }
        async function loadMsgContacts(msgNode) {
            if (!isContactMessage(msgNode)) return;
            const $msg = $(msgNode);
            let $modalBtn = $msg.find("._2qE0x ._2kIVZ");
            if (!$modalBtn.length) $modalBtn = $msg.find("._1PENu .Ir_Ne");
            $modalBtn.click();
            await loadDialogContacts(true);
        }
        function isContactMessage(node) {
            return $(node).find("._2qE0x.copyable-text").find("._2kIVZ").find("._2LRBk").length && $(node).find(".Ir_Ne").length || $(node).find(".CqLtL").find("._3j7-G").length && $(node).find(".Ir_Ne").length;
        }
        async function loadDialogContacts() {
            let $container = $(".app-wrapper-web").find("span ._2t4Ic").first();
            let $close_btn = $container.find("header .qfKkX");
            $container.css("display", "none");
            let $contacts = $container.find(".rK2ei ._1v8mQ");
            if (!$contacts.length) $contacts = $container.find(".rK2ei");
            let dialog_contacts = [];
            await Promise.all($contacts.map(async function() {
                let $cur = $(this);
                let contact = new Contact();
                contact.name = $cur.find("._3H4MS span").attr("title");
                await $cur.onAvailable("img").then($img => {
                    contact.profile_pic = $img.attr("src");
                }).catch(() => {});
                $cur.find("._1VwzF ._22OEK").each(function() {
                    const name = $(this).find(".fwByR").text();
                    const $valEl = $(this).find("._1VI-m");
                    const value = $valEl.find("._F7Vk").text() || $valEl.text();
                    contact.contacts.push({
                        name: name,
                        value: value,
                        type: ContactType.parse(value)
                    });
                });
                dialog_contacts.push(contact);
                contact.post();
            }));
            $close_btn.click();
            return dialog_contacts;
        }
        if ("MutationObserver" in window || "WebKitMutationObserver" in window) {
            const $chatWrapper = $("#main ._1_q7u ._1_keJ ._1ays2");
            if ($chatWrapper && $chatWrapper.length) {
                const config = {
                    childList: true
                };
                const callback = mutationsList => {
                    for (let mutation of mutationsList) {
                        if (mutation.type == "childList") {
                            for (const node of mutation.addedNodes) loadMsgContacts(node);
                        }
                    }
                };
                let observer;
                if ("MutationObserver" in window) observer = new MutationObserver(callback); else observer = new WebKitMutationObserver(callback);
                observer.observe($chatWrapper.get(0), config);
            }
        }
    });
});

$.fn.onAvailable = function(target, options = {}) {
    let settings = $.extend({}, {
        wait_time: 10,
        max_tries: 100
    }, options);
    return new Promise((solve, reject) => {
        let selector = this;
        let timer;
        if (this.find(target).length) solve(this.find(target)); else {
            let tries = 0;
            timer = setInterval(() => {
                let $target = selector.find(target);
                if ($target.length) {
                    solve($target);
                    clearInterval(timer);
                } else if (tries == settings.max_tries) {
                    reject();
                }
                tries++;
            }, settings.wait_time);
        }
    });
};