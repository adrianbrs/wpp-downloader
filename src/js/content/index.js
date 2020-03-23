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
            const user = {};
            const $active = $(".X7YrQ ._2UaNq._3mMX1");
            user.profile_pic = $active
                .find("img.jZhyM._13Xdg._F7Vk")
                .attr("src");
            user.name = $active.find("._2WP9Q ._3NWy8 span").attr("title");
            if (!user.name)
                user.name = $active.find("._2WP9Q ._3H4MS span").attr("title");

            // Filter all contact messages
            const $contactMessages = $(".FTBzM").filter(function() {
                return isContactMessage(this);
            });

            // Send a message with current chat info
            postMessage("updateChatInfo", {
                user,
                hasContacts: $contactMessages.length
            });

            // Single contact messages
            await Promise.all(
                $contactMessages.map(async function() {
                    await loadMsgContacts(this);
                })
            );

            // Return data to be sent to popup
            return contactList;
        }

        /**
         * Load contacts from a chat message
         * @param {HTMLElement} msgNode
         */
        async function loadMsgContacts(msgNode) {
            if (!isContactMessage(msgNode)) return;
            const $msg = $(msgNode);
            let $modalBtn = $msg.find("._2qE0x ._2kIVZ");
            if (!$modalBtn.length) $modalBtn = $msg.find("._1PENu .Ir_Ne");

            // Open modal
            $modalBtn.click();

            // Load contacts from modal
            await loadDialogContacts(true);
        }

        /**
         * Check if a HTML node is a contact message
         * @param {HTMLElement} node
         */
        function isContactMessage(node) {
            return (
                ($(node)
                    .find("._2qE0x.copyable-text")
                    .find("._2kIVZ")
                    .find("._2LRBk").length &&
                    $(node).find(".Ir_Ne").length) ||
                ($(node)
                    .find(".CqLtL")
                    .find("._3j7-G").length &&
                    $(node).find(".Ir_Ne").length)
            );
        }

        /**
         * Load all contacts from WhatsApp contact list dialog
         */
        async function loadDialogContacts() {
            let $container = $(".app-wrapper-web")
                .find("span ._2t4Ic")
                .first();
            let $close_btn = $container.find("header .qfKkX");

            // Hide container for a while
            $container.css("display", "none");

            // Find contacts
            let $contacts = $container.find(".rK2ei ._1v8mQ");
            if (!$contacts.length) $contacts = $container.find(".rK2ei");

            // Load contacts
            let dialog_contacts = [];
            await Promise.all(
                $contacts.map(async function() {
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

        /**
         * Listen for chat content updates
         */
        if (
            "MutationObserver" in window ||
            "WebKitMutationObserver" in window
        ) {
            const $chatWrapper = $("#main ._1_q7u ._1_keJ ._1ays2");
            if ($chatWrapper && $chatWrapper.length) {
                const config = { childList: true };

                const callback = mutationsList => {
                    for (let mutation of mutationsList) {
                        if (mutation.type == "childList") {
                            for (const node of mutation.addedNodes)
                                loadMsgContacts(node);
                        }
                    }
                };

                let observer;
                if ("MutationObserver" in window)
                    observer = new MutationObserver(callback);
                else observer = new WebKitMutationObserver(callback);

                observer.observe($chatWrapper.get(0), config);
            }
        }
    });
});
