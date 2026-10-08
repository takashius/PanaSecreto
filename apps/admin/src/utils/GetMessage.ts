export function getErrorMessage(error: any): string {
  if (!error) return '';
  if (typeof error === 'string') return error;

  const data = error.response?.data || error.data;
  if (data) {
    if (typeof data === 'string') return data;
    if (data.message && typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error === 'string') return data.error;
    if (typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey && typeof data[firstKey] === 'string') {
        return data[firstKey];
      }
    }
  }

  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return 'Error de comunicación con el servidor.';
}
