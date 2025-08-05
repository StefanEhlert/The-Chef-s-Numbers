// Gemeinsame Interfaces für die gesamte Anwendung

export interface Colors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  paper: string;
  card: string;
  cardBorder: string;
  cardHeader: string;
  text: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  paperShadow: string;
}

export interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface StatisticCard {
  title: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  disabled?: boolean;
  icon?: React.ReactNode;
} 