import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:5000/api/tasks';
  private socket = io('http://localhost:5000');

  constructor(private http: HttpClient) {}

  // 1. ሁሉንም ስራዎች ከባክአንድ ማምጣት
  getTasks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. አዲስ ስራ መፍጠር
  createTask(task: { title: string; description: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, task);
  }

  // 3. የስራ ደረጃን ማሻሻል
  updateTaskStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { status });
  }

  // 4. በ AI ስራዎችን ማመንጨት
  generateAiTasks(goal: string): Observable<any> {
    return this.http.post<any>('http://localhost:5000/api/ai/generate-tasks', { goal });
  }

  // 5. ስራዎችን መፈለግ
  searchTasks(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  // 6. ስራን ማጥፋት (Delete)
  deleteTask(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // 7. የሪል-ታይም ማዳመጫዎች (Socket Listeners)
  onTaskAdded(): Observable<any> {
    const subject = new Subject<any>();
    this.socket.on('taskAdded', (data) => subject.next(data));
    return subject.asObservable();
  }

  onTaskUpdated(): Observable<any> {
    const subject = new Subject<any>();
    this.socket.on('taskUpdated', (data) => subject.next(data));
    return subject.asObservable();
  }

  onTaskDeleted(): Observable<any> {
    const subject = new Subject<any>();
    this.socket.on('taskDeleted', (id) => subject.next(id));
    return subject.asObservable();
  }
}
