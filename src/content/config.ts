import { defineCollection, z } from 'astro:content';  // Aquí importamos a Zod


// Definir la colección de usuario con su esquema de validación para Zod (z) lo valide:
const userCollection = defineCollection({
  type: 'data',

  schema: z.object({
    name: z.string(),
    role: z.string(),
    university: z.string(),
    avatar: z.string(),
    bio: z.string(),
    email: z.string().email(),
    cv: z.string().url(),
    theme: z.object({
      primaryColor: z.string(),
      backgroundColor: z.string()
    }),
    socials: z.array(
        z.object({
          name: z.string(),
          url: z.string().url(),
          icon: z.string()
        })),
    links: z.array(
        z.object({
          name: z.string(),
          url: z.string().url()
        })),
    publications: z.array(
        z.object({
            title: z.string(),
            authors: z.string(),
            journal: z.string(),
            pdf: z.string()
        })
        )
  })
});

export const collections = {
  user: userCollection,
};

