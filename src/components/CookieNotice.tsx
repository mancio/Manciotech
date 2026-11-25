import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import {useSiteLanguage} from '../i18n/SiteLanguage';
import {privacyTranslations} from '../i18n/privacyTranslations';
import {hasSeenStorageNotice, rememberStorageNotice, removeLegacyConsentCookie} from '../logic/privacy';
import {StorageDetails} from '../pages/CookiePolicy';
import './CookieNotice.css';

export const OPEN_STORAGE_DETAILS = 'manciotech:open-storage-details';
export default function CookieNotice() {
    const {language} = useSiteLanguage();
    const t = privacyTranslations[language];
    const [visible,setVisible] = useState(() => !hasSeenStorageNotice());
    const [details,setDetails] = useState(false);
    useEffect(() => {
        removeLegacyConsentCookie();
        const open = () => setDetails(true);
        window.addEventListener(OPEN_STORAGE_DETAILS, open);
        return () => window.removeEventListener(OPEN_STORAGE_DETAILS, open);
    },[]);
    function dismiss() { rememberStorageNotice(); setVisible(false); }
    return <>
        {visible && <section className="storage-notice" aria-labelledby="storage-notice-title" lang={language.toLowerCase()}>
            <div className="storage-notice-copy"><span className="storage-eyebrow">MANCIO<span>TECH</span> · {t.label}</span>
                <h2 id="storage-notice-title">{t.title}</h2><p>{t.intro}</p>
                <Link to="/cookies">{t.policy}</Link>
            </div>
            <div className="storage-notice-actions"><button type="button" onClick={()=>setDetails(true)}>{t.details}</button><button type="button" className="storage-confirm" onClick={dismiss}>{t.dismiss}</button></div>
        </section>}
        <Modal show={details} onHide={()=>setDetails(false)} centered scrollable size="lg" className="storage-modal" backdropClassName="storage-backdrop" aria-labelledby="storage-details-title">
            <Modal.Header><Modal.Title id="storage-details-title">{t.policy}</Modal.Title><button type="button" className="storage-close" aria-label={t.close} onClick={()=>setDetails(false)}>×</button></Modal.Header>
            <Modal.Body lang={language.toLowerCase()}><StorageDetails /></Modal.Body>
            <Modal.Footer><button type="button" onClick={()=>setDetails(false)}>{t.close}</button></Modal.Footer>
        </Modal>
    </>;
}
