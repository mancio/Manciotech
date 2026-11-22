import {
    getRecipesByLangText,
    getSharedLanguage,
    removeSpaceLowerCaseString,
    setSharedLanguage,
    sortArrayOfStringsAlphabetically
} from "../logic/Functions";
import {ENGLISH, ITALIAN, MENU, POLISH} from "../logic/Names";
import SearchBar from "../components/SearchBar";
import {useEffect, useState} from "react";
import type {ChangeEvent} from "react";
import type {Language} from "../data/recipes/types";
import {useNavigate} from "react-router-dom";
import "./Recipes.css";

function Recipes() {
    const navigate = useNavigate();
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(getSharedLanguage());
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredRecipes, setFilteredRecipes] = useState<string[]>([]);

    const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const language = event.target.value as Language;
        setSelectedLanguage(language);
        setSharedLanguage(language);
    };

    useEffect(() => {
        setFilteredRecipes(sortArrayOfStringsAlphabetically(getRecipesByLangText(selectedLanguage, searchTerm)));
    }, [selectedLanguage, searchTerm]);

    return (
        <main className="kitchen-page">
            <div className="kitchen-shell">
                <header className="kitchen-hero">
                    <button className="kitchen-back" type="button" onClick={() => navigate(MENU)}>
                        <span aria-hidden="true">←</span> Back to MancioTech
                    </button>
                    <div className="kitchen-eyebrow"><span aria-hidden="true">✦</span> FROM OUR KITCHEN <span aria-hidden="true">✦</span></div>
                    <div className="kitchen-hero-illustration" aria-hidden="true">🍅 <span>🍝</span> 🌿</div>
                    <h1>Recipes <em>& good food.</em></h1>
                    <p className="kitchen-intro">A little collection of dishes worth making, sharing, and coming back to.</p>
                </header>

                <section className="kitchen-content" aria-label="Browse recipes">
                    <div className="kitchen-toolbar">
                        <div className="kitchen-search">
                            <label htmlFor="kitchen-search-input">Find something delicious</label>
                            <SearchBar onSearchTermChange={setSearchTerm} />
                        </div>
                        <div className="kitchen-language">
                            <label htmlFor="kitchen-language-select">Recipe language</label>
                            <select id="kitchen-language-select" value={selectedLanguage} onChange={handleLanguageChange}>
                                <option value={ENGLISH}>English</option>
                                <option value={ITALIAN}>Italiano</option>
                                <option value={POLISH}>Polski</option>
                            </select>
                        </div>
                    </div>

                    <div className="kitchen-list-heading">
                        <div>
                            <span className="kitchen-section-kicker">THE RECIPE BOX</span>
                            <h2>What are we cooking?</h2>
                        </div>
                        <span className="kitchen-count">{filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"}</span>
                    </div>

                    {filteredRecipes.length > 0 ? (
                        <div className="kitchen-recipe-grid">
                            {filteredRecipes.map((recipe, index) => (
                                <button className="kitchen-recipe-card" type="button" key={recipe}
                                    onClick={() => navigate(removeSpaceLowerCaseString(recipe))}>
                                    <span className="kitchen-card-number">{String(index + 1).padStart(2, "0")}</span>
                                    <span className="kitchen-card-icon" aria-hidden="true">🍽️</span>
                                    <span className="kitchen-card-name">{recipe}</span>
                                    <span className="kitchen-card-action" aria-hidden="true">View recipe ↗</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="kitchen-empty">
                            <span aria-hidden="true">🥣</span>
                            <h3>Nothing in the recipe box yet</h3>
                            <p>Try searching for another ingredient or dish.</p>
                        </div>
                    )}
                </section>
                <footer className="kitchen-page-footer">Made with love, served with a little extra olive oil. ♡</footer>
            </div>
        </main>
    );
}

export default Recipes;
