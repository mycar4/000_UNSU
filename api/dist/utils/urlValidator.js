export function validateShoppingUrl(urlString) {
    try {
        const parsedUrl = new URL(urlString);
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            console.warn(`[Security] Blocked protocol: ${parsedUrl.protocol}`);
            return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
