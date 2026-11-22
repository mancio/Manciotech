import {createContext, useContext, useEffect, useState} from "react";
import type {ReactNode} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {LANGUAGE_RECIPE_KEY, RECIPES} from "../logic/Names";
import {findRecipeByUrl, getRecipeURLByIdAndLanguage} from "../logic/Functions";

export type SiteLanguage = "IT" | "EN" | "PL";
export const LANGUAGE_KEY = "manciotechSiteLanguage";
export const LANGUAGES: {code: SiteLanguage; flag: string; name: string}[] = [
    {code:"IT",flag:"🇮🇹",name:"Italiano"},
    {code:"EN",flag:"🇬🇧",name:"English"},
    {code:"PL",flag:"🇵🇱",name:"Polski"},
];
function storedLanguage(): SiteLanguage {
    try {
        const current = localStorage.getItem(LANGUAGE_KEY);
        return current === "IT" || current === "EN" || current === "PL" ? current : "EN";
    } catch { return "EN"; }
}
type Context = {language:SiteLanguage; setLanguage:(language:SiteLanguage)=>void; hasProvider:boolean};
const SiteContext = createContext<Context>({language:"EN",setLanguage:()=>{},hasProvider:false});
export const useSiteLanguage = () => useContext(SiteContext);

export function SiteLanguageProvider({children}:{children:ReactNode}) {
    const [language,setValue]=useState<SiteLanguage>(storedLanguage);
    function setLanguage(next:SiteLanguage) {
        setValue(next);
        try {
            localStorage.setItem(LANGUAGE_KEY,next);
            localStorage.setItem(LANGUAGE_RECIPE_KEY,next);
        } catch {}
    }
    useEffect(()=>{
        document.documentElement.lang = language.toLowerCase();
        // Keep existing recipe language preference for first-time visitors.
        try {
            if (localStorage.getItem(LANGUAGE_KEY)) localStorage.setItem(LANGUAGE_RECIPE_KEY,language);
        } catch {}
    },[language]);
    return <SiteContext.Provider value={{language,setLanguage,hasProvider:true}}>{children}</SiteContext.Provider>;
}

export function SiteLanguageSwitcher() {
    const {language,setLanguage}=useSiteLanguage();
    const location=useLocation();
    const navigate=useNavigate();
    function choose(next:SiteLanguage) {
        setLanguage(next);
        if (location.pathname.startsWith(RECIPES + "/")) {
            const slug=decodeURIComponent(location.pathname.slice((RECIPES+"/").length));
            const recipe=findRecipeByUrl(slug);
            if (recipe) navigate(getRecipeURLByIdAndLanguage(recipe.recipe.id,next),{replace:true});
        }
    }
    return <nav className="home-language-switcher site-language-switcher" aria-label="Website language">
        {LANGUAGES.map(item=><button
            key={item.code} type="button"
            className={"home-language-button"+(language===item.code?" is-active":"")}
            onClick={()=>choose(item.code)}
            aria-label={item.name} aria-pressed={language===item.code} title={item.name}
        ><span aria-hidden="true">{item.flag}</span></button>)}
    </nav>;
}
