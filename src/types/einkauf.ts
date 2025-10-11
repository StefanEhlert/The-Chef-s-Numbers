import { BaseEntity } from './index';

export interface EinkaufsItem extends BaseEntity {
  artikelName: string;
  menge: number;
  einheit: string;
  lieferant: string;
  preis: number;
  bestelldatum: Date;
  lieferdatum?: Date;
  status: EinkaufsStatus;
}

export type EinkaufsStatus = 'offen' | 'bestellt' | 'geliefert' | 'storniert';

export interface EinkaufsStatistik {
  offen: number;
  bestellt: number;
  geliefert: number;
  gesamt: number;
  gesamtWert: number;
} 