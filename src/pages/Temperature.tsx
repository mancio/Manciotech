import {useNavigate} from "react-router-dom";
import TempBoard from "../components/TempBoard";
import {MENU} from "../logic/Names";
import "./Temperature.css";
import {useT} from "../i18n/useT";

function Temperature() {
    const navigate = useNavigate();
    const tr=useT();
    return (
        <main className="temp-page">
            <div className="temp-shell">
                <header className="temp-hero">
                    <button className="temp-back" type="button" onClick={() => navigate(MENU)}>← Back to MancioTech</button>
                    <span className="temp-eyebrow">✦ LIVE FROM CASINA ✦</span>
                    <div className="temp-illustration" aria-hidden="true">🏡 🌡️ 🌿</div>
                    <h1>Temp<em>Casina.</em></h1>
                    <p>{tr("A small window into the weather at Casina, with readings from the outdoor sensor.")}</p>
                </header>
                <TempBoard/>
                <footer className="temp-footer">{tr("Measured in Casina, viewed from anywhere.")} ♡</footer>
            </div>
        </main>
    );
}

export default Temperature;
