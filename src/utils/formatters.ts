export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('de-DE');
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

export const formatNumber = (number: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

export const getStatusColor = (status: string, colors: any): string => {
  switch (status) {
    case 'offen': return colors.warning || '#ffc107';
    case 'bestellt': return colors.info || '#17a2b8';
    case 'geliefert': return colors.success || '#28a745';
    case 'storniert': return colors.danger || '#dc3545';
    default: return colors.text;
  }
};

export const getDifferenzColor = (differenz: number, colors: any): string => {
  if (differenz === 0) return colors.success;
  if (differenz > 0) return colors.warning;
  return colors.danger;
}; 