// Inject content script
$(document).ready(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const port = chrome.tabs.connect(tabs[0].id, { name: "default-conn" });

        // Request contact update message
        requestUpdate();

        // Listen for update message from client script
        port.onMessage.addListener(res => {
            // Update active chat
            if (res.command == "updateData") {
                updateData(res.data);
            }
        });

        // Refresh button
        $("#refresh-btn").click(() => {
            location.reload();
        });

        // Send a postMessage with loadData command
        // and shows the loading overlay element
        function requestUpdate() {
            $("#loading-overlay").show();
            port.postMessage({ command: "loadData" });
        }
    });

    // Fill data on popup HTML
    function updateData(data) {
        let { user, contact_list } = data;
        if (!user.name) return;

        // Show popup content
        $("#content-wrapper .content").slideDown(300);

        // Set profile pic
        $("#profile-pic").attr("src", user.profile_pic);
        $("#profile-name").text(user.name);

        // Add empty class to contact count if have no contacts in the list
        if (contact_list.length > 0) $(".contact-count").removeClass("empty");
        else if (!$(".contact-count").hasClass("empty"))
            $(".contact-count").addClass("empty");

        // Fill contact list count
        $("#contact-count").text(contact_list.length);

        // Insert contacts on contact list
        const $contactList = $("#contact-list");
        const $selectAll = $contactList.find("header .select-all .checkbox");
        $contactList.hide();

        for (let i = 0; i < contact_list.length; i++) {
            let contact = contact_list[i];

            let $el = $(`<div class="contact"></div>`);
            $el.data("contact-index", i);

            $el.append(`
                <img src="${contact.profile_pic ||
                    "img/profile-pic.svg"}" alt="" class="profile-pic" />
                <div class="content">
                    <p class="name">${contact.name}</p>
                    <p class="number">${phoneNumber(contact.number)}</p>
                    <p class="email">${contact.email}</p>
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
            $contactList.find(".list").append($el);

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
        }

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

        // Hide or show actions based on contact list count
        if (contact_list.length > 0) $("#actions, #contact-list").slideDown();
        else $("#actions, #contact-list").hide();

        // Hide loading overlay
        $("#loading-overlay").fadeOut();

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
                    contactsToDownload.push(
                        contact_list[$(this).data("contact-index")]
                    );
                });

            // Append contacts to a file
            let fileContent = "";
            for (let i = 0; i < contactsToDownload.length; i++) {
                let contact = contactsToDownload[i];
                fileContent += `${contact.name},${contact.number},${contact.email}\r\n`;
            }

            // Download file
            let fileName = prompt(
                "Please enter a filename to save",
                "contacts"
            );
            if (fileName == "") fileName = "contacts";
            if (fileName != null) downloadFile(`${fileName}.csv`, fileContent);
        });
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

/**
 * Formats phone number output
 * @param {string} number
 */
function phoneNumber(number) {
    return number.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, "+$1 ($2) $3-$4");
}

/**
 * Downloads a file with a content
 * @param {string} filename
 * @param {string} data
 */
function downloadFile(filename, data) {
    let blob = new Blob([data], { type: "text/csv" });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        let elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

// ScriptExecution class
(function() {
    class ScriptExecution {
        constructor(tabId) {
            this.tabId = tabId;
        }
        executeScripts(fileArray) {
            fileArray = Array.prototype.slice.call(arguments); // ES6: Array.from(arguments)
            return Promise.all(
                fileArray.map(file => exeScript(this.tabId, file))
            ).then(() => this); // 'this' will be use at next chain
        }
        executeCodes(fileArray) {
            fileArray = Array.prototype.slice.call(arguments);
            return Promise.all(
                fileArray.map(code => exeCodes(this.tabId, code))
            ).then(() => this);
        }
        injectCss(fileArray) {
            fileArray = Array.prototype.slice.call(arguments);
            return Promise.all(
                fileArray.map(file => exeCss(this.tabId, file))
            ).then(() => this);
        }
    }

    function promiseTo(fn, tabId, info) {
        return new Promise(resolve => {
            fn.call(chrome.tabs, tabId, info, x => resolve());
        });
    }

    function exeScript(tabId, path) {
        let info = { file: path, runAt: "document_end" };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    function exeCodes(tabId, code) {
        let info = { code: code, runAt: "document_end" };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    function exeCss(tabId, path) {
        let info = { file: path, runAt: "document_end" };
        return promiseTo(chrome.tabs.insertCSS, tabId, info);
    }

    window.ScriptExecution = ScriptExecution;
})();
