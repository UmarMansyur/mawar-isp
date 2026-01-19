// API configuration for Mikrotik backend
const API_BASE = 'http://localhost:3001/api/mikrotik';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MikrotikDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  status: string;
  lastSync?: string;
}

export interface PPPProfile {
  id: string;
  name: string;
  local_address: string;
  remote_address: string;
  rate_limit: string;
  mikrotik_id: string;
}

export interface PPPSecret {
  id: string;
  name: string;
  password: string;
  profile: string;
  disabled: boolean;
  local_address?: string;
  remote_address?: string;
}

export interface ActiveConnection {
  id: string;
  name: string;
  service: string;
  caller_id: string;
  address: string;
  uptime: string;
}

// Generic fetch wrapper with timeout
async function apiFetch<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 60000): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Mikrotik might be unreachable.' };
    }
    return { success: false, error: String(error) };
  }
}

// Test Mikrotik connection
export async function testMikrotikConnection(mikrotikId: string): Promise<ApiResponse<{ identity: string }>> {
  return apiFetch('/test-connection', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId }),
  });
}

// Get PPP Profiles (from database cache)
export async function getPPPProfiles(mikrotikId: string): Promise<ApiResponse<PPPProfile[]>> {
  return apiFetch('/pppoe/profiles', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId }),
  });
}

// Sync PPP Profiles (from Mikrotik and save to database)
export async function syncPPPProfiles(mikrotikId: string): Promise<ApiResponse<PPPProfile[]>> {
  return apiFetch('/pppoe/profiles/sync', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId }),
  });
}

// Get PPP Secrets (from database cache)
export async function getPPPSecrets(mikrotikId: string): Promise<ApiResponse<PPPSecret[]>> {
  return apiFetch('/pppoe/secrets', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId }),
  });
}

// Sync PPP Secrets (from Mikrotik and save to database)
export async function syncPPPSecrets(mikrotikId: string): Promise<ApiResponse<PPPSecret[]>> {
  return apiFetch('/pppoe/secrets/sync', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId }),
  });
}

// Disable PPP Secret (Isolir)
export async function disablePPPSecret(mikrotikId: string, name: string): Promise<ApiResponse<void>> {
  return apiFetch('/pppoe/secrets/disable', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId, name }),
  });
}

// Enable PPP Secret (Aktivasi)
export async function enablePPPSecret(mikrotikId: string, name: string): Promise<ApiResponse<void>> {
  return apiFetch('/pppoe/secrets/enable', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId, name }),
  });
}

// Get Active Connections
export async function getActiveConnections(mikrotikId: string): Promise<ApiResponse<ActiveConnection[]>> {
  return apiFetch('/pppoe/active', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId }),
  });
}

// Create PPP Secret
export async function createPPPSecret(mikrotikId: string, data: {
  name: string;
  password: string;
  profile?: string;
  localAddress?: string;
  remoteAddress?: string;
}): Promise<ApiResponse<{ id: string }>> {
  return apiFetch('/pppoe/secrets/create', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId, ...data }),
  });
}

// Update PPP Secret
export async function updatePPPSecret(mikrotikId: string, name: string, data: {
  password?: string;
  profile?: string;
  disabled?: boolean;
}): Promise<ApiResponse<void>> {
  return apiFetch('/pppoe/secrets/update', {
    method: 'POST',
    body: JSON.stringify({ mikrotik_id: mikrotikId, name, ...data }),
  });
}
