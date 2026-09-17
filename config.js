/* =====================================================
   CONFIGURACIÓN — CREDENCIALES
   ---------------------------------------------------
   Este archivo es el ÚNICO lugar donde tenés que tocar
   credenciales. app.js las importa desde acá.

   No es un secreto "de servidor" (estas claves viajan
   igual al navegador de cualquier visitante), pero así
   evitás tener que buscarlas dentro de app.js cada vez
   que cambiás de proyecto o las movés a otro lado.

   Recomendación: agregá este archivo a tu .gitignore
   si subís el proyecto a un repositorio público, y dejá
   config.example.js como referencia con valores falsos.
===================================================== */

export const firebaseConfig = {
    apiKey: "AIzaSyAQkoJ1NZ05MSHAkP2JXQlNkhg14uIulps",
    authDomain: "chat-44405.firebaseapp.com",
    projectId: "chat-44405",
    storageBucket: "chat-44405.firebasestorage.app",
    messagingSenderId: "239453189829",
    appId: "1:239453189829:web:3fa427b9f8cacae74422ac",
    measurementId: "G-TSJWY9EVS7"
};

export const ADMIN_USERNAME = "minibenja2016";

// Project Settings -> API -> "Project URL" y "anon public" key
export const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
export const SUPABASE_ANON_KEY = "TU-ANON-KEY-PUBLICA";

// Nombre del bucket creado en Supabase (Storage -> New bucket)
export const SUPABASE_BUCKET = "chat-images";
