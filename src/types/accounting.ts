import { BaseEntity } from '.';
import { AccountingChartId } from '../constants/accountingTemplates';

// AccountingChart und OCRApiConfig erweitern NICHT mehr BaseEntity,
// da sie nicht als separate Datenbanktabellen verwendet werden

export type AccountingAccountStatus = 'active' | 'archived';
export type AccountingAccountOrigin = 'system' | 'user';

// AccountingChart wird nicht mehr als Datenbanktabelle verwendet (Charts kommen aus Konstanten)
export interface AccountingChart {
  id: string;
  chartId: AccountingChartId;
  label: string;
  description?: string;
  origin: AccountingAccountOrigin;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountingAccount extends BaseEntity {
  chartId: AccountingChartId;
  templateId?: string;
  code?: string;
  number: string;
  name: string;
  category: string;
  vatTag?: string;
  origin: AccountingAccountOrigin;
  status: AccountingAccountStatus;
  notes?: string;
  parentId?: string | null;
  path?: string[];
  sortOrder?: number;
  type?: string;
  isLeaf?: boolean;
}

export interface VatRate {
  value: number;
  label: string;
}

export interface AccountingSettings extends BaseEntity {
  selectedChartId?: AccountingChartId;
  customizationsEnabled?: boolean;
  ocrApiConfigs?: OCRApiConfig[];
  vatRates?: VatRate[];
  updatedAt: Date;
}

export type OCRApiProvider = 'azure' | 'taggun';

// OCRApiConfig wird nicht mehr als separate Datenbanktabelle verwendet (wird in AccountingSettings gespeichert)
export interface OCRApiConfig {
  id: string;
  provider: OCRApiProvider;
  apiEndpoint: string;
  apiKey: string;
  isActive: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

