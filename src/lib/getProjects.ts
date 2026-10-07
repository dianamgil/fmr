import {getCollection} from 'astro:content';

export async function getProjects() {
   const entries = await getCollection('projects');
   //COMPROBAR QUE HAY PROJECTS (si el JSON está vacío, el build se detiene)
   if (entries.length === 0) {
      throw new Error('No hay proyectos para Mostrar. El archivo projectsresearch.json está vacío o no existe.');
   } 
   return entries
      .map((entry) => ({
         ...entry.data,
         displayPeriod: `${entry.data.start} a ${entry.data.end ?? 'present'}` // si no hay end → "present"
      }))
      .sort((a, b) => b.start.localeCompare(a.start) || b.id.localeCompare(a.id)); // más reciente primero; misma fecha → id mayor (más reciente) primero
}

//SIN ESTE EL COMPONENTE NO PUEDE IMPORTAR EL TIPO Project (que es el tipo de cada objeto del array devuelto por getProjects)
export type Project = Awaited<ReturnType<typeof getProjects>>[number];