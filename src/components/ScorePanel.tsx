import '../App.css';
import React, {useEffect, useState} from "react";
import {PLAYER_NAMES, PLAYERS_SCORE, STEP1, STEP2, STEP3} from "../logic/Names";
import {
    getSharedObject,
    removeSharedObject,
    setSharedObject
} from "../logic/Functions";

function ScorePanel(){

    const [step, setStep] = useState(STEP1);
    const [playerNumber, setPlayerNumber] = useState(0);
    const [playerNames, setPlayerNames] = useState<string[]>([]);
    const [scores, setScores] = useState<number[]>([]);

    useEffect(() => {
        const storedScores = getSharedObject<number[]>(PLAYERS_SCORE);
        const storedNames = getSharedObject<string[]>(PLAYER_NAMES);

        if (storedScores && storedNames) {
            setScores(storedScores);
            setPlayerNames(storedNames);
            setStep(STEP3);
        }
    }, []); // Empty dependency array means this runs once after the component mounts

    useEffect(() => {
        if (scores.length > 0) {
            setSharedObject(PLAYERS_SCORE, scores);
        }
    }, [scores]); // This useEffect runs every time 'scores' changes

    function updateScore(index: number, newValue: number) {
        // Create a new array with the updated value
        const updatedScores = scores.map((score, i) => {
            if (i === index) {
                return newValue; // Update the specific score
            }
            return score; // Keep all other scores the same
        });

        setScores(updatedScores); // Set the new array as the state
    }

    function areAllNamesFilled() {
        // Returns true if there's at least one empty name
        const isAnyNameEmpty = playerNames.some(name => name.trim() === '');
        return !isAnyNameEmpty; // Invert the result because we want false if any name is empty
    }

    function reducePlayers(){
        if (playerNumber !== 0) setPlayerNumber(playerNumber-1);
    }

    function increasePlayers(){
        setPlayerNumber(playerNumber+1);
    }

    function reduceScore(index: number){
        if (scores[index] !== 0) {
            updateScore(index, scores[index]-1);
        }
    }

    function increaseScore(index: number){
        updateScore(index, scores[index]+1);
    }

    function resetScore(){
        removeSharedObject(PLAYER_NAMES);
        removeSharedObject(PLAYERS_SCORE);
        setStep(STEP1);
    }

    function changePanel(moveTo: string){
        if (moveTo === STEP2){
            if (playerNumber === 0) alert("at least one player");
            else {
                setPlayerNames(Array(playerNumber).fill(''));
                setScores(Array(playerNumber).fill(0));
                setStep(STEP2);
            }
        }
        if (moveTo === STEP3){
            if (!areAllNamesFilled()) alert("please write all the players names");
            else {
                setSharedObject(PLAYER_NAMES, playerNames);
                setStep(STEP3);
            }
        }
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newPlayerNames = [...playerNames];
        newPlayerNames[index] = event.target.value;
        setPlayerNames(newPlayerNames);
    };


    return (
        <div className="player-score-panel">
            {step === STEP1 && (
                <div className="player-setup">
                    <label className="player-field-label">Number of players</label>
                    <div className="player-count-controls">
                        <button type="button" className="player-stepper" aria-label="Remove player" disabled={playerNumber === 0} onClick={reducePlayers}>−</button>
                        <output className="player-count" aria-live="polite">{playerNumber}</output>
                        <button type="button" className="player-stepper" aria-label="Add player" onClick={increasePlayers}>+</button>
                    </div>
                    <button type="button" className="player-primary" onClick={() => changePanel(STEP2)}>Set player number</button>
                </div>
            )}

            {step === STEP2 && (
                <div className="player-names-form">
                    {Array.from({length: playerNumber}, (_, index) => (
                        <label className="player-name-field" key={index}>
                            <span>Player {index + 1} name</span>
                            <input
                                type="text"
                                value={playerNames[index] || ''}
                                placeholder="Enter player name"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e, index)}
                            />
                        </label>
                    ))}
                    <button type="button" className="player-primary" onClick={() => changePanel(STEP3)}>Set names</button>
                </div>
            )}

            {step === STEP3 && (
                <div className="player-scores">
                    <h3>Players score</h3>
                    <div className="player-score-list">
                        {playerNames.map((name, index) => (
                            <div className="player-score-row" key={index}>
                                <span className="player-score-name" title={name}>{name}</span>
                                <div className="player-score-controls">
                                    <button type="button" className="player-stepper" aria-label={'Decrease score for ' + name} disabled={scores[index] === 0} onClick={() => reduceScore(index)}>−</button>
                                    <output className="player-score-value" aria-live="polite">{scores[index]}</output>
                                    <button type="button" className="player-stepper" aria-label={'Increase score for ' + name} onClick={() => increaseScore(index)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <button type="button" className="player-reset" onClick={resetScore}>Reset player scoreboard</button>
        </div>
    );
}

export default ScorePanel;
