import { defineCollection, z } from 'astro:content'; // importa las funciones necesarias para definir colecciones de contenido y validación de esquemas con Zod
import { glob } from 'astro/loaders'; // importa el loader glob para buscar archivos con un patrón específico

// Define schema de usuario con su loader y esquema de validación
const userCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/user' }), //glob-->Buscador de archivos .json dentro de carpeta src/content/user
  schema: z.object({ //define estructura de datos esperada (reglas de validación de datos Zod)
    name: z.string(),
    role: z.string(),
    university: z.string(),
    avatar: z.string(),
    bio: z.string(),
    email: z.string().email(),
    cv: z.string(),
    theme: z.object({
      primaryColor: z.string(),
      backgroundColor: z.string()
    }),
     socials: z.array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        icon: z.string().optional(),
      })
    ),
    links: z.array(
      z.object({

        title: z.string(),
        url: z.string(),
        icon: z.string().optional(),
      })
    ),
    publications: z.array(
        //fichero .json debe tener este mismo schema 
      z.object({
         id: z.string(), // Agregar un campo "id" para cada publicación, Escalable con Nest.js para clave primaria
        title: z.string(),
        authors: z.string(),
        journal: z.string(),
        pdf: z.string(),
      })
    ).default([]), //Si no hay ninguna publicación, usa una lista vacía [] en vez de dar error.
  }),
});

// Exporta las colecciones para que Astro las reconozca y pueda usarlas
export const collections = {
      // Registra la colección "user" para poder acceder a ella con getCollection('user')
  user: userCollection,
};

