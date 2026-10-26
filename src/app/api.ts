import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { NewUser, User } from './tasks/user';

export const API_URL = 'https://demo2.z-bit.ee';

const TOKEN_KEY = 'access_token';
const USERNAME_KEY = 'username';

export type Task = {
  id: number;
  title: string;
  desc?: string;
  marked_as_done: boolean;
  created_at?: string;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly token = signal<string | null>(read(TOKEN_KEY));
  readonly username = signal<string | null>(read(USERNAME_KEY));

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<User>(`${API_URL}/users/get-token`, { username, password })
      .pipe(tap((user) => this.setSession(user)));
  }

  register(user: NewUser): Observable<User> {
    return this.http
      .post<User>(`${API_URL}/users`, user)
      .pipe(tap((created) => this.setSession(created)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    this.token.set(null);
    this.username.set(null);
  }

  private setSession(user: User) {
    if (!user.access_token) {
      throw new Error('Server did not return an access token');
    }
    localStorage.setItem(TOKEN_KEY, user.access_token);
    localStorage.setItem(USERNAME_KEY, user.username);
    this.token.set(user.access_token);
    this.username.set(user.username);
  }
}

// Adds the Bearer token to API requests and logs out when the token is rejected.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (token && req.url.startsWith(API_URL)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};

@Injectable({ providedIn: 'root' })
export class TasksService {
  private http = inject(HttpClient);

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_URL}/tasks`);
  }

  create(title: string): Observable<Task> {
    return this.http.post<Task>(`${API_URL}/tasks`, { title, desc: '' });
  }

  update(id: number, changes: Partial<Pick<Task, 'title' | 'desc' | 'marked_as_done'>>): Observable<Task> {
    return this.http.put<Task>(`${API_URL}/tasks/${id}`, changes);
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/tasks/${id}`);
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Could not reach the server';
    }
    const body = error.error;
    if (Array.isArray(body) && body[0]?.message) {
      return body[0].message;
    }
    if (body?.message) {
      return body.message;
    }
    return `Request failed (${error.status})`;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
