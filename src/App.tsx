import CookieNotice from "./components/CookieNotice";
import CookiePolicy from "./pages/CookiePolicy";
import './App.css';
import { Routes, Route, BrowserRouter } from "react-router-dom"
import {
    DICE,
    FART, HOW_OLD,
    KITCHEN_TOOLS,
    MENU,
    SERVICE_PATHS,
    RECIPES,
    SCORE_COUNTER,
    TEMP
} from "./logic/Names";
import {lazy, Suspense} from "react";
import AutoSnake from "./animation/AutoSnake";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import {SiteLanguageProvider, SiteLanguageSwitcher} from "./i18n/SiteLanguage";
const Menu = lazy(() => import('./pages/Menu'));
const Services = lazy(() => import('./pages/Services'));
const Recipes = lazy(() => import('./pages/Recipes'));
const RecipesGen = lazy(() => import('./pages/RecipesGen'));
const ScoreCounter = lazy(() => import('./pages/ScoreCounter'));
const KitchenTools = lazy(() => import('./pages/KitchenTools'));
const Dice = lazy(() => import('./pages/Dice'));
const Fart = lazy(() => import('./pages/Fart'));
const Temperature = lazy(() => import('./pages/Temperature'));
const HowOld = lazy(() => import('./pages/HowOld'));


function App() {
    return (
        <div className="App">
            <AutoSnake />
            <BrowserRouter>
                <SiteLanguageProvider>
                    <CookieNotice />
                    <div className="frame">
                        <SiteLanguageSwitcher />
                        <ScrollToTop />
                        <Suspense fallback={<div>Loading...</div>}>
                        <Routes>
                            <Route path="/cookies" element={<CookiePolicy />} />
                            <Route path={MENU} element={<Menu />} />
                            {Object.values(SERVICE_PATHS).map(path => <Route key={path} path={path} element={<Services />} />)}
                            <Route path={RECIPES} element={<Recipes />} />
                            <Route path={RECIPES + '/:recipeName'} element={<RecipesGen />} />
                            <Route path={SCORE_COUNTER} element={<ScoreCounter />} />
                            <Route path={KITCHEN_TOOLS} element={<KitchenTools />} />
                            <Route path={DICE} element={<Dice />} />
                            <Route path={FART} element={<Fart />} />
                            <Route path={TEMP} element={<Temperature />} />
                            <Route path={HOW_OLD} element={<HowOld /> } />
                        </Routes>
                        </Suspense>
                    </div>
                    <Footer />
                </SiteLanguageProvider>
            </BrowserRouter>
            {/* The footer follows the routed page content in normal document flow. */}
        </div>
    );
}

export default App;
