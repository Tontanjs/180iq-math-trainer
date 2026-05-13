const KEY = '180iq_authed';

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === '1';
}

export function tryLogin(username: string, password: string): boolean {
  if (username === 'Teeradet222548' && password === '222548Tan') {
    localStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(KEY);
}
