import {useEffect, useState} from "react";
import Camel from "../pictures/icons/camel.svg";
import Temperato from "../pictures/icons/temperato.svg";
import SantaCold from "../pictures/icons/santa-cold.svg";
import {
    batteryPercentage, getFirebaseSetUp, getTimeDifference, getUnixTime,
    isDbSet, readDb, roundStringToTwoDecimals, unixToPolishTime
} from "../logic/Functions";
import {DB_TEMP_PATH, DB_TIME_PATH, DB_VOLTAGE_PATH} from "../logic/Names";

type Reading = string | number | null;
const asNumber = (value: Reading): number | null => {
    if (value === null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

function TempBoard() {
    const [datetime, setDatetime] = useState<Reading>(null);
    const [temperature, setTemperature] = useState<Reading>(null);
    const [voltage, setVoltage] = useState<Reading>(null);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let active = true;
        const unsubscribe: Array<() => void> = [];
        const fail = (err: Error) => {
            if (active) setError(err.message || "Unable to connect to the temperature sensor.");
        };
        try {
            if (!isDbSet()) getFirebaseSetUp();
            unsubscribe.push(readDb<Reading>(DB_TIME_PATH, value => {if(active) {setDatetime(value);setConnected(true);}}, fail));
            unsubscribe.push(readDb<Reading>(DB_TEMP_PATH, value => {if(active) {setTemperature(value);setConnected(true);}}, fail));
            unsubscribe.push(readDb<Reading>(DB_VOLTAGE_PATH, value => {if(active) {setVoltage(value);setConnected(true);}}, fail));
        } catch (err) {
            fail(err instanceof Error ? err : new Error("Unable to initialize the temperature service."));
        }
        return () => { active = false; unsubscribe.forEach(stop => stop()); };
    }, []);

    const temp = asNumber(temperature);
    const volts = asNumber(voltage);
    const timestamp = asNumber(datetime);
    const icon = temp === null ? null : temp > 29 ? Camel : temp >= 13 ? Temperato : SantaCold;
    const lastUpdate = timestamp !== null && timestamp > 0 ? unixToPolishTime(timestamp) : null;
    const age = timestamp !== null && timestamp > 0 ? getTimeDifference(timestamp, getUnixTime()) : null;

    return (
        <section className="temp-reading" aria-label="Casina sensor readings">
            {error && <div className="temp-error" role="alert"><strong>Sensor data unavailable</strong><p>{error}</p><p>The page is working, but live readings cannot be loaded. Check the Firebase build configuration and database permissions.</p></div>}
            {!error && !connected && <p className="temp-loading" role="status">Connecting to the sensor…</p>}
            <div className="temp-reading-grid">
                <div className="temp-primary">
                    <span className="temp-label">CURRENT TEMPERATURE</span>
                    <strong>{temp === null ? "—" : roundStringToTwoDecimals(String(temp)) + " °C"}</strong>
                    {icon && <img src={icon} alt="" aria-hidden="true"/>}
                    <p>{temp === null ? "No temperature reading available" : temp > 29 ? "It's hot outside!" : temp >= 13 ? "A mild day in Casina" : "It's chilly outside!"}</p>
                </div>
                <div className="temp-secondary">
                    <div><span className="temp-label">LAST SENSOR UPDATE</span><strong>{lastUpdate ?? "Not available"}</strong><small>{age ? age + " ago · Polish time" : "Polish time"}</small></div>
                    <div><span className="temp-label">BATTERY</span><strong>{volts === null ? "—" : batteryPercentage(String(volts))}</strong><small>{volts === null ? "No voltage reading" : roundStringToTwoDecimals(String(volts)) + " V"}</small></div>
                </div>
            </div>
        </section>
    );
}

export default TempBoard;
