// Listen for messages
$(document).ready(function() {
    chrome.runtime.onConnect.addListener(port => {
        if (port.name == "default-conn") {
            // Add listener to chanel port
            port.onMessage.addListener(msg => {
                if (msg.command == "loadData") {
                    loadData().then(data =>
                        port.postMessage({
                            command: "updateData",
                            data
                        })
                    );
                }
            });
        }

        /**
         * Load contact data from chat
         */
        async function loadData() {
            let active = $(".X7YrQ ._2UaNq._3mMX1");
            let user = {
                profile_pic: active.find("img.jZhyM._13Xdg._F7Vk").attr("src"),
                name: active.find("._2WP9Q ._3NWy8 span").attr("title")
            };

            // List of contact information
            let contact_list = [];

            // Single contact messages
            $(".FTBzM")
                .filter(function() {
                    return $(this)
                        .find("._2qE0x.copyable-text")
                        .find("._3RWII")
                        .find("img").length;
                })
                .each(function() {
                    let profile_pic =
                        $(this)
                            .find("img")
                            .attr("src") || "";
                    let number =
                        new URL(profile_pic).searchParams
                            .get("u")
                            .replace(/\D+/g, "") || "";
                    let name = $(this)
                        .find(".nUQs8 ._2LRBk.selectable-text")
                        .text();

                    let data = { profile_pic, name, number, email: "" };
                    contact_list.push(data);
                });

            /**
             * Create an async function to loading contacts from modals
             * that needs to be rendered completely asynchronously
             */
            await Promise.all(
                $(".FTBzM")
                    .filter(function() {
                        return $(this)
                            .find(".CqLtL")
                            .find("._3j7-G").length;
                    })
                    .map(async function() {
                        // Load all contacts
                        $(this)
                            .find("._1PENu .Ir_Ne")
                            .click();

                        let container = $(".app-wrapper-web")
                            .find("span ._2t4Ic")
                            .first();
                        let close_btn = container.find("header .qfKkX");

                        // Hide container for a while
                        container.css("display", "none");

                        // Load contacts from modal
                        await loadDialogContacts(container).then(contacts => {
                            $.merge(contact_list, contacts);
                        });

                        close_btn.click();
                    })
            );

            // Return data to be sent to popup
            return { user, contact_list };
        }
    });

    /**
     * Load all contacts from WhatsApp contact list dialog
     * @param {object} container
     */
    async function loadDialogContacts(container) {
        let contatos = [];
        await Promise.all(
            $(container)
                .find(".rK2ei ._1v8mQ")
                .map(async function() {
                    let $cur = $(this);
                    let name = $cur.find("._3H4MS span").attr("title");
                    let data = { profile_pic: "", name, number: "", email: "" };

                    // Try to load profile pic
                    await $cur.onAvailable("img").then($img => {
                        data.profile_pic = $img.attr("src");
                    });

                    // Get contact number/email
                    let contact = $cur
                        .find("._1VwzF ._22OEK ._F7Vk")
                        .first()
                        .text();

                    if (validateEmail(contact)) data.email = contact;
                    else data.number = parseNumber(contact);
                    contatos.push(data);
                    console.log(data);
                })
        );
        return contatos;
    }

    /**
     * Validate email address
     * @param {string} email
     */
    function validateEmail(email) {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    /**
     * Extract numbers from string
     * @param {string} val
     */
    function parseNumber(val) {
        return val.replace(/\D+/g, "");
    }
});

/**
 * Returns a promise that resolve when target is available
 */
$.fn.onAvailable = function(target, options = {}) {
    let settings = $.extend(
        {},
        {
            wait_time: 50,
            max_tries: 70
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
