
import type { APIRoute, GetStaticPaths } from 'astro';
import { getPublications } from '../../../lib/getPublications';  // entrada de datos validados por zod



//datos y tipo de archivo qeu se va a crear en el endpoint de cada publicación, en este caso un JSON con las citas de la publicación

export const getStaticPaths = (async () => {
  const publications = await getPublications();         // recibir todas publicaciones del JSON
  return publications.map((pub) => ({
    params: { id: pub.id },                             //rellena [id] del nombre → pub-2026-00057.json 
    props: { citations: pub.citations },                // datos que se pasan a GET para ese archivo
  }));
}) satisfies GetStaticPaths;

//contenido del endpoint de cada id, en este caso .json con las citas de la publicación

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.citations), {                     // objeto → texto JSON: 
    headers: { 'Content-Type': 'application/json; charset=utf-8' },   // cabecera de tipo de contenido
  });

 