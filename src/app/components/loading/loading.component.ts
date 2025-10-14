// src/app/components/loading/loading.component.ts

import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LoadingService} from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
    loadingService = inject(LoadingService);
}