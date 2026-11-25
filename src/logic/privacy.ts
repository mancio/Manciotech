export const NOTICE_COOKIE = 'manciotechStorageNotice';
export const NOTICE_VERSION = '1';
export function hasSeenStorageNotice(): boolean {
    try {
        return document.cookie.split(';').some(value => value.trim() === `${NOTICE_COOKIE}=${NOTICE_VERSION}`);
    } catch { return false; }
}
export function rememberStorageNotice(): void {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 6);
    try {
        document.cookie = `${NOTICE_COOKIE}=${NOTICE_VERSION}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    } catch { /* The notice still closes if browser storage is blocked. */ }
}
// The old acknowledgement was not granular tracking consent. Never migrate it as consent.
export function removeLegacyConsentCookie(): void {
    try {
        document.cookie = 'CookieConsent=; Path=/; Max-Age=0; SameSite=Lax';
        if (window.location.hostname.endsWith('manciotech.net')) {
            document.cookie = 'CookieConsent=; Domain=manciotech.net; Path=/; Max-Age=0; SameSite=Lax';
        }
    } catch {}
}
