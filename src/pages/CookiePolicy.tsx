import {Link} from 'react-router-dom';
import {useSiteLanguage} from '../i18n/SiteLanguage';
import {privacyTranslations} from '../i18n/privacyTranslations';
import '../components/CookieNotice.css';

export function StorageDetails() {
    const {language} = useSiteLanguage();
    const t = privacyTranslations[language];
    const names = ['manciotechStorageNotice (cookie)', 'manciotechSiteLanguage / currentLanguage (localStorage)', 'checkedIngredients (localStorage)', 'plnames / plscore (localStorage)'];
    return <div className="storage-details">
        <p className="storage-badge">{t.badge}</p>
        <h2>{t.necessary}</h2><p>{t.explanation}</p><p>{t.local}</p>
        <div className="storage-table-wrap" role="region" aria-label={t.details} tabIndex={0}>
            <table><caption>{t.details}</caption><thead><tr>{t.columns.map(s=><th scope="col" key={s}>{s}</th>)}</tr></thead>
            <tbody>{names.map((name,i)=><tr key={name}><th scope="row">{name}<small>manciotech.net</small></th><td>{t.purposes[i]}</td><td>{i===0?t.months:t.duration}</td></tr>)}</tbody></table>
        </div>
        <h2>{t.manageTitle}</h2><p>{t.manage}</p>
        <h2>{t.providersTitle}</h2><p>{t.providers}</p>
        <p className="storage-provider-links"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google / Firebase</a> · <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit</a></p>
        <p>{t.future}</p><p>{t.owner} <a href="mailto:andrea@manciotech.net">andrea@manciotech.net</a></p>
        <p className="storage-updated">{t.updated}</p>
    </div>;
}
export default function CookiePolicy() {
    const {language} = useSiteLanguage();
    const t = privacyTranslations[language];
    return <main className="storage-policy"><Link to="/">← {t.home}</Link><h1>{t.policy}</h1><StorageDetails /></main>;
}
