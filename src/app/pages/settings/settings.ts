import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <h1>Configurações</h1>
      <p>Página placeholder para preferências de usuário e ajustes da conta.</p>
      <ul>
        <li>Atualizar dados pessoais (futuro)</li>
        <li>Preferências de notificação</li>
        <li>Gerenciar chaves de API (merchant)</li>
      </ul>
    </div>
  `,
  styleUrl: './settings.css'
})
export class SettingsPage {}
