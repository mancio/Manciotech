import {render, screen} from '@testing-library/react';
import App from '../App';

beforeEach(() => {
    // jsdom does not implement the canvas 2D rendering API.
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => jest.restoreAllMocks());

test('renders the app shell with the cookie notice', () => {
    render(<App/>);
    expect(screen.getByText(/This website uses cookies/i)).toBeInTheDocument();
});

test('shows the automatic snake canvas instead of floating SVG pieces', () => {
    const {container} = render(<App/>);
    expect(container.querySelector('.auto-snake-background canvas')).toBeInTheDocument();
    expect(container.querySelector('.floater')).not.toBeInTheDocument();
});
