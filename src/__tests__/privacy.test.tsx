import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import CookieNotice, {OPEN_STORAGE_DETAILS} from '../components/CookieNotice';
import {SiteLanguageProvider} from '../i18n/SiteLanguage';
import {hasSeenStorageNotice, NOTICE_COOKIE, rememberStorageNotice} from '../logic/privacy';
import {getTimeDateFormatted} from '../logic/time';

function mount() { return render(<MemoryRouter><SiteLanguageProvider><CookieNotice /></SiteLanguageProvider></MemoryRouter>); }
beforeEach(() => {
    localStorage.clear();
    document.cookie = `${NOTICE_COOKIE}=; Max-Age=0; Path=/`;
    document.cookie = 'CookieConsent=; Max-Age=0; Path=/';
});
test('dismisses the information notice, remembers it and can reopen details', async () => {
    const {unmount} = mount();
    expect(screen.getByText(/We do not use analytics/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:'Got it'}));
    expect(hasSeenStorageNotice()).toBe(true);
    expect(screen.queryByRole('heading', {name:'Your privacy, clearly explained'})).not.toBeInTheDocument();
    unmount(); mount();
    expect(screen.queryByRole('button', {name:'Got it'})).not.toBeInTheDocument();
    fireEvent(window, new Event(OPEN_STORAGE_DETAILS));
    expect(await screen.findByRole('dialog')).toHaveTextContent('checkedIngredients');
    fireEvent.click(screen.getAllByRole('button', {name:'Close', exact:true})[0]);
    await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
test('legacy acceptance is removed and never treated as tracking consent', () => {
    document.cookie = 'CookieConsent=true; Path=/';
    mount();
    expect(screen.getByRole('button', {name:'Got it'})).toBeInTheDocument();
    expect(document.cookie).not.toContain('CookieConsent');
    expect(document.cookie).not.toContain(NOTICE_COOKIE);
});
test('notice acknowledgement expires after six calendar months', () => {
    const write = jest.spyOn(document, 'cookie', 'set');
    rememberStorageNotice();
    const expiry = new Date(); expiry.setMonth(expiry.getMonth()+6);
    expect(write).toHaveBeenCalledWith(expect.stringContaining(`Expires=${expiry.toUTCString()}`));
    expect(write).toHaveBeenCalledWith(expect.stringContaining('SameSite=Lax'));
    write.mockRestore();
});
test('unavailable cookie storage does not prevent dismissal', () => {
    const write = jest.spyOn(document, 'cookie', 'set').mockImplementation(()=>{ throw new Error('blocked'); });
    mount(); fireEvent.click(screen.getByRole('button', {name:'Got it'}));
    expect(screen.queryByRole('button', {name:'Got it'})).not.toBeInTheDocument();
    write.mockRestore();
});
test.each([['IT','Ho capito'],['PL','Rozumiem']])('notice supports %s', (language,label) => {
    localStorage.setItem('manciotechSiteLanguage', language);
    mount(); expect(screen.getByRole('button', {name:label})).toBeInTheDocument();
});
test('clock works without requesting IP geolocation', async () => {
    const original = global.fetch;
    global.fetch = jest.fn();
    expect(await getTimeDateFormatted()).toEqual({date:expect.any(String),time:expect.any(String)});
    expect(global.fetch).not.toHaveBeenCalled();
    global.fetch = original;
});
