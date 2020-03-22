// Inject content script
$(document).ready(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const port = chrome.tabs.connect(tabs[0].id, { name: "default-conn" });

        // Request contact update message
        port.postMessage({ command: "loadData" });

        // Listen for update message from client script
        port.onMessage.addListener(res => {
            // Update active chat
            if (res.command == "updateDone") {
                updateDone(res.data);
            } else if (res.command == "updateChatInfo") {
                updateChatInfo(res.data);
            } else if (res.command == "appendContact") {
                appendContact(res.data);
            }
        });
    });

    // Refresh button
    $("#refresh-btn").click(() => {
        location.reload();
    });

    // Loaded contact list
    const loadedContacts = [];

    /**
     * Update contact count
     */
    function updateContactCounter() {
        const $contactCount = $(".contact-count");
        const $contactList = $("#contact-list");

        if (loadedContacts.length > 0) {
            if ($contactCount.hasClass("empty"))
                $contactCount.removeClass("empty");

            if (!$contactList.is(":visible")) {
                $("#contact-list")
                    .hide()
                    .removeClass("hidden")
                    .fadeIn();
            }
            $contactList.find(".contact-list-wrapper").show();
            $("#download-btn").prop("disabled", true);
            $("#select-all-btn").prop("disabled", true);
        } else {
            if (!$(".contact-count").hasClass("empty"))
                $(".contact-count").addClass("empty");

            $contactList.find(".contact-list-wrapper").hide();
        }

        // Fill contact list count
        $("#contact-count-text").text(loadedContacts.length);
    }

    /**
     * Updates opened chat user data
     * @param {object} data
     */
    function updateChatInfo(data) {
        const { user } = data;
        if (!user.name) {
            return;
        }

        // Show popup content
        $("#content-wrapper").removeClass("hidden");

        // Set profile pic
        $("#profile-pic").attr("src", user.profile_pic);
        $("#profile-name").text(user.name);

        // Show popup content
        $("#content-wrapper .content").slideDown();

        // Hide loading overlay
        $(".chat-wrapper .loading-overlay").hide();
    }

    /**
     * Append a contact to the popup DOM contact list
     * @param {object} contact
     */
    function appendContact(contact) {
        loadedContacts.push(contact);

        // Update counter
        updateContactCounter();

        // Append contact to the DOM
        const $contactList = $("#contact-list");
        const $list = $contactList.find(".list");
        let $el = $(`<div class="contact"></div>`);
        $el.data("contact", contact);

        // Get first number and email
        let number = contact.contacts.find(c => c.type === ContactType.PHONE);
        number = number ? number.value : "";
        let email = contact.contacts.find(c => c.type === ContactType.EMAIL);
        email = email ? email.value : "";

        $el.append(`
                <img src="${contact.profile_pic ||
                    "img/profile-pic.svg"}" alt="" class="profile-pic" />
                <div class="content">
                    <p class="name">${contact.name}</p>
                    <p class="number">${phoneNumber(number)}</p>
                    <p class="email">${email}</p>
                </div>
            `);

        let $actions = $(`<div class="actions"></div>`);
        let $checkbox = $(`
                <button class="btn icon select-item checkbox">
                    <span class="mdi mdi-checkbox-blank-outline"></span>
                </button>
            `);
        $actions.append($checkbox);

        $el.append($actions);
        $el.hide();
        $el.insertBefore($list.find(".next-loading"));
        $el.fadeIn(800);

        // Checkbox click listener
        const $selectAll = $contactList.find("header .select-all .checkbox");
        $checkbox.click(function() {
            if (!toggleCheckbox(this)) toggleCheckbox($selectAll, false);

            // Check if all checkbox are marked
            if (
                $contactList.find(".contact .checkbox.checked").length ===
                $contactList.find(".contact .checkbox").length
            ) {
                toggleCheckbox($selectAll, true);
            }
        });

        // Scroll list down
        $list.stop().animate({ scrollTop: $list.prop("scrollHeight") }, 500);

        // Check if contact list wrapper is shown
        const $contactsWrapper = $("#contact-list .contact-list-wrapper");
        if (!$contactsWrapper.is(":visible"))
            $("#contact-list .contact-list-wrapper").slideDown();
    }

    // Finish contact loading
    function updateDone(data) {
        // Insert contacts on contact list
        const $contactList = $("#contact-list");
        const $selectAll = $contactList.find("header .select-all .checkbox");

        // Select all button
        $selectAll
            .click(function() {
                let value = toggleCheckbox(this);

                // Select all
                $contactList.find(".list .contact").each(function() {
                    toggleCheckbox($(this).find(".checkbox"), value);
                });
            })
            .click();

        // Download button listener
        $("#download-btn").click(function() {
            // Get selected contacts
            let contactsToDownload = [];
            $("#contact-list .list .contact")
                .filter(function() {
                    return $(this)
                        .find(".select-item.checkbox")
                        .hasClass("checked");
                })
                .each(function() {
                    let contactData = $(this).data("contact");
                    let lc = loadedContacts.find(c => c.id === contactData.id);
                    if (lc) contactsToDownload.push(lc);
                });

            // Append contacts to a file
            let fileContent = "";
            for (let i = 0; i < contactsToDownload.length; i++) {
                let contact = contactsToDownload[i];

                // Get first number and email
                let phone = contact.contacts.find(
                    c => c.type === ContactType.PHONE
                );
                phone = phone ? phone.value : "";
                let email = contact.contacts.find(
                    c => c.type === ContactType.EMAIL
                );
                email = email ? email.value : "";

                // Add to file content
                fileContent += `${contact.name}; ${phone}; ${email}\r\n`;
            }

            // Download file
            let fileName = prompt(
                "Please enter a filename to save",
                "contacts"
            );
            if (fileName == "") fileName = "contacts";
            if (fileName != null) downloadFile(`${fileName}.csv`, fileContent);
        });

        // Hide loading after load all contacts
        $("#contact-list .next-loading").hide();

        // Enable buttons
        $("#download-btn").prop("disabled", false);
        $("#select-all-btn").prop("disabled", false);
        $("body").removeClass("loading");
    }

    /**
     * Toggle checkbox style when click
     * @param {object} el Checkbox element
     * @param {boolean} value Enable/disable checkbox
     * @returns {boolean} Current checkbox value
     */
    function toggleCheckbox(el, value) {
        let $btn = $(el);
        if (value === undefined) value = $btn.hasClass("checked");
        else value = !value;

        if (value) {
            $btn.removeClass("checked");
            $btn.find("span").attr("class", "mdi mdi-checkbox-blank-outline");
        } else {
            $btn.addClass("checked");
            $btn.find("span").attr("class", "mdi mdi-checkbox-marked");
        }

        // Update selected text
        let selectedCount = $("#contact-list .list .contact").filter(
            function() {
                return $(this)
                    .find(".select-item.checkbox")
                    .hasClass("checked");
            }
        ).length;
        $("#selected-contact-count").text(selectedCount);
        return !value;
    }
});
