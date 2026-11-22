import {useNavigate} from "react-router-dom";
import TempBoard from "../components/TempBoard";
import {MENU} from "../logic/Names";
import "./Temperature.css";

function Temperature() {
    const navigate = useNavigate();
    return (
        <main className="temp-page">
            <div className="temp-shell">
                <header className="temp-hero">
                    <button className="temp-back" type="button" onClick={() => navigate(MENU)}>← Back to MancioTech</button>
                    <span className="temp-eyebrow">✦ LIVE FROM CASINA ✦</span>
                    <div className="temp-illustration" aria-hidden="true">🏡 🌡️ 🌿</div>
                    <h1>Temp<em>Casina.</em></h1>
                    <p>A small window into the weather at Casina, with readings from the outdoor sensor.</p>
                </header>
                <TempBoard/>
                <footer className="temp-footer">Measured in Casina, viewed from anywhere. ♡</footer>
            </div>
        </main>
    );
}

export default Temperature;
