import { BaseEntity } from './index';

export interface InventurItem extends BaseEntity {
  artikelName: string;
  kategorie: string;
  sollBestand: number;
  istBestand: number;
  einheit: string;
  preis: number;
  inventurDatum: Date;
  differenz: number;
  bemerkung?: string;
}

export interface InventurStatistik {
  anzahlArtikel: number;
  totalSoll: number;
  totalIst: number;
  totalDifferenz: number;
  totalWert: number;
  durchschnittSoll: number;
  durchschnittIst: number;
  durchschnittDifferenz: number;
} 