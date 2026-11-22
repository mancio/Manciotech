import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {getFlour, getHydration, getWater} from "../logic/Functions";
import {MENU} from "../logic/Names";
import "./KitchenTools.css";
import {useT} from "../i18n/useT";

function KitchenTools() {
    const navigate = useNavigate();
    const tr=useT();
    const [hydration, setHydration] = useState(65);
    const [flour, setFlour] = useState(600);
    const [water, setWater] = useState(390);

    const valid = (value: number) => Number.isFinite(value) && value > 0;
    const actualHydration = valid(flour) && valid(water) ? getHydration(water, flour) : null;
    const format = (value: number) => Number.isFinite(value) ? value.toLocaleString("en-US") : "—";

    return (
        <main className="tools-page">
            <div className="tools-shell">
                <header className="tools-hero">
                    <button className="tools-back" type="button" onClick={() => navigate(MENU)}>← Back to MancioTech</button>
                    <div className="tools-eyebrow">✦ THE LITTLE KITCHEN LAB ✦</div>
                    <div className="tools-illustration" aria-hidden="true">🥖 <span>⚖️</span> 🌾</div>
                    <h1>Kitchen <em>{tr("Tools.")}</em></h1>
                    <p>{tr("Simple measurements for better baking. Start with your flour and water, and let the numbers do the rest.")}</p>
                </header>

                <section className="tools-card" aria-labelledby="hydration-title">
                    <div className="tools-card-header">
                        <div>
                            <div className="tools-section-label">DOUGH CALCULATOR · 01</div>
                            <h2 id="hydration-title">{tr("Find your perfect dough")}</h2>
                            <p>{tr("Change any value, then use")} <strong>{tr("Calculate")}</strong> {tr("to work out the missing measurement from the other two.")}</p>
                        </div>
                        <span className="tools-card-illustration" aria-hidden="true">🍞</span>
                    </div>

                    <div className="tools-fields">
                        <div className="tools-field">
                            <label htmlFor="dough-hydration">{tr("Hydration")}</label>
                            <div className="tools-input-wrap"><input id="dough-hydration" type="number" min="1" max="1000" step="1" value={hydration} onChange={e => setHydration(Number(e.target.value))}/><span>%</span></div>
                            <button type="button" disabled={!valid(flour) || !valid(water)} onClick={() => setHydration(getHydration(water, flour))}>{tr("Calculate hydration")} ↗</button>
                        </div>
                        <div className="tools-field">
                            <label htmlFor="dough-flour">{tr("Flour")}</label>
                            <div className="tools-input-wrap"><input id="dough-flour" type="number" min="1" step="1" value={flour} onChange={e => setFlour(Number(e.target.value))}/><span>g</span></div>
                            <button type="button" disabled={!valid(hydration) || !valid(water)} onClick={() => setFlour(getFlour(hydration, water))}>{tr("Calculate flour")} ↗</button>
                        </div>
                        <div className="tools-field">
                            <label htmlFor="dough-water">{tr("Water")}</label>
                            <div className="tools-input-wrap"><input id="dough-water" type="number" min="1" step="1" value={water} onChange={e => setWater(Number(e.target.value))}/><span>g / ml</span></div>
                            <button type="button" disabled={!valid(hydration) || !valid(flour)} onClick={() => setWater(getWater(hydration, flour))}>{tr("Calculate water")} ↗</button>
                        </div>
                    </div>

                    <div className="tools-summary" aria-live="polite">
                        <div><span>{tr("ACTUAL HYDRATION")}</span><strong>{actualHydration === null ? "—" : actualHydration + "%"}</strong></div>
                        <div><span>{tr("TOTAL DOUGH WEIGHT")}</span><strong>{valid(flour) && valid(water) ? format(flour + water) + " g" : "—"}</strong></div>
                        <p>{tr("Hydration = water ÷ flour × 100. A higher percentage usually means a softer, stickier dough.")}</p>
                    </div>
                    <button type="button" className="tools-reset" onClick={() => {setHydration(65);setFlour(600);setWater(390);}}>↺ {tr("Reset to example")}</button>
                </section>
                <footer className="tools-footer">{tr("Good bread starts with a little curiosity.")} ♡</footer>
            </div>
        </main>
    );
}

export default KitchenTools;
