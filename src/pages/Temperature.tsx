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
                    <button className="temp-back" type="button" onClick={() => navigate(MENU)}>← {tr("Back to MancioTech")}</button>
                    <h1>{tr("Smart temperature monitor")}</h1>
                    <a className="temp-project" href="https://github.com/mancio/CasinaWifiTemp">{tr("View the project on GitHub")} <span aria-hidden="true">↗</span></a>
                </header>
                <TempBoard/>
            </div>
        </main>
    );
}

export default Temperature;
