import {DECREASE, INCREASE} from "../logic/Names";
import {useT} from "../i18n/useT";

interface IngredientMultiplierProps {
    multiplier: number;
    setMultiplier: (value: number) => void;
}

function IngredientMultiplier({ multiplier, setMultiplier }: IngredientMultiplierProps) {

    const tr=useT();
    const increment = 0.5;

    const buttonStyle = { background: "transparent",
        cursor: 'pointer', border: 'none' };

    function changeQuantity(type: string) {
        if (type === INCREASE) setMultiplier(multiplier + increment);
        if (type === DECREASE && multiplier > 1) setMultiplier(multiplier - increment);
    }

    return (
        <div>
            <h3>{tr("Multiplier")}:
                <button onClick={() => changeQuantity(DECREASE)} style={buttonStyle}>⬅️</button>
                X{multiplier}
                <button onClick={() => changeQuantity(INCREASE)} style={buttonStyle}>➡️</button>
            </h3>
        </div>
    )
}

export default IngredientMultiplier;