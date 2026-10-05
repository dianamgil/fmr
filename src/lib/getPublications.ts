// src/lib/getPublications.ts
import { getCollection } from 'astro:content';


//--------------FUNCION PARA CENTRALIZAR EL ACCESO AL ARRAY DE LA  COLECCIÓN DE PUBLICACIONES (publications) Y SU DOCUMENTO (publications.json)----------------
export async function getPublications(limit?: number) {

  const sortedEntries = (await getCollection('publications'))

  

// COMPROBAR QUE HAY PUBLICACIONES (si el JSON está vacío, el build se detiene)
 // if (sortedEntries.length === 0) {
    //throw new Error('No hay publicaciones en publications.json'); 
//}
    .map((entry) => ({                                                               // recorre cada entrada y devuelve un objeto NUEVO por cada una
      ...entry.data,                                                                 // datos de cada publicación
      href: entry.data.doi ? `https://doi.org/${entry.data.doi}` : entry.data.url,   // enlace listo: DOI primero, url si no hay DOI
    }))
    .sort((a, b) => b.date - a.date || b.id.localeCompare(a.id));                   // ordenar por mas reciente y por id descendente

  return limit ? sortedEntries.slice(0, limit) : sortedEntries;                    // 0,limit --> sin limit = todas
}
    
//Si cambia el schema de Zod, este tipo se actualiza solo. Se usa en las Props de Publications.astro
export type Publication = Awaited<ReturnType<typeof getPublications>>[number]; 


