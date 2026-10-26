import { Component, ElementRef, OnInit, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TasksService, errorMessage } from '../api';

@Component({
  imports: [FormsModule],
  selector: 'app-tasks',
  styleUrl: './tasks.css',
  templateUrl: './tasks.html',
})
export class Tasks implements OnInit {
  private api = inject(TasksService);

  newTask = signal('');
  tasks = signal<Task[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  editingId = signal<number | null>(null);
  editTitle = signal('');
  private editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');

  constructor() {
    afterRenderEffect(() => this.editInput()?.nativeElement.focus());
  }

  ngOnInit() {
    this.api.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks.map(normalize));
        this.loading.set(false);
      },
      error: (error) => this.fail(error),
    });
  }

  addTask() {
    const title = this.newTask().trim();
    if (!title) {
      return;
    }
    this.error.set(null);
    this.api.create(title).subscribe({
      next: (task) => {
        this.tasks.update((tasks) => [...tasks, normalize(task)]);
        this.newTask.set('');
      },
      error: (error) => this.fail(error),
    });
  }

  toggle(task: Task) {
    const done = !task.marked_as_done;
    this.replace(task.id, { marked_as_done: done });
    this.api.update(task.id, { marked_as_done: done }).subscribe({
      error: (error) => {
        this.replace(task.id, { marked_as_done: !done });
        this.fail(error);
      },
    });
  }

  startEdit(task: Task) {
    this.editingId.set(task.id);
    this.editTitle.set(task.title);
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  saveEdit(task: Task) {
    if (this.editingId() !== task.id) {
      return;
    }
    const title = this.editTitle().trim();
    this.editingId.set(null);
    if (!title || title === task.title) {
      return;
    }
    const previous = task.title;
    this.replace(task.id, { title });
    this.api.update(task.id, { title }).subscribe({
      error: (error) => {
        this.replace(task.id, { title: previous });
        this.fail(error);
      },
    });
  }

  remove(task: Task) {
    this.api.delete(task.id).subscribe({
      next: () => this.tasks.update((tasks) => tasks.filter((t) => t.id !== task.id)),
      error: (error) => this.fail(error),
    });
  }

  private replace(id: number, changes: Partial<Task>) {
    this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }

  private fail(error: unknown) {
    this.error.set(errorMessage(error));
    this.loading.set(false);
  }
}

// The API may send marked_as_done as 0/1 instead of a boolean.
function normalize(task: Task): Task {
  return { ...task, marked_as_done: !!task.marked_as_done };
}
