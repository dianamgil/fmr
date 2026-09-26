import { defineCollection, z } from 'astro:content'; // importa las funciones necesarias para definir colecciones de contenido y validación de esquemas con Zod
import { glob } from 'astro/loaders'; // importa el loader glob para buscar archivos con un patrón específico

// Define schema de usuario con su loader y esquema de validación


//nombrar colletion
const userCollection = defineCollection({


  loader: glob({ pattern: '**/*.json', base: './src/content/user' }), //glob-->Buscador de archivos .json dentro de carpeta src/content/user
  schema: z.object({ //define estructura de datos esperada (reglas de validación de datos Zod)

    name: z.string(),
    role: z.string(),
    university: z.string(),
    avatar: z.string(),
    bio: z.string() .max(150), // límite funcional: bio del ProfileHeader no puede superar 50 caracteres
    email: z.string().email(),
    cv: z.string(),
    theme: z.object({
      primaryColor: z.string(),
      backgroundColor: z.string()
    }),

    teaching: z.array(
      z.object({
        period: z.string().regex(/^\d{4}-\d{0,4}$/, ).refine((val) => {
    const [startStr, endStr] = val.split('-'); // separa "2020-2024" en ["2020", "2024"], o "2020-" en ["2020", ""]
    const start = Number(startStr);
    if (start < 1950 || start > 2100) return false; // año inicial fuera de rango razonable
    if (endStr) { // si hay año final existe
      const end = Number(endStr);
      if (end < 1950 || end > 2100 || end < start) return false; // valida que sea superior al año inicial y dentro de rango
    }
    return true; // pasa la validación
    },),
    subject: z.string().trim(),
    role: z.string().trim().optional(),
    universidad: z.string().trim()

       
      })
    ),
    links: z.array(
      z.object({
        id: z.string(), // Agregar un campo "id" para cada publicación, Escalable con Nest.js.(repeatable, future CRUD/DB rows)
        name: z.string(),
        url: z.string(),
        icon: z.string().optional()
      })
    ),
    publications: z.array(
        //fichero .json debe tener este mismo schema 
      z.object({
         id: z.string(), // Agregar un campo "id" para cada publicación, Escalable con Nest.js.(repeatable, future CRUD/DB rows)
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

