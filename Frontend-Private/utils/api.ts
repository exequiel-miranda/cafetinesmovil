// utils/api.ts

// En Expo, localhost no siempre funciona para fetch (especialmente en móviles o emuladores).
// Por defecto apuntamos a tu IP local de red Wi-Fi en el puerto 3000.
// Si esto cambia, puedes usar `process.env.EXPO_PUBLIC_API_URL`
export const API_URL = 'http://192.168.1.120:3000/api';

export async function apiGet(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error en la petición');
    return data.data; // Devuelve solo el payload interno del Backend
  } catch (error: any) {
    console.error(`[GET] ${endpoint} -> Error:`, error.message);
    throw error;
  }
}

export async function apiPost(endpoint: string, body: any) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error en POST');
    return data.data;
  } catch (error: any) {
    console.error(`[POST] ${endpoint} -> Error:`, error.message);
    throw error;
  }
}

export async function apiPatch(endpoint: string, body: any) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error en PATCH');
    return data.data;
  } catch (error: any) {
    console.error(`[PATCH] ${endpoint} -> Error:`, error.message);
    throw error;
  }
}

export async function apiDelete(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error en DELETE');
    return data;
  } catch (error: any) {
    console.error(`[DELETE] ${endpoint} -> Error:`, error.message);
    throw error;
  }
}
