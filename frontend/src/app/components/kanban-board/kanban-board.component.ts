import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit {
  todo: any[] = [];
  doing: any[] = [];
  done: any[] = [];
  aiGoal: string = '';
  isGenerating: boolean = false;

  searchQuery: string = '';
  unreadNotifications: number = 0;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadAllTasks();
    this.setupRealTimeListeners();
  }

  loadAllTasks() {
    this.taskService.getTasks().subscribe((tasks: any[]) => {
      this.todo = tasks.filter((t: any) => t.status === 'TODO');
      this.doing = tasks.filter((t: any) => t.status === 'DOING');
      this.done = tasks.filter((t: any) => t.status === 'DONE');
    });
  }

  setupRealTimeListeners() {
    this.taskService.onTaskAdded().subscribe(() => {
      this.unreadNotifications++;
      this.loadAllTasks();
    });
    this.taskService.onTaskUpdated().subscribe(() => this.loadAllTasks());
    this.taskService.onTaskDeleted().subscribe(() => this.loadAllTasks());
  }

  drop(event: CdkDragDrop<any[]>, targetStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const movedTask = event.container.data[event.currentIndex];
      this.taskService.updateTaskStatus(movedTask.id, targetStatus).subscribe();
    }
  }

  onGenerateAiTasks() {
    if (!this.aiGoal.trim()) return;
    this.isGenerating = true;
    this.taskService.generateAiTasks(this.aiGoal).subscribe({
      next: () => {
        this.aiGoal = '';
        this.isGenerating = false;
      },
      error: (err) => {
        alert('ስህተት ተፈጥሯል፡ ' + (err.error?.error || err.message));
        this.isGenerating = false;
      }
    });
  }

  onSearch() {
    this.taskService.searchTasks(this.searchQuery).subscribe((tasks: any[]) => {
      this.todo = tasks.filter((t: any) => t.status === 'TODO');
      this.doing = tasks.filter((t: any) => t.status === 'DOING');
      this.done = tasks.filter((t: any) => t.status === 'DONE');
    });
  }

  clearNotifications() {
    this.unreadNotifications = 0;
  }

  onDeleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe();
  }
}
