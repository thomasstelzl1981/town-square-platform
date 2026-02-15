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

export type PresentationKey = 'verkaufspraesentation' | 'rendite' | 'steuervorteil' | 'verwaltung';

export const PRESENTATIONS: Record<PresentationKey, ComponentType[]> = {
  verkaufspraesentation: [VPSlide1, VPSlide2, VPSlide3, VPSlide4, VPSlide5, VPSlide6, VPSlide7, VPSlide8],
  rendite: [RenditeSlide1, RenditeSlide2, RenditeSlide3, RenditeSlide4, RenditeSlide5, RenditeSlide6, RenditeSlide7],
  steuervorteil: [SteuerSlide1, SteuerSlide2, SteuerSlide3, SteuerSlide4, SteuerSlide5, SteuerSlide6],
  verwaltung: [VerwaltungSlide1, VerwaltungSlide2, VerwaltungSlide3, VerwaltungSlide4, VerwaltungSlide5, VerwaltungSlide6, VerwaltungSlide7],
};

/** Maps MediaWidget title → PresentationKey */
export const TITLE_TO_KEY: Record<string, PresentationKey> = {
  'Verkaufspräsentation': 'verkaufspraesentation',
  'Rendite erklärt': 'rendite',
  'Steuervorteil': 'steuervorteil',
  'Verwaltung': 'verwaltung',
};
