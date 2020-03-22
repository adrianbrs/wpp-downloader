/*! wpp-downloader 2020-03-22 */

$(document).ready(() => {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {
        const port = chrome.tabs.connect(tabs[0].id, {
            name: "default-conn"
        });
        port.postMessage({
            command: "loadData"
        });
        port.onMessage.addListener(res => {
            if (res.command == "updateDone") {
                updateDone(res.data);
            } else if (res.command == "updateChatInfo") {
                updateChatInfo(res.data);
            } else if (res.command == "appendContact") {
                appendContact(res.data);
            }
        });
    });
    $("#refresh-btn").click(() => {
        location.reload();
    });
    const loadedContacts = [];
    function updateContactCounter() {
        const $contactCount = $(".contact-count");
        const $contactList = $("#contact-list");
        if (loadedContacts.length > 0) {
            if ($contactCount.hasClass("empty")) $contactCount.removeClass("empty");
            if (!$contactList.is(":visible")) {
                if ($contactList.hasClass("hidden")) $contactList.hide().removeClass("hidden");
                $contactList.fadeIn();
            }
            $contactList.find(".contact-list-wrapper").show();
            $("#download-btn").prop("disabled", true);
            $("#select-all-btn").prop("disabled", true);
        } else {
            if (!$(".contact-count").hasClass("empty")) $(".contact-count").addClass("empty");
            $contactList.find(".contact-list-wrapper").hide();
        }
        $("#contact-count-text").text(loadedContacts.length);
    }
    function updateChatInfo(data) {
        const {user: user, hasContacts: hasContacts} = data;
        if (!user.name) {
            return;
        }
        if (hasContacts) {
            const $contactList = $("#contact-list");
            if (!$contactList.is(":visible")) {
                if ($contactList.hasClass("hidden")) $contactList.hide().removeClass("hidden");
                $contactList.fadeIn();
            }
            $contactList.find(".contact-list-wrapper").show();
        }
        $("#content-wrapper").removeClass("hidden");
        $("#profile-pic").attr("src", user.profile_pic || "/assets/img/profile-pic.svg");
        $("#profile-name").text(user.name);
        $("#content-wrapper .content").slideDown();
        $(".chat-wrapper .loading-overlay").hide();
    }
    function appendContact(contact) {
        loadedContacts.push(contact);
        updateContactCounter();
        const $contactList = $("#contact-list");
        const $list = $contactList.find(".list");
        let $el = $(`<div class="contact"></div>`);
        $el.data("contact", contact);
        let number = contact.contacts.find(c => c.type === ContactType.PHONE);
        number = number ? number.value : "";
        let email = contact.contacts.find(c => c.type === ContactType.EMAIL);
        email = email ? email.value : "";
        $el.append(`\n                <img src="${contact.profile_pic || "/assets/img/profile-pic.svg"}" alt="" class="profile-pic" />\n                <div class="content">\n                    <p class="name">${contact.name}</p>\n                    <p class="number">${phoneNumber(number)}</p>\n                    <p class="email">${email}</p>\n                </div>\n            `);
        let $actions = $(`<div class="actions"></div>`);
        let $checkbox = $(`\n                <button class="btn icon select-item checkbox">\n                    <span class="mdi mdi-checkbox-blank-outline"></span>\n                </button>\n            `);
        $actions.append($checkbox);
        $el.append($actions);
        $el.hide();
        $el.insertBefore($list.find(".next-loading"));
        $el.fadeIn(800);
        const $selectAll = $contactList.find("header .select-all .checkbox");
        $checkbox.click(function() {
            if (!toggleCheckbox(this)) toggleCheckbox($selectAll, false);
            if ($contactList.find(".contact .checkbox.checked").length === $contactList.find(".contact .checkbox").length) {
                toggleCheckbox($selectAll, true);
            }
        });
        $list.stop().animate({
            scrollTop: $list.prop("scrollHeight")
        }, 500);
        const $contactsWrapper = $("#contact-list .contact-list-wrapper");
        if (!$contactsWrapper.is(":visible")) $contactsWrapper.slideDown();
    }
    function updateDone(data) {
        const $contactList = $("#contact-list");
        const $selectAll = $contactList.find("header .select-all .checkbox");
        $selectAll.click(function() {
            let value = toggleCheckbox(this);
            $contactList.find(".list .contact").each(function() {
                toggleCheckbox($(this).find(".checkbox"), value);
            });
        }).click();
        $("#download-btn").click(function() {
            let contactsToDownload = [];
            $("#contact-list .list .contact").filter(function() {
                return $(this).find(".select-item.checkbox").hasClass("checked");
            }).each(function() {
                let contactData = $(this).data("contact");
                let lc = loadedContacts.find(c => c.id === contactData.id);
                if (lc) contactsToDownload.push(lc);
            });
            let fileContent = "";
            for (let i = 0; i < contactsToDownload.length; i++) {
                let contact = contactsToDownload[i];
                let phone = contact.contacts.find(c => c.type === ContactType.PHONE);
                phone = phone ? phone.value : "";
                let email = contact.contacts.find(c => c.type === ContactType.EMAIL);
                email = email ? email.value : "";
                fileContent += `${contact.name}; ${phone}; ${email}\r\n`;
            }
            let fileName = prompt("Please enter a filename to save", "contacts");
            if (fileName == "") fileName = "contacts";
            if (fileName != null) downloadFile(`${fileName}.csv`, fileContent);
        });
        $("#contact-list .next-loading").hide();
        $("#download-btn").prop("disabled", false);
        $("#select-all-btn").prop("disabled", false);
        $("body").removeClass("loading");
    }
    function toggleCheckbox(el, value) {
        let $btn = $(el);
        if (value === undefined) value = $btn.hasClass("checked"); else value = !value;
        if (value) {
            $btn.removeClass("checked");
            $btn.find("span").attr("class", "mdi mdi-checkbox-blank-outline");
        } else {
            $btn.addClass("checked");
            $btn.find("span").attr("class", "mdi mdi-checkbox-marked");
        }
        let selectedCount = $("#contact-list .list .contact").filter(function() {
            return $(this).find(".select-item.checkbox").hasClass("checked");
        }).length;
        $("#selected-contact-count").text(selectedCount);
        return !value;
    }
});

function downloadFile(filename, data) {
    let blob = new Blob([ data ], {
        type: "text/csv"
    });
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