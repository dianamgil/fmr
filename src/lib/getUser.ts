import { getEntry } from 'astro:content';

export async function getUser() {
  const entry = await getEntry('user', 'profile');

  // profile.json siempre debe existir. fallar aquí evita un undefined silencioso más adelante
  if (!entry) {
    throw new Error('No se encontró el perfil de usuario');
  }
  return entry.data;
}