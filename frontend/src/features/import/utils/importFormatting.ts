export function formatFileSize(value: number) {
  return value < 1024 * 1024 ? Math.ceil(value / 1024) + ' Ko' : (value / (1024 * 1024)).toFixed(1) + ' Mo';
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

