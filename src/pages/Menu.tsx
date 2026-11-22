import '../App.css';
import {useNavigate} from 'react-router-dom';
import {KITCHEN_TOOLS, RECIPES, SCORE_COUNTER, STOCKS, TEMP, SERVICES} from "../logic/Names";
import {useSiteLanguage} from "../i18n/SiteLanguage";
import {homeTranslations} from "../i18n/homeTranslations";

type TileKey = 'score' | 'recipes' | 'kitchen' | 'temp' | 'stocks' | 'lessons';
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
        {key: 'stocks', emoji: '📈', go: () => window.location.assign(STOCKS)},
        {key: 'lessons', emoji: '🧠', go: () => openExternal('https://karpathy-by-mancio-586e3f.gitlab.io')},
    ];

    return (
        <div className="home" lang={language.toLowerCase()}>
            <header className="hero">
                <h1 className="hero-logo">Manciotech</h1>
                <p className="hero-tagline">{t.tagline}</p>
            </header>

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
                <button type="button" className="home-services-button" onClick={() => navigate(SERVICES)}>{t.servicesButton} <span aria-hidden="true">↗</span></button>
            </section>
        </div>
    );
}

export default Menu;
