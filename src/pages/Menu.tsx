import '../App.css';
import {useNavigate} from 'react-router-dom';
import {KITCHEN_TOOLS, RECIPES, SCORE_COUNTER, STOCKS, TEMP, SERVICE_PATHS} from "../logic/Names";
import {useSiteLanguage} from "../i18n/SiteLanguage";
import {homeTranslations} from "../i18n/homeTranslations";

type TileKey = 'score' | 'recipes' | 'kitchen' | 'temp' | 'lessons';
interface Tile {
    key: TileKey;
    emoji: string;
    go: () => void;
}

function TileGrid({tiles, labels}: {tiles: Tile[]; labels: {[K in TileKey]: readonly [string, string]}}) {
    return (
        <div className="tile-grid">
            {tiles.map(tile => (
                <button key={tile.key} className="tile" onClick={tile.go}>
                    <span className="tile-emoji" aria-hidden="true">{tile.emoji}</span>
                    <span className="tile-title">{labels[tile.key][0]}</span>
                    <span className="tile-blurb">{labels[tile.key][1]}</span>
                </button>
            ))}
        </div>
    );
}

function openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

function Menu() {
    const navigate = useNavigate();
    const {language}=useSiteLanguage();
    const t=homeTranslations[language];

    const otherStuff: Tile[] = [
        {key: 'score', emoji: '🃏', go: () => navigate(SCORE_COUNTER)},
        {key: 'recipes', emoji: '🍝', go: () => navigate(RECIPES)},
        {key: 'kitchen', emoji: '🥖', go: () => navigate(KITCHEN_TOOLS)},
        {key: 'temp', emoji: '🌡️', go: () => navigate(TEMP)},
        {key: 'lessons', emoji: '🧠', go: () => openExternal('https://karpathy-by-mancio-586e3f.gitlab.io')},
    ];

    return (
        <div className="home" lang={language.toLowerCase()}>
            <header className="hero">
                <h1 className="hero-logo">Manciotech</h1>
                <p className="hero-tagline">{t.tagline}</p>
            </header>

            <section className="section" aria-labelledby="browser-tools-title">
                <h2 id="browser-tools-title" className="section-title">{t.browserToolsHeading}</h2>
                <article className="tile stocks-card">
                    <figure className="stocks-chart">
                        <svg viewBox="0 0 160 88" width="160" height="88" aria-hidden="true">
                            <path d="M10 14v64h140M10 45h140" fill="none" stroke="#405464" strokeWidth="1"/>
                            <path d="m14 25 24-10 20 18 17 4 17 27" fill="none" stroke="#ff987e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="m92 64 17-15 9 3 15-25 13-10" fill="none" stroke="#a8ecd3" strokeWidth="4" strokeDasharray="5 6" strokeLinecap="round"/>
                            <circle cx="92" cy="64" r="5" fill="#ffd58a" stroke="#101a22" strokeWidth="2"/>
                        </svg>
                        <figcaption>{t.stocksCaption}</figcaption>
                    </figure>
                    <div className="stocks-copy">
                        <h3 className="tile-title">{t.stocksTitle}</h3>
                        <p className="tile-blurb">{t.stocksDescription}</p>
                        <a href={STOCKS} className="btn btn-primary">{t.stocksLink} <span aria-hidden="true">↗</span></a>
                    </div>
                </article>
            </section>

            <section className="section" aria-labelledby="pii-remover-title">
                <h2 id="pii-remover-title" className="section-title">{t.pcApp}</h2>
                <div className="tile pc-app-card">
                    <div className="harmono-app-heading">
                        <img className="harmono-app-icon pc-app-icon" src="/mancio-pii-remover.svg" alt="" width="64" height="64" />
                        <span className="tile-title">MancioPIIRemover</span>
                        <span className="pc-ai-badge" aria-label={t.aiBadge}>
                            <span aria-hidden="true">✦</span> {t.aiBadge}
                        </span>
                    </div>
                    <p className="tile-blurb">{t.piiDesc}</p>
                    <div className="hero-actions">
                        <a className="btn btn-ghost" href="https://github.com/mancio/mancioPIIRemover" target="_blank" rel="noopener noreferrer">{t.piiGithub}</a>
                    </div>
                </div>
            </section>

            <section className="section" aria-labelledby="harmonopattume-title">
                <h2 id="harmonopattume-title" className="section-title">{t.androidApp}</h2>
                <div className="tile">
                    <div className="harmono-app-heading">
                        <img className="harmono-app-icon" src="https://raw.githubusercontent.com/mancio/harmonoPattume/b36ba507e522ac697c7facff7d463b8f193e20a0/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" alt="" width="56" height="56" />
                        <span className="tile-title">HarmonoPattume</span>
                    </div>
                    <span className="tile-blurb">{t.harmono}</span>
                    <div className="hero-actions">
                        <a className="btn btn-primary" href="https://github.com/mancio/harmonoPattume/releases/latest/download/harmonopattume.apk">{t.download}</a>
                        <a className="btn btn-ghost" href="https://github.com/mancio/harmonoPattume" target="_blank" rel="noopener noreferrer">{t.viewGitHub}</a>
                    </div>
                </div>
            </section>

            <section className="section">
                <h2 className="section-title">{t.toolsHeading}</h2>
                <TileGrid tiles={otherStuff} labels={t.tiles}/>
            </section>

            <section className="section home-services" aria-labelledby="home-services-title">
                <p className="home-services-eyebrow">{t.servicesEyebrow}</p>
                <h2 id="home-services-title">{t.servicesTitle}</h2>
                <p className="home-services-intro">{t.servicesIntro}</p>
                <div className="home-services-pillars">
                    <span>⌘ {t.servicesBuild}</span>
                    <span>✦ {t.servicesConsult}</span>
                    <span>📚 {t.servicesWiki}</span>
                </div>
                <button type="button" className="home-services-button" onClick={() => navigate(SERVICE_PATHS[language])}>{t.servicesButton} <span aria-hidden="true">↗</span></button>
            </section>
        </div>
    );
}

export default Menu;
