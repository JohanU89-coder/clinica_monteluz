import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.scss']
})
export class FamilyComponent {
  authService = inject(AuthService);
  newDependentName: string = '';

  // Paleta de colores para los avatares (Estilo Material Pastel)
  private avatarColors = [
    '#e57373', '#f06292', '#ba68c8', '#9575cd', 
    '#7986cb', '#64b5f6', '#4dd0e1', '#4db6ac', 
    '#81c784', '#aed581', '#ffb74d', '#ff8a65'
  ];

  addDependent() {
    if (!this.newDependentName.trim()) return;
    this.authService.addDependent(this.newDependentName);
    this.newDependentName = '';
  }

  // --- HELPERS VISUALES ---

  // Obtener iniciales (Juan Perez -> JP)
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
  }

  // Generar un color consistente basado en el nombre
  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % this.avatarColors.length);
    return this.avatarColors[index];
  }
}