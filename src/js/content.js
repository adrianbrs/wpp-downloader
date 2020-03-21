// Listen for messages
$(document).ready(function() {
    chrome.runtime.onConnect.addListener(port => {
        if (port.name == "default-conn") {
            // Add listener to chanel port
            port.onMessage.addListener(msg => {
                if (msg.command == "loadData") loadData();
            });
        }

        /**
         * Load contact data from chat
         */
        function loadData() {
            let active = $(".X7YrQ ._2UaNq._3mMX1");
            let user = {
                profile_pic: active.find("img.jZhyM._13Xdg._F7Vk").attr("src"),
                name: active.find("._2WP9Q ._3NWy8 span").attr("title")
            };

            // List of contact information
            let contact_list = [];

            // Single contact messages
            $(".message-in")
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
                        new URL(profile_pic).searchParams.get("u") || "";
                    let name = $(this)
                        .find(".nUQs8 ._2LRBk.selectable-text")
                        .text();
                    contact_list.push({ profile_pic, name, number, email: "" });
                });

            // Contact group
            $(".message-in")
                .filter(function() {
                    return $(this)
                        .find(".CqLtL")
                        .find("._3j7-G").length;
                })
                .each(function() {
                    $(this)
                        .find("._1PENu .Ir_Ne")
                        .click();

                    let container = $(".app-wrapper-web").find("span ._2t4Ic");
                    let close_btn = container.find("header .qfKkX");

                    // Hide container for a while
                    container.css("display", "none");

                    // Load all contacts
                    let contacts = loadDialogContacts(container);
                    $.merge(contact_list, contacts);

                    // Close current dialog
                    close_btn.click();
                });

            // Send update message
            port.postMessage({
                command: "updateData",
                data: {
                    user,
                    contact_list
                }
            });
        }
    });

    /**
     * Load all contacts from WhatsApp contact list dialog
     * @param {object} container
     */
    function loadDialogContacts(container) {
        let contatos = [];
        container.find(".rK2ei ._1v8mQ").each(function() {
            let $cur = $(this);
            let profile_pic = $cur.find("img").attr("src") || "";
            let name = $cur.find("._3H4MS span").attr("title");
            let data = { profile_pic, name, number: "", email: "" };
            let contact = $cur.find("._1VwzF ._22OEK ._F7Vk").text();
            if (validateEmail(contact)) data.email = contact;
            else data.number = contact;
            contatos.push(data);
        });
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
});
