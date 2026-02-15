function parseBoolean(value, defaultValue) {
    if (value === undefined) return defaultValue;
    return String(value).toLowerCase() === 'true';
}

function findLeadEmail(lead) {
    if (!lead || typeof lead !== 'object') return null;

    const exactKeys = ['email', 'Email', 'emailAddress', 'Email Address'];
    for (const key of exactKeys) {
        const value = lead[key];
        if (typeof value === 'string' && value.includes('@')) return value;
    }

    for (const value of Object.values(lead)) {
        if (typeof value === 'string' && value.includes('@')) {
            return value;
        }
    }

    return null;
}

async function postJson(url, payload, errorCode) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`${errorCode}: upstream returned status ${response.status}.`);
    }
}

function createNotificationService(config = process.env) {
    const emailEnabled = parseBoolean(config.EMAIL_NOTIFICATIONS_ENABLED, true);
    const messageEnabled = parseBoolean(config.MESSAGE_NOTIFICATIONS_ENABLED, false);

    if (!emailEnabled && !messageEnabled) {
        throw new Error('NOTIFICATION_CONFIG_INVALID: enable at least one channel via EMAIL_NOTIFICATIONS_ENABLED or MESSAGE_NOTIFICATIONS_ENABLED.');
    }

    let emailConfig = null;
    if (emailEnabled) {
        const requiredEmailEnv = [
            'SMTP_HOST',
            'SMTP_PORT',
            'SMTP_USER',
            'SMTP_PASS',
            'SMTP_FROM',
            'ADMIN_ALERT_EMAIL',
            'EMAIL_SERVICE_URL'
        ];
        const missingEmailEnv = requiredEmailEnv.filter((key) => !config[key]);
        if (missingEmailEnv.length > 0) {
            throw new Error(`NOTIFICATION_CONFIG_MISSING: missing required email configuration (${missingEmailEnv.join(', ')}).`);
        }

        emailConfig = {
            smtpHost: config.SMTP_HOST,
            smtpPort: Number(config.SMTP_PORT),
            smtpUser: config.SMTP_USER,
            smtpPass: config.SMTP_PASS,
            from: config.SMTP_FROM,
            adminEmail: config.ADMIN_ALERT_EMAIL,
            serviceUrl: config.EMAIL_SERVICE_URL
        };
    }

    let messageConfig = null;
    if (messageEnabled) {
        const requiredMessageEnv = ['MESSAGE_WEBHOOK_URL'];
        const missingMessageEnv = requiredMessageEnv.filter((key) => !config[key]);
        if (missingMessageEnv.length > 0) {
            throw new Error(`NOTIFICATION_CONFIG_MISSING: missing required messaging configuration (${missingMessageEnv.join(', ')}).`);
        }

        messageConfig = {
            webhookUrl: config.MESSAGE_WEBHOOK_URL,
            adminTarget: config.MESSAGE_ADMIN_TARGET || 'admin'
        };
    }

    async function sendEmail(payload) {
        if (!emailEnabled) {
            return { delivered: false, skipped: true };
        }

        await postJson(emailConfig.serviceUrl, {
            provider: 'smtp-relay',
            smtp: {
                host: emailConfig.smtpHost,
                port: emailConfig.smtpPort,
                user: emailConfig.smtpUser,
                pass: emailConfig.smtpPass,
                from: emailConfig.from
            },
            ...payload
        }, 'EMAIL_DELIVERY_FAILED');

        return { delivered: true, skipped: false };
    }

    async function sendMessage(payload) {
        if (!messageEnabled) {
            return { delivered: false, skipped: true };
        }

        await postJson(messageConfig.webhookUrl, {
            target: messageConfig.adminTarget,
            ...payload
        }, 'MESSAGE_DELIVERY_FAILED');

        return { delivered: true, skipped: false };
    }

    async function sendLeadConfirmation(lead) {
        const leadEmail = findLeadEmail(lead);

        const emailResult = leadEmail
            ? await sendEmail({
                to: leadEmail,
                subject: `Thanks for registering with Taiseel Development (Lead ${lead.leadId})`,
                text: `We received your registration. Lead ID: ${lead.leadId}.\n\nOur team will contact you soon.`
            })
            : { delivered: false, skipped: true };

        const messageResult = await sendMessage({
            type: 'lead_confirmation',
            message: `Lead confirmation queued for ${lead.leadId}`,
            lead
        });

        return {
            emailSent: emailResult.delivered,
            messageSent: messageResult.delivered
        };
    }

    async function sendAdminLeadAlert(lead) {
        const emailResult = await sendEmail({
            to: emailConfig ? emailConfig.adminEmail : undefined,
            subject: `New lead registration (${lead.leadId})`,
            text: `A new lead registration was received.\n\n${JSON.stringify(lead, null, 2)}`
        });

        const messageResult = await sendMessage({
            type: 'admin_lead_alert',
            message: `Admin alert: new lead ${lead.leadId}`,
            lead
        });

        return {
            emailSent: emailResult.delivered,
            messageSent: messageResult.delivered
        };
    }

    return {
        sendLeadConfirmation,
        sendAdminLeadAlert,
        channels: {
            emailEnabled,
            messageEnabled
        }
    };
}

module.exports = {
    createNotificationService
};
