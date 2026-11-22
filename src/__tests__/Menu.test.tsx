import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import Menu from '../pages/Menu';

beforeEach(() => localStorage.clear());

test('home page shows language flags and current homepage sections', () => {
    render(<MemoryRouter><Menu/></MemoryRouter>);
    expect(screen.getByRole('heading', {name: 'Manciotech'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Try my tools'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Android app'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Italiano'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'English'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', {name: 'Polski'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Recipes/})).toBeInTheDocument();
    expect(screen.getAllByRole('link', {name: 'GitHub'})[0]).toHaveAttribute('href', 'https://github.com/mancio');
});

test('Italian and Polish flags translate homepage and save recipe preference', () => {
    render(<MemoryRouter><Menu/></MemoryRouter>);
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

test('selected homepage language persists when visiting again', () => {
    localStorage.setItem('manciotechSiteLanguage', 'PL');
    render(<MemoryRouter><Menu/></MemoryRouter>);
    expect(screen.getByRole('button', {name: 'Polski'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', {name: 'Wypróbuj moje narzędzia'})).toBeInTheDocument();
});
