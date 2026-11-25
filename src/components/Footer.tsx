import IpPlaceTime from "./IpPlaceTime";
import {GITHUB_URL} from "../data/games";
import '../App.css';
import {useT} from '../i18n/useT';

import {useSiteLanguage} from '../i18n/SiteLanguage';
import {privacyTranslations} from '../i18n/privacyTranslations';
import {OPEN_STORAGE_DETAILS} from './CookieNotice';

function Footer(){
    const {language}=useSiteLanguage();
    const tr=useT();
    return (
        <footer className="site-footer">
            <span>© {new Date().getFullYear()} · {tr("made with React and too much espresso")} ☕</span>
            <span className="site-footer-sep">·</span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
            <span className="site-footer-sep">·</span>
            <button type="button" className="storage-footer-button" onClick={()=>window.dispatchEvent(new Event(OPEN_STORAGE_DETAILS))}>{privacyTranslations[language].label}</button>
            <span className="site-footer-sep">·</span>
            <IpPlaceTime/>
        </footer>
    );
}

export default Footer;
