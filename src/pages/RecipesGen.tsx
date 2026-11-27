import { useNavigate, useParams } from "react-router-dom";
import {useEffect, useState} from "react";
import {
    changeIngredientQuantity,
    findPictureUrl,
    findRecipeByUrl,
    getPictures,
    getRecipeURLByIdAndLanguage,
    numberToEmoji,
} from "../logic/Functions";
import type {Language} from "../data/recipes/types";
import { useWakeLock } from "react-screen-wake-lock";
import {ENGLISH, ITALIAN, MAGIC_SEPARATOR, POLISH, RECIPES} from "../logic/Names";
import IngredientMultiplier from "../components/IngredientMultiplier";
import YouTubeLogo from "../pictures/icons/YouTube.svg";
import BetterButton from "../components/BetterButton";
import "./Recipes.css";
import {useSiteLanguage} from "../i18n/SiteLanguage";
import {useT} from "../i18n/useT";

const CHECKED_INGREDIENTS_KEY = "checkedIngredients";

function RecipesGen() {

    const { isSupported, request, release } = useWakeLock({
        onRequest: () => console.log("Screen Wake Lock: requested!"),
        onError: () => console.error("An error occurred"),
        onRelease: () => console.log("Screen Wake Lock: released!"),
        reacquireOnPageVisible: true,
    });

    useEffect(() => {
        if (isSupported) {
            request(); // Automatically request the wake lock when the component mounts
        }

        return () => {
            release(); // Automatically release the wake lock when the component unmounts
        };
        // eslint-disable-next-line
    }, [isSupported]);

    const navigate = useNavigate();
    const {setLanguage}=useSiteLanguage();
    const tr=useT();
    const { recipeName: recipeURLName } = useParams();

    const languageList: Language[] = [ITALIAN, ENGLISH, POLISH];

    const match = findRecipeByUrl(recipeURLName ?? '');
    const ingredientCount = match?.translation.ingredients.length ?? 0;

    const [multiplier, setMultiplier] = useState(1);

    const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>(() => {
        const savedState = localStorage.getItem(CHECKED_INGREDIENTS_KEY);
        const parsedState: boolean[] = savedState ? JSON.parse(savedState) : [];
        // Ensure the array length matches the number of ingredients
        return parsedState.length === ingredientCount
            ? parsedState
            : new Array(ingredientCount).fill(false);
    });

    useEffect(() => {
        // Update localStorage whenever checkedIngredients changes
        localStorage.setItem(CHECKED_INGREDIENTS_KEY, JSON.stringify(checkedIngredients));
    }, [checkedIngredients]);

    if (!match) {
        return (
            <div className='recipe-box kitchen-recipe'>
                <div className='title2'>
                    <h3>{tr("Recipe not found")}</h3>
                </div>
                <BetterButton text={tr("Back")} click={() => navigate(RECIPES)} />
            </div>
        );
    }

    const {recipe, language, translation} = match;

    const handleCheckboxChange = (index: number) => {
        const updatedCheckedIngredients = [...checkedIngredients];
        updatedCheckedIngredients[index] = !updatedCheckedIngredients[index];
        setCheckedIngredients(updatedCheckedIngredients);
        localStorage.setItem(CHECKED_INGREDIENTS_KEY, JSON.stringify(updatedCheckedIngredients));
    };

    function goToRecipe(ln: Language) {
        setLanguage(ln);
        navigate(getRecipeURLByIdAndLanguage(recipe.id, ln));
    }

    const heroPhoto = getPictures(recipe, language).find(picture => picture.index === 0);
    const photoLabels = {
        IT: {credit: 'Foto', illustrative: 'Foto illustrativa'},
        EN: {credit: 'Photo', illustrative: 'Illustrative photo'},
        PL: {credit: 'Zdjęcie', illustrative: 'Zdjęcie poglądowe'},
    }[language];
    const separator = <span className="magic-separator">{MAGIC_SEPARATOR}</span>;

    return (
        <div className='recipe-box kitchen-recipe'>
            <div className='title2'>
                <h3>{translation.title}</h3>
            </div>
            {heroPhoto && (
                <figure className="recipe-photo">
                    <img className='recipe-img' src={heroPhoto.url} alt={translation.title}
                         width={heroPhoto.width} height={heroPhoto.height} decoding="async" />
                    {(heroPhoto.credit || heroPhoto.illustrative) && (
                        <figcaption>
                            {heroPhoto.credit && <>{photoLabels.credit}: {heroPhoto.sourceUrl
                                ? <a href={heroPhoto.sourceUrl} target="_blank" rel="noopener noreferrer">{heroPhoto.credit}</a>
                                : heroPhoto.credit}</>}
                            {heroPhoto.credit && heroPhoto.illustrative && ' · '}
                            {heroPhoto.illustrative && photoLabels.illustrative}
                        </figcaption>
                    )}
                </figure>
            )}
            <p>{translation.servings}</p>
            {separator}
            <IngredientMultiplier multiplier={multiplier} setMultiplier={setMultiplier} />
            <h3>{tr("Ingredients")}</h3>
            <div className="ingredient-list">
                {translation.ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-item">
                        <input
                            type="checkbox"
                            className="ingredient-checkbox"
                            checked={checkedIngredients[index] ?? false}
                            onChange={() => handleCheckboxChange(index)}
                        />
                        <p style={{ textDecoration: checkedIngredients[index] ? 'line-through' : 'none' }}>
                            {changeIngredientQuantity(ingredient, multiplier)}
                        </p>
                    </div>
                ))}
            </div>
            {separator}
            <h3>{tr("Steps")}:</h3>
            {translation.steps.map((step, index) => {
                const stepImage = findPictureUrl(recipe, language, index + 1);
                return (
                    <div key={index}>
                        <p style={{ textAlign: 'left' }}>{numberToEmoji(index + 1)} ➼ {step}</p>
                        {stepImage &&
                            <img className='recipe-img' src={stepImage} alt={`Step ${index + 1}`} />}
                    </div>
                );
            })}
            {translation.notes && (
                <div>
                    {separator}
                    <h3>{tr("Notes")}</h3>
                    <p>{translation.notes}</p>
                </div>
            )}
            {recipe.video && (
                <div>
                    {separator}
                    <h1>{tr("Link to video")}</h1>
                    <a href={recipe.video} target="_blank" rel="noopener noreferrer">
                        <img src={YouTubeLogo} alt={tr("Watch on YouTube")} width="100" />
                    </a>
                </div>
            )}
            <div className='language-line'>
                <h3>{tr("Languages")}:</h3>
                {languageList.map((lang) => (
                    <BetterButton key={lang} text={lang} click={() => goToRecipe(lang)} />
                ))}
            </div>
            <BetterButton text="Back" click={() => navigate(RECIPES)} />
        </div>
    );
}

export default RecipesGen;
