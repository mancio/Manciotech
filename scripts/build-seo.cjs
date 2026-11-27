const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}});
    module._compile(outputText, filename);
};

const routes = require('../src/logic/Names.ts');
const {recipes, LANGUAGES} = require('../src/data/recipes/index.ts');
const {getRecipeURLByIdAndLanguage, findRecipeByUrl, findPictureUrl, getPictures} = require('../src/logic/recipes.ts');
const {servicesTranslations} = require('../src/i18n/servicesTranslations.ts');
const {homeTranslations} = require('../src/i18n/homeTranslations.ts');

const origin = 'https://manciotech.net';
const arcadeArtwork = '/ai-arcade.jpg';
const build = path.resolve(__dirname, '../build');
const index = path.join(build, 'index.html');
const template = fs.readFileSync(index, 'utf8');
const sitemap = [];

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

function absolute(url) {
    return new URL(url, origin).href;
}

function link(url, label) {
    return '<a href="' + escapeHtml(absolute(url)) + '">' + escapeHtml(label) + '</a>';
}

function alternateLinks(paths) {
    return Object.entries(paths).map(([language, url]) =>
        '<link rel="alternate" hreflang="' + language.toLowerCase() + '" href="' + escapeHtml(absolute(url)) + '">'
    ).join('');
}

function writePage({url, title, description, content, lang = 'en', alternates = {}, schema, image = '/logo512.png', indexable = true}) {
    const canonical = absolute(url);
    const metadata = [
        '<title>' + escapeHtml(title) + '</title>',
        '<meta name="description" content="' + escapeHtml(description) + '">',
        indexable ? '<link rel="canonical" href="' + escapeHtml(canonical) + '">' : '<meta name="robots" content="noindex">',
        alternateLinks(alternates),
        ...Object.entries({'og:title': title, 'og:description': description, 'og:image': absolute(image), 'og:url': canonical})
            .map(([key, value]) => '<meta property="' + key + '" content="' + escapeHtml(value) + '">'),
        schema ? '<script type="application/ld+json">' + JSON.stringify(schema).replace(/</g, '\\u003c') + '</script>' : '',
    ].join('');
    const html = template
        .replace(/<html lang="[^"]+">/, '<html lang="' + lang + '">')
        .replace(/<title>.*?<\/title>|<meta (?:name="description"|property="og:(?:title|description|image|url)")[^>]*>/g, '')
        .replace('</head>', () => metadata + '</head>')
        .replace('<div id="root"></div>', () => '<div id="root"><main class="frame">' + content + '</main></div>');
    const file = url === '/' ? index : path.join(build, url.slice(1) + '.html');
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, html);
    if (indexable) sitemap.push(canonical);
}

const heading = value => '<h1>' + escapeHtml(value) + '</h1>';
const paragraph = value => '<p>' + escapeHtml(value) + '</p>';
const list = (items, tag = 'ul') => '<' + tag + '>' + items.map(item => '<li>' + item + '</li>').join('') + '</' + tag + '>';

const tools = [
    [routes.SCORE_COUNTER, 'Card Score Counter', 'Keep score in Italian card games such as Briscola and Scopa.'],
    [routes.KITCHEN_TOOLS, 'Kitchen Tools', 'Calculate dough hydration and ingredient amounts.'],
    [routes.TEMP, 'Smart Temperature Monitor', 'View temperature and battery readings or try the labelled demo.'],
    [routes.DICE, 'Dice Roller', 'Roll a virtual die.'],
    [routes.FART, 'Sound Button', 'Play a sound effect.'],
    [routes.HOW_OLD, 'Age Calculator', 'Calculate age from a birth date.'],
];
writePage({
    url: '/', title: 'MancioTech | AI Consulting, Custom Software and Tools', description: homeTranslations.EN.servicesIntro,
    image: arcadeArtwork,
    content: heading('MancioTech') + paragraph(homeTranslations.EN.servicesIntro)
        + list([...Object.keys(routes.SERVICE_PATHS).map(language => link(routes.SERVICE_PATHS[language], servicesTranslations[language].homeButton)),
            link(routes.RECIPES, 'Recipes'), ...tools.map(([url, title]) => link(url, title)), link(routes.STOCKS, homeTranslations.EN.stocksTitle)])
        + '<h2>' + escapeHtml(homeTranslations.EN.browserToolsHeading) + '</h2>' + paragraph(homeTranslations.EN.stocksDescription),
});

for (const [language, url] of Object.entries(routes.SERVICE_PATHS)) {
    const copy = servicesTranslations[language];
    writePage({
        url, lang: language.toLowerCase(), alternates: {...routes.SERVICE_PATHS, 'x-default': routes.SERVICES},
        title: {EN:'AI Consulting and Custom Software', IT:'Consulenza AI e sviluppo software su misura', PL:'Doradztwo AI i dedykowane oprogramowanie'}[language] + ' | MancioTech',
        description: homeTranslations[language].servicesIntro,
        image: arcadeArtwork,
        content: heading(copy.title) + paragraph(copy.intro)
            + ['build', 'advisory', 'productivity', 'wiki'].map(key =>
                '<h2>' + escapeHtml(copy[key + 'Title']) + '</h2>' + paragraph(copy[key + (key === 'wiki' ? 'Intro' : 'Text')])).join('')
            + '<section id="contact"><h2>' + escapeHtml(copy.formTitle) + '</h2>' + paragraph(copy.formIntro) + '</section>'
            + list(Object.keys(routes.SERVICE_PATHS).map(code => link(routes.SERVICE_PATHS[code], servicesTranslations[code].homeButton))),
    });
}

for (const [url,title,description] of tools) {
    writePage({url,title: title + ' | MancioTech',description,content: heading(title) + paragraph(description)});
}

const recipeLinks = [];
for (const recipe of recipes) {
    const alternatePaths = {};
    for (const language of LANGUAGES) {
        const url = getRecipeURLByIdAndLanguage(recipe.id, language);
        const matchingLanguage = findRecipeByUrl(url.split('/').pop())?.language;
        if (matchingLanguage === language) alternatePaths[language] = url;
    }

    for (const [language, url] of Object.entries(alternatePaths)) {
        const recipeText = recipe.i18n[language];
        const image = findPictureUrl(recipe, language, 0);
        const photo = getPictures(recipe, language).find(picture => picture.index === 0);
        const photoLabels = {IT: ['Foto', 'Foto illustrativa'], EN: ['Photo', 'Illustrative photo'], PL: ['Zdjęcie', 'Zdjęcie poglądowe']}[language];
        const photoCaption = photo ? [
            photo.credit ? photoLabels[0] + ': ' + (photo.sourceUrl ? link(photo.sourceUrl, photo.credit) : escapeHtml(photo.credit)) : '',
            photo.illustrative ? photoLabels[1] : '',
        ].filter(Boolean).join(' · ') : '';
        const description = {
            EN: 'Ingredients and step-by-step instructions for ', IT: 'Ingredienti e preparazione passo passo per ', PL: 'Składniki i przygotowanie krok po kroku: ',
        }[language] + recipeText.title + '.';
        const schema = image ? {
            '@context': 'https://schema.org', '@type': 'Recipe', name: recipeText.title, image: [absolute(image)],
            description, inLanguage: language.toLowerCase(), recipeYield: recipeText.servings,
            recipeIngredient: recipeText.ingredients,
            recipeInstructions: recipeText.steps.map(text => ({'@type': 'HowToStep', text})),
        } : undefined;
        const labels = {EN:['Ingredients','Instructions'], IT:['Ingredienti','Preparazione'], PL:['Składniki','Przygotowanie']}[language];
        const content = heading(recipeText.title) + paragraph(recipeText.servings)
            + (image ? '<figure class="recipe-photo"><img class="recipe-img" src="' + escapeHtml(absolute(image)) + '" alt="' + escapeHtml(recipeText.title) + '">'
                + (photoCaption ? '<figcaption>' + photoCaption + '</figcaption>' : '') + '</figure>' : '')
            + '<h2>' + labels[0] + '</h2>' + list(recipeText.ingredients.map(escapeHtml))
            + '<h2>' + labels[1] + '</h2>' + list(recipeText.steps.map(escapeHtml), 'ol')
            + list(Object.keys(alternatePaths).map(code => link(alternatePaths[code], recipe.i18n[code].title)));
        writePage({url, title: recipeText.title + ' | MancioTech', description, lang: language.toLowerCase(), alternates: alternatePaths, image, schema, content});
        recipeLinks.push(link(url, recipeText.title));
    }
}

writePage({url: routes.RECIPES, title: 'Recipes | MancioTech', description: 'Browse step-by-step recipes in English, Italian and Polish.', content: heading('Recipes') + list(recipeLinks)});
fs.writeFileSync(path.join(build, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found | MancioTech</title><meta name="robots" content="noindex"><h1>Page not found</h1><p>' + link('/', 'Back to MancioTech') + '</p></html>');
if (fs.existsSync(path.join(build, 'stocks.html'))) sitemap.push(absolute('/stocks'));
fs.writeFileSync(path.join(build, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + sitemap.map(url => '  <url><loc>' + escapeHtml(url) + '</loc></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(build, 'robots.txt'), 'User-agent: *\nDisallow:\nSitemap: ' + absolute('/sitemap.xml') + '\n');
console.log('Generated SEO pages and sitemap for ' + sitemap.length + ' URLs.');
