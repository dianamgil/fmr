// Convierte "texto **negrita** texto" en segmentos. split con grupo de captura deja lo marcado en posiciones impares.
// Seguro (XSS): devuelve texto plano; el componente decide pintar <strong>, nunca se inyecta HTML.

export function boldSegments(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => ({ text: part, bold: i % 2 === 1 }));
}