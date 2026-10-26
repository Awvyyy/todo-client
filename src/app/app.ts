import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, errorMessage } from './api';
import { Tasks } from './tasks/tasks';

@Component({
  selector: 'app-root',
  imports: [FormsModule, Tasks],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(AuthService);

  mode = signal<'login' | 'register'>('login');
  username = signal('');
  password = signal('');
  firstname = signal('');
  lastname = signal('');
  error = signal<string | null>(null);
  busy = signal(false);

  switchMode() {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
    this.error.set(null);
  }

  submit() {
    const username = this.username().trim();
    if (!username || !this.password()) {
      return;
    }
    this.error.set(null);
    this.busy.set(true);

    const request = this.mode() === 'login'
      ? this.auth.login(username, this.password())
      : this.auth.register({
          username,
          firstname: this.firstname().trim(),
          lastname: this.lastname().trim(),
          newPassword: this.password(),
        });

    request.subscribe({
      next: () => {
        this.password.set('');
        this.busy.set(false);
      },
      error: (error) => {
        this.error.set(this.mode() === 'login' && error.status === 401
          ? 'Wrong username or password'
          : errorMessage(error));
        this.busy.set(false);
      },
    });
  }

  logout() {
    this.auth.logout();
    this.username.set('');
  }
}
