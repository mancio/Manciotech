import BetterButton from "../components/BetterButton";
import {useNavigate} from "react-router-dom";
import {MENU} from "../logic/Names";
import {useState} from "react";
import {calculateAge} from "../logic/Functions";
import {useT} from "../i18n/useT";

function HowOld(){

    const navigate = useNavigate();
    const tr=useT();

    const [days, setDays] = useState(12);
    const [months, setMonths] = useState(8);
    const [years, setYears] = useState(1986);

    return(
        <div>
            <div className="title">
                <p>{tr("How Old am I")}</p>
            </div>
            <div className='dashboard'>
                <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    placeholder={tr("Enter day")}
                    className="age-field"
                />
                /
                <input
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    placeholder={tr("Enter month")}
                    className="age-field"
                />
                /
                <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    placeholder={tr("Enter years")}
                    className="age-field"
                />

                <h1>{tr("Today you are")} {calculateAge(days,months, years)} {tr("years old")}</h1>
            </div>
            <BetterButton text={tr("Back")} click={() => navigate(MENU)}/>
        </div>)
}

export default HowOld;