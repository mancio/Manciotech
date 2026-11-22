import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import Menu from '../pages/Menu';
import KitchenTools from '../pages/KitchenTools';
import Recipes from '../pages/Recipes';
import {SiteLanguageProvider, SiteLanguageSwitcher} from '../i18n/SiteLanguage';

function renderHome() {
    return render(<MemoryRouter><SiteLanguageProvider><SiteLanguageSwitcher/><Menu/></SiteLanguageProvider></MemoryRouter>);
}
beforeEach(() => localStorage.clear());

test('home page shows language flags and current homepage sections', () => {
    renderHome();
    expect(screen.getByRole('heading', {name: 'Manciotech'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Try my tools'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Android app'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Italiano'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'English'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', {name: 'Polski'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Recipes/})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'GitHub'})).toHaveAttribute('href', 'https://github.com/mancio');
});

test('Italian and Polish flags translate homepage and save recipe preference', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', {name: 'Italiano'}));
    expect(screen.getByRole('heading', {name: 'Prova i miei strumenti'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Ricette/})).toBeInTheDocument();
    expect(localStorage.getItem('manciotechSiteLanguage')).toBe('IT');
    expect(localStorage.getItem('currentLanguage')).toBe('IT');

    fireEvent.click(screen.getByRole('button', {name: 'Polski'}));
    expect(screen.getByRole('heading', {name: 'Wypróbuj moje narzędzia'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Przepisy/})).toBeInTheDocument();
    expect(localStorage.getItem('currentLanguage')).toBe('PL');
});

test('selected language persists on reload', () => {
    localStorage.setItem('manciotechSiteLanguage', 'PL');
    renderHome();
    expect(screen.getByRole('button', {name: 'Polski'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', {name: 'Wypróbuj moje narzędzia'})).toBeInTheDocument();
});

test('selected language follows navigation and remains switchable in tools', () => {
    render(<MemoryRouter>
        <SiteLanguageProvider>
            <SiteLanguageSwitcher/>
            <Routes>
                <Route path="/" element={<Menu/>}/>
                <Route path="/kitchenTools" element={<KitchenTools/>}/>
                <Route path="/recipes" element={<Recipes/>}/>
            </Routes>
        </SiteLanguageProvider>
    </MemoryRouter>);

    fireEvent.click(screen.getByRole('button', {name: 'Italiano'}));
    fireEvent.click(screen.getByRole('button', {name: /Strumenti da cucina/}));
    expect(screen.getByRole('heading', {name: /Cucina/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Italiano'})).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', {name: 'Polski'}));
    expect(screen.getByRole('heading', {name: /Kuchnia/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Polski'})).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('currentLanguage')).toBe('PL');
});
