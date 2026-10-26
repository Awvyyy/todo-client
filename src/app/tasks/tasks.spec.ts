import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../api';
import { Tasks } from './tasks';

describe('Tasks', () => {
  let component: Tasks;
  let fixture: ComponentFixture<Tasks>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tasks],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Tasks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load tasks from the server', async () => {
    http.expectOne(`${API_URL}/tasks`).flush([
      { id: 1, title: 'Buy milk', desc: '', marked_as_done: 0 },
    ]);
    await fixture.whenStable();

    expect(component.tasks()).toEqual([
      { id: 1, title: 'Buy milk', desc: '', marked_as_done: false },
    ]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Buy milk');
  });

  it('should add a task', () => {
    http.expectOne(`${API_URL}/tasks`).flush([]);
    component.newTask.set('Walk the dog');
    component.addTask();

    const req = http.expectOne(`${API_URL}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Walk the dog');
    req.flush({ id: 2, title: 'Walk the dog', desc: '', marked_as_done: false });

    expect(component.tasks().map((t) => t.title)).toEqual(['Walk the dog']);
    expect(component.newTask()).toBe('');
  });
});
