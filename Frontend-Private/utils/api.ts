// utils/api.ts

// En Expo, localhost no siempre funciona para fetch (especialmente en móviles o emuladores).
// Por defecto apuntamos a tu IP local de red Wi-Fi en el puerto 3000.
// Si esto cambia, puedes usar `process.env.EXPO_PUBLIC_API_URL`
// Si usas emulador Android usa '10.0.2.2', si usas iOS usa 'localhost' o la IP de tu PC.
export const API_URL = 'http://10.220.76.227:3000/api';

export async function apiGet(endpoint: string) {
  try {
    console.log(`[GET] Requesting: ${API_URL}${endpoint}`);
    const res = await fetch(`${API_URL}${endpoint}`);
    const data = await res.json();
    console.log(`[GET] Response from ${endpoint}:`, data);
    if (!data.ok) throw new Error(data.message || 'Error en la petición');
    return data.data; // Devuelve solo el payload interno del Backend
  } catch (error: any) {
    console.error(`[GET] ${endpoint} -> Error:`, error.message);
    throw error;
  }
}

export async function apiPost(endpoint: string, body: any) {
  try {
    console.log(`[POST] Requesting: ${API_URL}${endpoint}`, body);
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`[POST] Response from ${endpoint}:`, data);
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

export async function apiPut(endpoint: string, body: any) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error en PUT');
    return data.data;
  } catch (error: any) {
    console.error(`[PUT] ${endpoint} -> Error:`, error.message);
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
