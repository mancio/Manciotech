import {BRISCOLA, MENU, SCOPA} from "../logic/Names";
import {useState} from "react";
import '../App.css';
import './ScoreCounter.css';

import Asso from '../pictures/cards/asso_di_coppe.svg';
import Tre from '../pictures/cards/tre_spade.svg';
import Re from '../pictures/cards/re_denari.jpg';
import Cavallo from '../pictures/cards/cavallo_denari.png';
import Fante from '../pictures/cards/fante_bastoni.jpg';
import Sette from '../pictures/cards/sette_denari.svg';
import Sei from '../pictures/cards/sei_coppe.jpg';
import Cinque from '../pictures/cards/cinque_bastoni.jpg';
import Quattro from '../pictures/cards/quattro_bastoni.jpg';
import Due from '../pictures/cards/due_denari.jpg';
import {useNavigate} from "react-router-dom";
import ScorePanel from "../components/ScorePanel";
import {useRefreshOnDisplayChange} from "../logic/Functions";

type ScoreType = 'briscola' | 'scopa';

interface Card {
    card: string;
    name: string;
    briscola: number;
    scopa: number;
}

function ScoreCounter(){

    useRefreshOnDisplayChange();


    const navigate = useNavigate();

    const [game, setGame] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [selCards, setSelCards] = useState<string[]>([]);


    const cardList: Card[] = [
        {
            card: Asso,
            name: 'Asso',
            briscola: 11,
            scopa: 16
        },
        {
            card: Tre,
            name: 'Tre',
            briscola: 10,
            scopa: 13
        },
        {
            card: Re,
            name: 'Re',
            briscola: 4,
            scopa: 10
        },
        {
            card: Cavallo,
            name: 'Cavallo',
            briscola: 3,
            scopa: 10
        },
        {
            card: Fante,
            name: 'Fante',
            briscola: 2,
            scopa: 10
        },
        {
            card: Sette,
            name: 'Sette',
            briscola: 0,
            scopa: 21
        },
        {
            card: Sei,
            name: 'Sei',
            briscola: 0,
            scopa: 18
        },
        {
            card: Cinque,
            name: 'Cinque',
            briscola: 0,
            scopa: 15
        },
        {
            card: Quattro,
            name: 'Quattro',
            briscola: 0,
            scopa: 14
        },
        {
            card: Due,
            name: 'Due',
            briscola: 0,
            scopa: 12
        }
    ]

    function reset(){
        setSelCards([]);
        setScore(0);
    }

    function selectGame(nextGame: string){
        reset();
        setGame(nextGame);
    }

    function addPoint(card: Card, type: ScoreType) {
        setSelCards(previous => [...previous, card.name]);
        setScore(previous => previous + card[type]);
    }

    function undoLast(type: ScoreType) {
        const name = selCards[selCards.length - 1];
        if (!name) return;
        const card = cardList.find(item => item.name === name);
        if (!card) return;
        setSelCards(previous => previous.slice(0, -1));
        setScore(previous => previous - card[type]);
    }

    const scoreType: ScoreType | null = game === BRISCOLA ? 'briscola' : game === SCOPA ? 'scopa' : null;
    const availableCards = scoreType ? cardList.filter(card => card[scoreType] > 0) : [];
    const result = game === BRISCOLA && selCards.length > 0
        ? score === 60 ? 'Draw! ⚖️' : score < 60 ? 'You lose! 👎' : 'You win! 🏆'
        : null;

    return (
        <main className="score-page">
            <div className="score-page-heading">
                <button className="score-back" type="button" onClick={() => navigate(MENU)}>← Back to home</button>
                <span className="score-eyebrow">♠ ♥ ♦ ♣ &nbsp; THE CARD TABLE</span>
                <h1>Card Score Counter</h1>
                <p>Pick a game, tap the cards you collected, and keep your score.</p>
            </div>

            <section className="score-board" aria-label="Card point calculator">
                <div className="score-board-top">
                    <div>
                        <span className="score-label">CHOOSE YOUR GAME</span>
                        <div className="score-game-switch" role="group" aria-label="Game">
                            <button type="button" className={game === BRISCOLA ? 'active' : ''} aria-pressed={game === BRISCOLA} onClick={() => selectGame(BRISCOLA)}>♠ Briscola</button>
                            <button type="button" className={game === SCOPA ? 'active' : ''} aria-pressed={game === SCOPA} onClick={() => selectGame(SCOPA)}>♦ Scopa · Primiera</button>
                        </div>
                    </div>
                    <div className="score-total" aria-live="polite">
                        <span>TOTAL POINTS</span>
                        <strong>{score}</strong>
                        <small>{selCards.length} card{selCards.length === 1 ? '' : 's'} counted</small>
                    </div>
                </div>

                {scoreType ? (
                    <>
                        <div className="score-card-heading">
                            <div>
                                <h2>Choose your cards</h2>
                                <p>Tap a card to add its value. You can tap the same rank more than once.</p>
                            </div>
                            <span className="score-suit-decor" aria-hidden="true">♣ ♦ ♥ ♠</span>
                        </div>
                        <div className="score-playing-cards">
                            {availableCards.map(card => (
                                <button className="score-playing-card" type="button" key={card.name}
                                    onClick={() => addPoint(card, scoreType)}
                                    aria-label={`Add ${card.name}, ${card[scoreType]} points`}>
                                    <img src={card.card} alt={card.name} />
                                    <span className="score-card-info"><b>{card.name}</b><small>+{card[scoreType]} pts</small></span>
                                </button>
                            ))}
                        </div>
                        <div className="score-summary">
                            <div className="score-history">
                                <span className="score-label">SELECTED CARDS</span>
                                <p>{selCards.length ? selCards.join(' · ') : 'Your cards will appear here.'}</p>
                                {result && <span className="score-result">{result}</span>}
                            </div>
                            <div className="score-actions">
                                <button type="button" className="score-action-secondary" onClick={() => undoLast(scoreType)} disabled={!selCards.length}>↶ Undo</button>
                                <button type="button" className="score-action-primary" onClick={reset} disabled={!selCards.length}>Reset cards</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="score-empty">
                        <span aria-hidden="true">🂡</span>
                        <h2>Ready to play?</h2>
                        <p>Choose Briscola or Scopa Primiera above to reveal the cards.</p>
                    </div>
                )}
            </section>

            <section className="score-players" aria-label="Player scoreboard">
                <div className="score-players-header">
                    <span className="score-eyebrow">KEEP TRACK OF THE MATCH</span>
                    <h2>Player scoreboard</h2>
                    <p>Add your players and track the score across rounds.</p>
                </div>
                <ScorePanel/>
            </section>
        </main>
    );
}

export default ScoreCounter;