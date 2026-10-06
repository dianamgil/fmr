// src/lib/getPublications.ts
import { getCollection } from 'astro:content';


//--------------FUNCION PARA CENTRALIZAR EL ACCESO AL ARRAY DE LA  COLECCIÓN DE PUBLICACIONES (publications) Y SU DOCUMENTO (publications.json)----------------   

export async function getPublications(limit?: number) {
  const entries = await getCollection('publications'); 
 //COMPROBAR QUE HAY PUBLICACIONES (si el JSON está vacío, el build se detiene)
  if (entries.length === 0) {
   throw new Error('No hay publicaciones para Mostrar. El archivo publications.json está vacío o no existe.'); 
}
  const sortedEntries = (await getCollection('publications'))
    .map((entry) => ({                                                                  // recorre cada entrada y devuelve un objeto NUEVO por cada una
      ...entry.data,                                                                
      year: Number(entry.data.date.slice(0, 4)),                                     // derivado: el componente sigue usando pub.year
      href: entry.data.doi ? `https://doi.org/${entry.data.doi}` : entry.data.url,   // enlace listo: DOI primero, url si no hay DOI
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));      // más reciente primero; misma fecha → id mayor (más reciente) primero

  return limit ? sortedEntries.slice(0, limit) : sortedEntries;                    // sin limit = todas
}//Si cambia el schema de Zod, este tipo se actualiza solo. Se usa en las Props de Publications.astro
export type Publication = Awaited<ReturnType<typeof getPublications>>[number]; 
