// Listen for messages
$(document).ready(function() {
    chrome.runtime.onConnect.addListener(port => {
        // True if port has been disconnected
        let isConnected = true;

        // Port disconnect listener
        port.onDisconnect.addListener(p => {
            let error = p.error || chrome.runtime.lastError;
            if (error) {
                console.error(`Port disconnected due to an error: ${error}`);
            }
            isConnected = false;
        });

        // On message listener
        port.onMessage.addListener(msg => {
            if (msg.command == "loadData") {
                loadData().then(data => {
                    postMessage("updateDone", data);
                });
            }
        });

        /**
         * Send message if port is connected
         * @param {string} command Command name
         * @param {object} data Data to be sent
         */
        function postMessage(command, data) {
            if (isConnected) {
                port.postMessage({ command, data });
            }
        }

        // Loaded contact list
        let contactList = [];

        /**
         * Contact class
         * @param {string} name
         * @param {string} number
         * @param {string} email
         * @param {URL} profile_pic
         */
        let Contact = class {
            constructor() {
                this.name = this.profile_pic = "";
                this.contacts = [];
            }

            /**
             * Send this contact to the popup
             */
            post() {
                const hashStr =
                    this.name +
                    this.contacts.reduce(
                        (acc, val) => `${acc}.${val.value}`,
                        ""
                    );
                this.id = Math.abs(hashCode(hashStr));

                // Check if contact with this number and email already exists
                const exists = contactList.find(c => c.id === this.id);
                if (exists) return;

                contactList.push(this);
                postMessage("appendContact", this);
            }
        };

        /**
         * Load contact data from chat
         */
        async function loadData() {
            // Reset loaded contact list
            contactList = [];

            // Load current chat user info
            let active = $(".X7YrQ ._2UaNq._3mMX1");
            let user = {
                profile_pic: active.find("img.jZhyM._13Xdg._F7Vk").attr("src"),
                name: active.find("._2WP9Q ._3NWy8 span").attr("title")
            };

            // Filter all contact messages
            const $singleContacts = $(".FTBzM").filter(function() {
                return (
                    $(this)
                        .find("._2qE0x.copyable-text")
                        .find("._2kIVZ")
                        .find("._2LRBk").length && $(this).find(".Ir_Ne").length
                );
            });
            const $contactGroups = $(".FTBzM").filter(function() {
                return (
                    $(this)
                        .find(".CqLtL")
                        .find("._3j7-G").length && $(this).find(".Ir_Ne").length
                );
            });

            // Send a message with current chat info
            postMessage("updateChatInfo", { user });

            // Single contact messages
            await Promise.all(
                $singleContacts.map(async function() {
                    // Load all contacts
                    $(this)
                        .find("._2qE0x ._2kIVZ")
                        .click();

                    // Load contacts from modal
                    await loadDialogContacts(true);
                })
            );

            /**
             * Create an async function to loading contacts from modals
             * that needs to be rendered completely asynchronously
             */
            await Promise.all(
                $contactGroups.map(async function() {
                    // Load all contacts
                    $(this)
                        .find("._1PENu .Ir_Ne")
                        .click();

                    // Load contacts from modal
                    await loadDialogContacts();
                })
            );

            // Return data to be sent to popup
            return contactList;
        }

        /**
         * Load all contacts from WhatsApp contact list dialog
         * @param {boolean} single Single contact dialog
         */
        async function loadDialogContacts(single) {
            let $container = $(".app-wrapper-web")
                .find("span ._2t4Ic")
                .first();
            let $close_btn = $container.find("header .qfKkX");

            // Hide container for a while
            $container.css("display", "none");

            // Load contacts
            let dialog_contacts = [];
            await Promise.all(
                $($container)
                    .find(single ? ".rK2ei" : ".rK2ei ._1v8mQ")
                    .map(async function() {
                        let $cur = $(this);
                        let contact = new Contact();

                        // Contact name
                        contact.name = $cur.find("._3H4MS span").attr("title");

                        // Try to load profile pic
                        await $cur
                            .onAvailable("img")
                            .then($img => {
                                contact.profile_pic = $img.attr("src");
                            })
                            .catch(() => {});

                        // Get contact available contacts ._.
                        $cur.find("._1VwzF ._22OEK").each(function() {
                            const name = $(this)
                                .find(".fwByR")
                                .text();
                            const $valEl = $(this).find("._1VI-m");
                            const value =
                                $valEl.find("._F7Vk").text() || $valEl.text();
                            contact.contacts.push({
                                name,
                                value,
                                type: ContactType.parse(value)
                            });
                        });

                        dialog_contacts.push(contact);
                        contact.post();
                    })
            );

            $close_btn.click();
            return dialog_contacts;
        }
    });
});

/**
 * Returns a promise that resolve when target is available
 */
$.fn.onAvailable = function(target, options = {}) {
    let settings = $.extend(
        {},
        {
            wait_time: 10,
            max_tries: 100
        },
        options
    );
    return new Promise((solve, reject) => {
        let selector = this;
        let timer;
        if (this.find(target).length) solve(this.find(target));
        else {
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
