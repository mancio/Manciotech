import type {Recipe} from './types';
import {bicchieriniRicottaPereSavoiardi} from './BicchieriniRicottaPereSavoiardi';
import {besciamellaLeggera} from './BesciamellaLeggera';
import {budinoAllaVanigliaConMaizena} from './BudinoAllaVanigliaConMaizena';
import {ciambellaBolognese} from './CiambellaBolognese';
import {cremaMascarpone} from './CremaMascarpone';
import {crescenteBolognese} from './CrescenteBolognese';
import {crocchetteDiPatateEProsciutto} from './CrocchetteDiPatateEProsciutto';
import {crostataMarmellata} from './CrostataMarmellata';
import {focacciaConPomodorini} from './FocacciaConPomodorini';
import {focacciaInPadella} from './FocacciaInPadella';
import {muffinAllaBananaECioccolato} from './MuffinAllaBananaECioccolato';
import {paccheriCremaBurrataGuanciale} from './PaccheriCremaBurrataGuanciale';
import {pancakeAllaBanana} from './PancakeAllaBanana';
import {paniniNapoletani} from './PaniniNapoletani';
import {pannaCottaFragole} from './PannaCottaFragole';
import {pastaRaguBianco} from './PastaRaguBianco';
import {patateAlFornoPerfette} from './PatateAlFornoPerfette';
import {piadinaRomagnola} from './PiadinaRomagnola';
import {polloAlPesto} from './PolloAlPesto';
import {rigatoniCipolla} from './RigatoniCipolla';
import {risottoZafferano} from './RisottoZafferano';
import {spaghettiCarbonara} from './SpaghettiCarbonara';
import {spaghettiConBurrataECompostaDiCipolle} from './SpaghettiConBurrataECompostaDiCipolle';
import {tagliataConRucolaEPomodorini} from './TagliataConRucolaEPomodorini';
import {tiramisu} from './Tiramisu';
import {trotaPatateForno} from './TrotaPatateForno';
import {zabaione} from './Zabaione';
import {zucchineRipiene} from './ZucchineRipiene';

import {costoletteAlFornoConPatate} from './CostoletteAlFornoConPatate';

import {costoletteBrandyGriglia} from './CostoletteBrandyGriglia';
import {salsaFunghiFreschi} from './SalsaFunghiFreschi';
import {filettoMaialeFinferli} from './FilettoMaialeFinferli';
import {insalataPasquale} from './InsalataPasquale';
import {risottoZucchineCocco} from './RisottoZucchineCocco';
import {polpetteSalsaAneto} from './PolpetteSalsaAneto';
import {murzynek} from './Murzynek';
import {grapeLove} from './GrapeLove';
import {costineMieleBirra} from './CostineMieleBirra';
import {muffinLamponiCioccolatoBianco} from './MuffinLamponiCioccolatoBianco';
import {coppaMaialePomodoriCipolle} from './CoppaMaialePomodoriCipolle';
import {tortaCaroteNoci} from './TortaCaroteNoci';
import {costineStufateVerdure} from './CostineStufateVerdure';
import {filettoSenapeFunghi} from './FilettoSenapeFunghi';
import {rosettePastaPizza} from './RosettePastaPizza';
import {cremaPasticceraClassica} from './CremaPasticceraClassica';
import {costineStufateMaggiorana} from './CostineStufateMaggiorana';
import {crepesSottili} from './CrepesSottili';
import {impastoPizza} from './ImpastoPizza';
import {muffinCioccolato} from './MuffinCioccolato';
import {cremaPasticceraPolacca} from './CremaPasticceraPolacca';
import {risottoPolloZucchine} from './RisottoPolloZucchine';
import {insalataCavoloPechinoSenape} from './InsalataCavoloPechinoSenape';

export * from './types';

export const recipes: readonly Recipe[] = [
    bicchieriniRicottaPereSavoiardi,
    budinoAllaVanigliaConMaizena,
    cremaMascarpone,
    crostataMarmellata,
    paccheriCremaBurrataGuanciale,
    pancakeAllaBanana,
    paniniNapoletani,
    pannaCottaFragole,
    risottoZafferano,
    tiramisu,
    zucchineRipiene,
    zabaione,
    ciambellaBolognese,
    spaghettiCarbonara,
    crescenteBolognese,
    focacciaConPomodorini,
    piadinaRomagnola,
    spaghettiConBurrataECompostaDiCipolle,
    polloAlPesto,
    crocchetteDiPatateEProsciutto,
    muffinAllaBananaECioccolato,
    tagliataConRucolaEPomodorini,
    pastaRaguBianco,
    rigatoniCipolla,
    trotaPatateForno,
    patateAlFornoPerfette,
    besciamellaLeggera,
    focacciaInPadella,
    costoletteAlFornoConPatate,
    costoletteBrandyGriglia,
    salsaFunghiFreschi,
    filettoMaialeFinferli,
    insalataPasquale,
    risottoZucchineCocco,
    polpetteSalsaAneto,
    murzynek,
    grapeLove,
    costineMieleBirra,
    muffinLamponiCioccolatoBianco,
    coppaMaialePomodoriCipolle,
    tortaCaroteNoci,
    costineStufateVerdure,
    filettoSenapeFunghi,
    rosettePastaPizza,
    cremaPasticceraClassica,
    costineStufateMaggiorana,
    crepesSottili,
    impastoPizza,
    muffinCioccolato,
    cremaPasticceraPolacca,
    risottoPolloZucchine,
    insalataCavoloPechinoSenape,
];

export const recipesById: ReadonlyMap<number, Recipe> = new Map(recipes.map(r => [r.id, r]));
