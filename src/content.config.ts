import { defineCollection, z } from 'astro:content'; // importa las funciones necesarias para definir colecciones de contenido y validación de esquemas con Zod
import { glob, file } from 'astro/loaders'; // importa el loader glob para buscar archivos con un patrón específico
import type { date } from 'astro/zod';



const DOI_REGEX = /^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/; // Expresión regular para validar DOI 
const CURRENT_YM = new Date().toISOString().slice(0, 7); // recoge de la fecha actual año-mes(yyyy-mm) para luego validr fecha de publicacion 


//----------------------------COLECCIÓN DE USUARIO ------------
// Define schema de usuario con su loader y esquema de validación
const userCollection = defineCollection({


  loader: glob({ pattern: '**/*.json', base: './src/content/user' }), //glob-->Buscador de archivos .json dentro de carpeta src/content/user
  schema: z.object({                                                  //define estructura de datos esperada (reglas de validación de datos Zod)

    name: z.string(),
    role: z.string(),
    university: z.string(),
    avatar: z.string(),
    bio: z.string() .max(150), // límite funcional: bio del ProfileHeader no puede superar 50 caracteres
    longBio: z.array(z.string().trim().min(1)).min(1), // bio larga: un string por párrafo, sin párrafos vacíos
    email: z.string().email(),
    cv: z.string(),
    skills:z.array(
      z.string().trim().min(1)).default([]),                                 //lista simple de habilidades (ej. MATLAB, R); default sin skills, la sección no se pinta si no hay skills
    teaching: z.array(
      z.object({
        period: z.string().regex(/^\d{4}-\d{0,4}$/, ).refine((val) => {
            const [startStr, endStr] = val.split('-');                    // separa "2020-2024" en ["2020", "2024"], o "2020-" en ["2020", ""]
            const start = Number(startStr);
            if (start < 1950 || start > 2100) return false;             // año inicial fuera de rango razonable
            if (endStr) { // si hay año final existe
              const end = Number(endStr);
              if (end < 1950 || end > 2100 || end < start) return false;  // valida que sea superior al año inicial y dentro de rango
            }
            return true; // pasa la validación
            },),
        subject: z.string().trim(),
        role: z.string().trim().optional(),
        university: z.string().trim() 
      })
    ),
    links: z.array(
      z.object({
        id: z.string(),                                                     // Agregar un campo "id" para cada publicación, Escalable con Nest.js.(repeatable, future CRUD/DB rows)
        name: z.string(),
        url: z.string(),
        icon: z.string().optional()
      })
    ),
  }),
});


//----------------------------COLECCIÓN DE PUBLICACIONES----

const publicationsCollection = defineCollection({

  loader: file ('src/content/publications/publications.json'),                      // cada objeto publicaion con "id" único
  schema: z.object({
    id: z.string().regex(/^pub-\d{4}-\d{5}$/, 'id debe ser pub-AAAA-NNNNN'),       //valida solo si el string es exactamente pub-####-#####
    doi: z.string().trim().regex(DOI_REGEX, 'DOI no válido').optional(),
    date: z.string()
      .regex(/^(19[5-9]\d|20\d{2})-(0[1-9]|1[0-2])$/, 'date debe ser AAAA-MM')    // formato sea correcto (YYYY-MM y rango de años(1950-2099)/meses válido 1-12
      .refine((d) => d <= CURRENT_YM, 'Fecha no puede ser futura'),              // valida que la fecha no sea futura

    title: z.string().trim().min(1),
    authors: z.array(z.object({
      name: z.string().trim().min(1),
      isMe: z.boolean().default(false), // negrita <b>
    }).refine((a) => !a.isMe || /^Fernando Martín[- ]Rivera$/.test(a.name), {
      message: 'isMe solo para "Fernando Martín Rivera" o "Fernando Martín-Rivera"',
    })).min(1),
     journal: z.string().trim().min(1),
     url: z.string().trim().url().optional(), // sustituye al DOI cuando no hay (PMC o web de la revista)
     abstract: z.string().trim().optional(),
     image: z.string().trim().optional(),
  }),
});



//----------------------------COLECCIÓN DE TEXTOS LEGALES privacidad, aviso legal... un .md por documento------------

const legalCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }), // ubicacion de fichero privacy.md
  schema: z.object({
    title: z.string().trim().min(1),   // título visible de la página
    updatedAt: z.coerce.date(),        // "2026-09-28" en el frontmatter → objeto Date validado
  }),
});



// Exporta las colecciones para que Astro las reconozca y pueda usarlas 
export const collections = {
      
  user: userCollection, //  "user" para poder acceder a ella con getCollection('user')
  publications: publicationsCollection, //  "publications" para poder usar los datos de publicaciones
  legal: legalCollection, //  "legal" para poder usar los textos legales 
};





