/**
 * slideData — Mapping von Widget-Titel zu Slide-Set
 */
import type { ComponentType } from 'react';
import {
  VPSlide1, VPSlide2, VPSlide3, VPSlide4, VPSlide5, VPSlide6, VPSlide7, VPSlide8,
} from './slides/VerkaufspraesSlides';
import {
  RenditeSlide1, RenditeSlide2, RenditeSlide3, RenditeSlide4, RenditeSlide5, RenditeSlide6, RenditeSlide7,
} from './slides/RenditeSlides';
import {
  SteuerSlide1, SteuerSlide2, SteuerSlide3, SteuerSlide4, SteuerSlide5, SteuerSlide6,
} from './slides/SteuervorteilSlides';
import {
  VerwaltungSlide1, VerwaltungSlide2, VerwaltungSlide3, VerwaltungSlide4, VerwaltungSlide5, VerwaltungSlide6, VerwaltungSlide7,
} from './slides/VerwaltungSlides';
import {
  SchulungVerkauf1, SchulungVerkauf2, SchulungVerkauf3, SchulungVerkauf4, SchulungVerkauf5, SchulungVerkauf6, SchulungVerkauf7,
  SchulungFachwissen1, SchulungFachwissen2, SchulungFachwissen3, SchulungFachwissen4, SchulungFachwissen5, SchulungFachwissen6, SchulungFachwissen7,
  SchulungGespraech1, SchulungGespraech2, SchulungGespraech3, SchulungGespraech4, SchulungGespraech5, SchulungGespraech6,
  SchulungPlattform1, SchulungPlattform2, SchulungPlattform3, SchulungPlattform4, SchulungPlattform5, SchulungPlattform6, SchulungPlattform7,
} from './slides/SchulungSlides';

export type PresentationKey =
  | 'verkaufspraesentation' | 'rendite' | 'steuervorteil' | 'verwaltung'
  | 'schulung_verkaufsleitfaden' | 'schulung_fachwissen' | 'schulung_gespraechsleitfaden' | 'schulung_plattform';

export const PRESENTATIONS: Record<PresentationKey, ComponentType[]> = {
  verkaufspraesentation: [VPSlide1, VPSlide2, VPSlide3, VPSlide4, VPSlide5, VPSlide6, VPSlide7, VPSlide8],
  rendite: [RenditeSlide1, RenditeSlide2, RenditeSlide3, RenditeSlide4, RenditeSlide5, RenditeSlide6, RenditeSlide7],
  steuervorteil: [SteuerSlide1, SteuerSlide2, SteuerSlide3, SteuerSlide4, SteuerSlide5, SteuerSlide6],
  verwaltung: [VerwaltungSlide1, VerwaltungSlide2, VerwaltungSlide3, VerwaltungSlide4, VerwaltungSlide5, VerwaltungSlide6, VerwaltungSlide7],
  schulung_verkaufsleitfaden: [SchulungVerkauf1, SchulungVerkauf2, SchulungVerkauf3, SchulungVerkauf4, SchulungVerkauf5, SchulungVerkauf6, SchulungVerkauf7],
  schulung_fachwissen: [SchulungFachwissen1, SchulungFachwissen2, SchulungFachwissen3, SchulungFachwissen4, SchulungFachwissen5, SchulungFachwissen6, SchulungFachwissen7],
  schulung_gespraechsleitfaden: [SchulungGespraech1, SchulungGespraech2, SchulungGespraech3, SchulungGespraech4, SchulungGespraech5, SchulungGespraech6],
  schulung_plattform: [SchulungPlattform1, SchulungPlattform2, SchulungPlattform3, SchulungPlattform4, SchulungPlattform5, SchulungPlattform6, SchulungPlattform7],
};

/** Maps MediaWidget title → PresentationKey */
export const TITLE_TO_KEY: Record<string, PresentationKey> = {
  // Beratung (Kunden-Präsentationen)
  'Verkaufspräsentation': 'verkaufspraesentation',
  'Rendite erklärt': 'rendite',
  'Steuervorteil': 'steuervorteil',
  'Verwaltung': 'verwaltung',
  // Schulung (Berater-Ausbildung)
  'Verkaufsleitfaden': 'schulung_verkaufsleitfaden',
  'Fachwissen Kapitalanlage': 'schulung_fachwissen',
  'Gesprächsleitfaden': 'schulung_gespraechsleitfaden',
  'Plattform-Schulung': 'schulung_plattform',
};
