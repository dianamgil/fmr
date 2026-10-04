// src/lib/getPublications.ts
import { getCollection } from 'astro:content';


//--------------FUNCION PARA CENTRALIZAR EL ACCESO AL ARRAY DE LA  COLECCIÓN DE PUBLICACIONES (publications) Y SU DOCUMENTO (publications.json)----------------
export async function getPublications() {
  // getCollection devuelve un array: una entrada por cada objeto del JSON (id = "pub-AAAA-NNNNN")
  const entries = await getCollection('publications');

  // COMPROBAR QUE HAY PUBLICACIONES (si el JSON está vacío, el build se detiene)
 // if (entries.length === 0) {
    //throw new Error('No hay publicaciones en publications.json');
  //}

  return entries
    .map((entry) => entry.data)                                       //recibir los datos de cada publicacion
    .sort((a, b) => b.year - a.year || b.id.localeCompare(a.id));    // ordenar por mas reciente y por id descendente
}

//Si cambia el schema de Zod, este tipo se actualiza solo. Se usa en las Props de Publications.astro
export type Publication = Awaited<ReturnType<typeof getPublications>>[number];