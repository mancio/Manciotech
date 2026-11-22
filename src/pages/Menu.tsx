import '../App.css';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {KITCHEN_TOOLS, RECIPES, SCORE_COUNTER, STOCKS, TEMP, LANGUAGE_RECIPE_KEY} from "../logic/Names";
import {GITHUB_URL} from "../data/games";

type SiteLanguage = 'IT' | 'EN' | 'PL';
type TileKey = 'score' | 'recipes' | 'kitchen' | 'temp' | 'stocks' | 'lessons';
interface Tile {
    key: TileKey;
    emoji: string;
    go: () => void;
}

const LANGUAGE_KEY = 'manciotechSiteLanguage';
const LANGUAGES: {code: SiteLanguage; flag: string; name: string}[] = [
    {code: 'IT', flag: '🇮🇹', name: 'Italiano'},
    {code: 'EN', flag: '🇬🇧', name: 'English'},
    {code: 'PL', flag: '🇵🇱', name: 'Polski'},
];

const translations = {
    EN: {
        tagline: 'AI solutions and software ideas',
        androidApp: 'Android app',
        download: '⬇ Download APK (Android)',
        viewGitHub: 'View on GitHub',
        harmono: 'Never miss bin day in Wieliczka: check your waste collection schedule, get reminders, and add pickup dates to your calendar.',
        toolsHeading: 'Try my tools',
        tiles: {
            score: ['Score Counter', 'Briscola and Scopa, no cheating.'],
            recipes: ['Recipes', 'Tested on real Italians.'],
            kitchen: ['Kitchen Tools', 'Dough hydration and friends.'],
            temp: ['TempCasina', 'Live temperature from the casina.'],
            stocks: ['Stocks', 'Numbers going up (hopefully).'],
            lessons: ['Karpathy Lessons', 'My notes on building neural nets.'],
        },
    },
    IT: {
        tagline: 'Soluzioni di intelligenza artificiale e idee software',
        androidApp: 'App Android',
        download: '⬇ Scarica APK (Android)',
        viewGitHub: 'Vedi su GitHub',
        harmono: 'Non dimenticare mai la raccolta dei rifiuti a Wieliczka: consulta il calendario, ricevi promemoria e aggiungi le date al tuo calendario.',
        toolsHeading: 'Prova i miei strumenti',
        tiles: {
            score: ['Segnapunti', 'Briscola e Scopa, senza barare.'],
            recipes: ['Ricette', 'Testate da veri italiani.'],
            kitchen: ['Strumenti da cucina', 'Idratazione dell’impasto e altro.'],
            temp: ['TempCasina', 'Temperatura in tempo reale dalla casina.'],
            stocks: ['Azioni', 'Numeri che salgono (si spera).'],
            lessons: ['Lezioni di Karpathy', 'I miei appunti sulle reti neurali.'],
        },
    },
    PL: {
        tagline: 'Rozwiązania AI i pomysły na oprogramowanie',
        androidApp: 'Aplikacja na Androida',
        download: '⬇ Pobierz APK (Android)',
        viewGitHub: 'Zobacz na GitHubie',
        harmono: 'Nie przegap odbioru odpadów w Wieliczce: sprawdzaj harmonogram, otrzymuj przypomnienia i dodawaj terminy do kalendarza.',
        toolsHeading: 'Wypróbuj moje narzędzia',
        tiles: {
            score: ['Licznik punktów', 'Briscola i Scopa, bez oszukiwania.'],
            recipes: ['Przepisy', 'Sprawdzone przez prawdziwych Włochów.'],
            kitchen: ['Narzędzia kuchenne', 'Hydratacja ciasta i nie tylko.'],
            temp: ['TempCasina', 'Temperatura na żywo z casiny.'],
            stocks: ['Akcje', 'Liczby idą w górę (oby!).'],
            lessons: ['Lekcje Karpathy’ego', 'Moje notatki o sieciach neuronowych.'],
        },
    },
} as const;

const languageFromStorage = (): SiteLanguage => {
    try {
        const saved = window.localStorage.getItem(LANGUAGE_KEY);
        return saved === 'IT' || saved === 'EN' || saved === 'PL' ? saved : 'EN';
    } catch {
        return 'EN';
    }
};

function TileGrid({tiles, labels}: {tiles: Tile[]; labels: typeof translations[SiteLanguage]['tiles']}) {
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
    const [language, setLanguage] = useState<SiteLanguage>(languageFromStorage);
    const t = translations[language];

    function chooseLanguage(next: SiteLanguage) {
        setLanguage(next);
        try {
            window.localStorage.setItem(LANGUAGE_KEY, next);
            // Keep the recipe page's existing language selector in sync.
            window.localStorage.setItem(LANGUAGE_RECIPE_KEY, next);
        } catch {
            // Language selection remains usable when localStorage is unavailable.
        }
    }

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
            <nav className="home-language-switcher" aria-label="Website language">
                {LANGUAGES.map(item => (
                    <button
                        key={item.code}
                        type="button"
                        className={'home-language-button' + (language === item.code ? ' is-active' : '')}
                        onClick={() => chooseLanguage(item.code)}
                        aria-label={item.name}
                        aria-pressed={language === item.code}
                        title={item.name}
                    >
                        <span aria-hidden="true">{item.flag}</span>
                    </button>
                ))}
            </nav>
            <header className="hero">
                <h1 className="hero-logo">Manciotech</h1>
                <p className="hero-tagline">{t.tagline}</p>
                <div className="hero-actions">
                    <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
            </header>

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
        </div>
    );
}

export default Menu;
