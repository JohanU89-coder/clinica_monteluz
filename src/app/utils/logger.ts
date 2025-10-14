// src/app/utils/logger.ts

export class Logger {
  private static isProduction = true; // Cambiar a true en producción

  static log(message: string, ...args: any[]) {
    if (!this.isProduction) {
      console.log(message, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    // Los errores siempre se loguean
    console.error(message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    if (!this.isProduction) {
      console.warn(message, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (!this.isProduction) {
      console.info(message, ...args);
    }
  }

  // Para auditoría crítica (siempre se loguea)
  static audit(action: string, data: any) {
    console.log(`🔐 [AUDIT] ${action}:`, data);
    // Aquí podrías enviar a un servicio de logging externo en el futuro
  }
}
