/*! wpp-downloader 2020-03-22 */

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
            let active = $(".X7YrQ ._2UaNq._3mMX1");
            let user = {
                profile_pic: active.find("img.jZhyM._13Xdg._F7Vk").attr("src"),
                name: active.find("._2WP9Q ._3NWy8 span").attr("title")
            };
            const $singleContacts = $(".FTBzM").filter(function() {
                return $(this).find("._2qE0x.copyable-text").find("._2kIVZ").find("._2LRBk").length && $(this).find(".Ir_Ne").length;
            });
            const $contactGroups = $(".FTBzM").filter(function() {
                return $(this).find(".CqLtL").find("._3j7-G").length && $(this).find(".Ir_Ne").length;
            });
            postMessage("updateChatInfo", {
                user: user
            });
            await Promise.all($singleContacts.map(async function() {
                $(this).find("._2qE0x ._2kIVZ").click();
                await loadDialogContacts(true);
            }));
            await Promise.all($contactGroups.map(async function() {
                $(this).find("._1PENu .Ir_Ne").click();
                await loadDialogContacts();
            }));
            return contactList;
        }
        async function loadDialogContacts(single) {
            let $container = $(".app-wrapper-web").find("span ._2t4Ic").first();
            let $close_btn = $container.find("header .qfKkX");
            $container.css("display", "none");
            let dialog_contacts = [];
            await Promise.all($($container).find(single ? ".rK2ei" : ".rK2ei ._1v8mQ").map(async function() {
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