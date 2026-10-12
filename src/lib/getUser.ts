import { getEntry } from 'astro:content';


//--------------FUNCION PARA CENTRALIZAR EL ACCESO A LA COLECCIÓN DE USUARIO (user) Y SU DOCUMENTO (profile.json)----------------

export async function getUser() {
  const entry = await getEntry('user', 'profile'); //getEntry busca en la colección "user" el documento con id "profile.json"

  //COMPROBAR QUE EL PERFIL DE USUARIO (profile.json) EXISTE

  // profile.json siempre debe existir. fallar aquí evita un undefined silencioso más adelante
  if (!entry) {
    throw new Error('No se encontró el perfil de usuario');
  }
  return entry.data;
}

//SIN ESTE EL COMPONENTE NO PUEDE IMPORTAR EL TIPO User (que es el tipo del objeto devuelto por getUser)
export type User = Awaited<ReturnType<typeof getUser>>;
export type LinkItem = User['links'][number];