import { defineCollection, z } from 'astro:content'; // importa las funciones necesarias para definir colecciones de contenido y validación de esquemas con Zod
import { glob, file } from 'astro/loaders'; // importa el loader glob para buscar archivos con un patrón específico


//------para validar nombre usuario en revistas   
const MY_NAMES = [
  'Fernando Martín-Rivera',
  'Fernando Martín Rivera',
  'Fernando Martin-Rivera',
  'Fernando Martin',
];

//------para valdiacion de publications--------------
const DOI_REGEX = /^10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/; // Expresión regular para validar DOI 
const CURRENT_YM = new Date().toISOString().slice(0, 7); // recoge de la fecha actual año-mes(yyyy-mm) para luego validr fecha de publicacion 
const MOJIBAKE = /Ã|â€|Â|&amp;|�/;  // restos de UTF-8 mal decodificado (Ã­, â€“, &amp;...)
const citationText = z.string().trim().min(1).refine((s) => !MOJIBAKE.test(s), 'Cita con mojibake');  // base común para todos los formatos

//------para validación de PERIODOS DE projects--------------
const YEAR_MONTH = /^(20[5-9]\d|20\d{2})\/(0[1-9]|1[0-2])$/; // AAAA-MM, mismo formato que date de publications



//----------------------------COLECCIÓN DE USUARIO ------------
// Define schema de usuario con su loader y esquema de validación
const userCollection = defineCollection({


  loader: glob({ pattern: '**/*.json', base: './src/content/user' }), //glob-->Buscador de archivos .json dentro de carpeta src/content/user
  schema: z.object({                                                  //define estructura de datos esperada (reglas de validación de datos Zod)

    name: z.string(),
    role: z.string(),
    university: z.string(),
    universityLink: z.string().url(), //valida que sea un URL válido
    avatar: z.string(),
    shortBio: z.string().max(150), // límite funcional: bio del ProfileHeader no puede superar 150 caracteres
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
        category: z.enum(['grado', 'postgrado']),
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
    }).refine((a) => !a.isMe || MY_NAMES.includes(a.name), {
      message: `isMe solo para: ${MY_NAMES.join(' / ')}`,
    })).min(1),
     journal: z.string().trim().min(1),
     url: z.string().trim().url().optional(), // sustituye al DOI cuando no hay (PMC o web de la revista)
     abstract: z.string().trim().optional(),
     image: z.string().trim().optional(),
      citations: z.object({
       apa: citationText,                   
       vancouver: citationText.optional(),  
       bibtex: citationText.refine((s) => s.startsWith('@'), 'BibTeX debe empezar por "@"')
         .refine((s) => s.split('{').length === s.split('}').length, 'BibTeX con llaves desbalanceadas')
         .refine((s) => /author\s*=/.test(s) && /title\s*=/.test(s) && /year\s*=/.test(s), 'BibTeX sin author/title/year')
         .optional(),
       ris: citationText.refine((s) => s.startsWith('TY  -'), 'RIS debe empezar por "TY  -"')
         .refine((s) => s.endsWith('ER  -'), 'RIS debe terminar en "ER  -"')
         .optional(),
     }),
  }),
});


//----------------------------COLECCIÓN DE PUBLICACIONES----

const projectsColletion = defineCollection({
  loader: file ('src/content/projects/projectsresearch.json'), 
  schema: z.object({
     id: z.string().regex(/^proj-\d{4}-\d{3}$/, 'id debe ser proj-AAAA-NNN'),                     // cada objeto publicaion con "id" único
     title: z.string().trim().min(1),
    code: z.string().trim().min(1),             // AEST/2020/024
    funder: z.string().trim().min(1),
    participants: z.number().int().positive().optional(),
     role: z.string(),
     start: z.string().regex(YEAR_MONTH, 'start debe ser AAAA-MM'),
    end: z.string().regex(YEAR_MONTH, 'end debe ser AAAA-MM').optional(),    // sin end → "present"
  }).refine((p) => !p.end || p.end >= p.start, { message: 'end no puede ser anterior a start', path: ['end'] }),

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
  projects: projectsColletion, //  "projects" para poder usar los proyectos de investigación
};





