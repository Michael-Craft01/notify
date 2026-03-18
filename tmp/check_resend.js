const { Resend } = require('resend');
const resend = new Resend("re_f9SrNNUz_MQ2GXFVNmxaxxSnY8P8532hr");

async function checkDomains() {
    try {
        const { data, error } = await resend.domains.list();
        if (error) {
            console.error("Resend Error:", error);
        } else {
            console.log("Verified Domains:", data);
        }
    } catch (err) {
        console.error("Exception:", err.message);
    }
}

checkDomains();
