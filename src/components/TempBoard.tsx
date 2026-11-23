import {useT} from "../i18n/useT";
import {useEffect, useState} from "react";
import Camel from "../pictures/icons/camel.svg";
import Temperato from "../pictures/icons/temperato.svg";
import SantaCold from "../pictures/icons/santa-cold.svg";
import {
    batteryPercentage, getFirebaseSetUp, getTimeDifference, getUnixTime,
    isDbSet, readDb, roundStringToTwoDecimals, unixToPolishTime
} from "../logic/Functions";
import {DB_TEMP_PATH, DB_TIME_PATH, DB_VOLTAGE_PATH} from "../logic/Names";

const DEMO_READING = {temperature: 21.5, voltage: 5.1};
const READ_TIMEOUT_MS = 5000;

function asNumber(value: unknown): number | null {
    if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function TempBoard() {
    const tr = useT();
    const [datetime, setDatetime] = useState<number | null>(null);
    const [temperature, setTemperature] = useState<number | null>();
    const [voltage, setVoltage] = useState<number | null>(null);

    useEffect(() => {
        const unsubscribe: Array<() => void> = [];
        const timer = window.setTimeout(() => setTemperature(null), READ_TIMEOUT_MS);
        const receiveTemperature = (value: unknown) => {
            window.clearTimeout(timer);
            setTemperature(asNumber(value));
        };

        try {
            if (!isDbSet()) getFirebaseSetUp();
            unsubscribe.push(readDb(DB_TEMP_PATH, receiveTemperature, () => receiveTemperature(null)));
            unsubscribe.push(readDb(DB_TIME_PATH, value => setDatetime(asNumber(value))));
            unsubscribe.push(readDb(DB_VOLTAGE_PATH, value => setVoltage(asNumber(value))));
        } catch {
            receiveTemperature(null);
        }

        return () => {
            window.clearTimeout(timer);
            unsubscribe.forEach(stop => stop());
        };
    }, []);

    const demo = temperature === null;
    const volts = demo ? DEMO_READING.voltage : voltage;
    const timestamp = datetime !== null && datetime > 0 ? datetime : null;
    const lastUpdate = timestamp === null ? null : unixToPolishTime(timestamp);
    const now = getUnixTime();
    const age = timestamp !== null && timestamp <= now ? getTimeDifference(timestamp, now) : null;

    return (
        <section className="temp-reading" aria-label={tr("Temperature readings")}>
            {temperature === undefined ? (
                <p className="temp-loading" role="status">{tr("Waiting for a reading…")}</p>
            ) : (
                <>
                    {demo && <p className="temp-demo" role="status">{tr("Demo — live data unavailable. The figures below are simulated.")}</p>}
                    <div className="temp-reading-grid">
                        <div className="temp-primary">
                            <span className="temp-label">{tr(demo ? "SAMPLE TEMPERATURE" : "CURRENT TEMPERATURE")}</span>
                            <strong>{roundStringToTwoDecimals(String(temperature ?? DEMO_READING.temperature))} °C</strong>
                            <img src={temperatureIcon(temperature ?? DEMO_READING.temperature)} alt=""/>
                        </div>
                        <div className="temp-secondary">
                            {!demo && <div>
                                <span className="temp-label">{tr("LAST SENSOR UPDATE")}</span>
                                <strong>{lastUpdate ?? tr("Not available")}</strong>
                                {age && <small>{age} {tr("ago")}</small>}
                            </div>}
                            <div>
                                <span className="temp-label">{tr(demo ? "SAMPLE BATTERY" : "BATTERY")}</span>
                                <strong>{volts === null ? "—" : batteryPercentage(String(volts))}</strong>
                                <small>{volts === null ? tr("No voltage reading") : roundStringToTwoDecimals(String(volts)) + " V"}</small>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

function temperatureIcon(temperature: number) {
    if (temperature > 29) return Camel;
    return temperature >= 13 ? Temperato : SantaCold;
}

export default TempBoard;
