/**
 * Contact types class
 */
class ContactType {
    static parse(value) {
        if (validatePhone(value)) return ContactType.PHONE;
        else if (validateEmail(value)) return ContactType.EMAIL;
        else if (validateURL(value)) return ContactType.SITE;
        else return ContactType.OTHER;
    }
}
ContactType.PHONE = "phone";
ContactType.EMAIL = "email";
ContactType.SITE = "site";
ContactType.OTHER = "other";

/**
 * Validate email address
 * @param {string} email
 */
function validateEmail(email) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validate phone number
 * @param {string} val
 */
function validatePhone(val) {
    let re = /^(\+)?(\d{0,2})(\d{0,2})(\d{4,5})(\d{4})$/;
    return re.test(String(val).replace(/\D+/g, ""));
}

/**
 * Validate URL
 * @param {string} val
 */
function validateURL(val) {
    try {
        new URL(val);
        return true;
    } catch (ex) {
        return false;
    }
}

/**
 * Formats phone number output
 * @param {string} number
 */
function phoneNumber(number) {
    return String(number).replace(
        /(\d{2})(\d{2})(\d{4,5})(\d{4})/,
        "+$1 ($2) $3-$4"
    );
}

/**
 * Simple string hashing
 */
function hashCode(s) {
    let h;
    for (let i = 0; i < s.length; i++)
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

    return h;
}
