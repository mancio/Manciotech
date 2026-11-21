import '../App.css';
import { useNavigate } from 'react-router-dom';
import {KITCHEN_TOOLS, RECIPES, SCORE_COUNTER, STOCKS, TEMP} from "../logic/Names";
import {GITHUB_URL} from "../data/games";

interface Tile {
    emoji: string;
    title: string;
    blurb: string;
    go: () => void;
}

function TileGrid({tiles}: {tiles: Tile[]}){
    return (
        <div className="tile-grid">
            {tiles.map(tile => (
                <button key={tile.title} className="tile" onClick={tile.go}>
                    <span className="tile-emoji" aria-hidden="true">{tile.emoji}</span>
                    <span className="tile-title">{tile.title}</span>
                    <span className="tile-blurb">{tile.blurb}</span>
                </button>
            ))}
        </div>
    );
}

function openExternal(url: string){
    window.open(url, '_blank', 'noopener,noreferrer');
}

function Menu(){

    const navigate = useNavigate();

    const otherStuff: Tile[] = [
        {emoji: '🃏', title: 'Score Counter', blurb: 'Briscola and Scopa, no cheating.', go: () => navigate(SCORE_COUNTER)},
        {emoji: '🍝', title: 'Recipes', blurb: 'Tested on real Italians.', go: () => navigate(RECIPES)},
        {emoji: '🥖', title: 'Kitchen Tools', blurb: 'Dough hydration and friends.', go: () => navigate(KITCHEN_TOOLS)},
        {emoji: '🌡️', title: 'TempCasina', blurb: 'Live temperature from the casina.', go: () => navigate(TEMP)},
        {emoji: '📈', title: 'Stocks', blurb: 'Numbers going up (hopefully).', go: () => window.location.assign(STOCKS)},
        {emoji: '🧠', title: 'Karpathy Lessons', blurb: 'My notes on building neural nets.', go: () => openExternal('https://karpathy-by-mancio-586e3f.gitlab.io')},
    ];

    return(
        <div className="home">
            <header className="hero">
                <h1 className="hero-logo">Manciotech</h1>
                <p className="hero-tagline">AI solutions and software ideas</p>
                <div className="hero-actions">
                    <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
            </header>

            <section className="section" aria-labelledby="harmonopattume-title">
                <h2 id="harmonopattume-title" className="section-title">Android app · HarmonoPattume</h2>
                <div className="tile">
                    <span className="tile-emoji" aria-hidden="true">🎵</span>
                    <span className="tile-title">HarmonoPattume</span>
                    <span className="tile-blurb">Never miss bin day in Wieliczka: check your waste collection schedule, get reminders, and add pickup dates to your calendar.</span>
                    <div className="hero-actions">
                        <a className="btn btn-primary" href="https://github.com/mancio/harmonoPattume/releases/latest/download/harmonopattume.apk">⬇ Download APK (Android)</a>
                        <a className="btn btn-ghost" href="https://github.com/mancio/harmonoPattume" target="_blank" rel="noopener noreferrer">View on GitHub</a>
                    </div>
                </div>
            </section>

            <section className="section">
                <h2 className="section-title">Kitchen &amp; other stuff</h2>
                <TileGrid tiles={otherStuff}/>
            </section>
        </div>
    );
}

export default Menu;
