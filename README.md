# 🏥 Clínica Monteluz

## 📖 Descripción
El proyecto **Clínica Monteluz** es un sistema web desarrollado para optimizar la **gestión de citas médicas** y mejorar la comunicación entre pacientes, médicos y personal administrativo.  
Permite a los pacientes registrarse, consultar especialidades, reservar y reprogramar citas en línea, mientras los médicos pueden administrar sus horarios y generar recetas médicas digitales en formato Word mediante la librería **Apache POI**.

El sistema se desarrolló con **Angular + TailwindCSS** en el frontend, **Supabase** como backend-as-a-service (autenticación, almacenamiento y base de datos relacional), y **Java con Apache POI** para la generación de documentos clínicos.

🔗 **Página del proyecto:** [https://clinica-monteluz.vercel.app/](https://clinica-monteluz.vercel.app/)  
🔗 **Repositorio GitHub:** [https://github.com/JohanU89-coder/clinica_monteluz](https://github.com/JohanU89-coder/clinica_monteluz)

---

## 👨‍💻 Equipo de desarrollo
| Integrante | Rol / Módulo |
|-------------|--------------|
| **Stephany Oliva Ayala** | Diseño UI/UX, maquetación con TailwindCSS y pruebas funcionales |
| **Jhair Württele Juarez** | Lógica de negocio, arquitectura MVC/DAO, conexión Supabase |
| **Jacob Palomino Remon** | Modelado de base de datos y desarrollo de módulo médico |
| **Johan Gonzales Agurto** | Coordinación general, integración front-back, control de versiones Git |
| **Juan Vladimir Cruz Mamani** | Documentación técnica, pruebas y despliegue en Vercel |

> 🧩 Todos los integrantes participaron activamente en cada etapa del desarrollo, aplicando trabajo colaborativo con Git y revisiones cruzadas en GitHub.

---

## 🌿 Flujo GitHub aplicado
El equipo aplicó el **flujo completo de trabajo colaborativo** con Git y GitHub.

- **Ramas creadas:**
  - `feature/frontend-ui`
  - `feature/backend-integration`
  - `feature/dao-architecture`
  - `feature/apache-poi`
  - `bugfix/ui-adjustments`
  - `main` (rama principal)

- **Commits realizados:**
  - Commits frecuentes y descriptivos como:
    - `feat: implementación del módulo de reservas`
    - `fix: ajuste en validaciones de formulario`
    - `add: integración de Apache POI para recetas médicas`
    - `update: mejoras en interfaz y rutas`

- **Pull Requests revisados:**
  - Cada miembro realizó PRs hacia `main`, revisadas por otro integrante.
  - Se documentaron los cambios y se resolvieron conflictos antes del merge.

- **Proceso colaborativo:**
  - Uso de **branches por funcionalidad**.
  - **Merge sin conflictos** mediante PRs revisadas.
  - Comunicación constante por GitHub y control de versiones sincronizado.
  - Validación del avance semanal en commits grupales.

---

## 🧱 Arquitectura del sistema
El proyecto aplica el patrón **MVC + DAO**, cumpliendo principios **SOLID** para garantizar mantenibilidad y escalabilidad.

El sistema Clínica Monteluz implementa una arquitectura basada en el patrón Modelo–Vista–Controlador (MVC) adaptado al entorno Angular. Aunque no se utiliza el modelo clásico de MVC del lado del servidor, la estructura del proyecto mantiene claramente la separación de responsabilidades: las Vistas corresponden a los archivos HTML y hojas de estilo diseñadas con TailwindCSS; los Controladores están representados por las clases TypeScript de los componentes, que gestionan la interacción entre el usuario y la lógica de negocio; y los Modelos se implementan mediante servicios e interfaces que definen la estructura de los datos y encapsulan las reglas del negocio. Esta organización, complementada con la capa DAO para el acceso a datos en Supabase y los principios SOLID, garantiza un sistema modular, mantenible y coherente con las buenas prácticas de ingeniería de software.

- **Modelo:** Servicios y estructuras de datos en `src/app/services/` y `src/app/interfaces/`
- **Vista:** Plantillas HTML en `src/app/components/**`
- **Controlador:** Lógica de interacción (componentes `.ts`)
- **DAO:** Clases para el acceso a Supabase (`src/app/daos/`)
- **Pruebas (TDD teórico):** Diseño conceptual bajo ciclo *Rojo–Verde–Refactorizar*

---

## ⚙️ Requisitos del sistema

### 🧩 Requisitos de software
| Herramienta | Versión recomendada | Descripción |
|--------------|--------------------|--------------|
| **Node.js** | v18.x o superior | Entorno para ejecutar Angular CLI |
| **Angular CLI** | 19.2.17 | Framework frontend |
| **npm** | v9.x o superior | Gestor de dependencias de Node |
| **Java JDK** | 17+ | Generación de recetas médicas (Apache POI) |
| **Apache Maven** | 3.8+ | Compilación del módulo Java |
| **Supabase** | Plataforma cloud | Backend-as-a-Service (base de datos PostgreSQL, autenticación y API REST) |
| **Vercel CLI (opcional)** | última | Despliegue en la nube |

### 🧰 Versiones de Frameworks
| Tecnología | Versión | Uso principal |
|-------------|----------|---------------|
| **Angular** | 19.2.17 | Frontend web |
| **TailwindCSS** | 3.x | Estilos y diseño responsivo |
| **Supabase** | 2.x | Backend-as-a-Service |
| **Java** | 17 | Generación de recetas y lógica adicional |
| **Apache POI** | 5.2.5 | Creación de documentos Word (.docx) |
| **Vercel** | Última | Despliegue del sistema en la nube |

---

## 🚀 Instrucciones para ejecutar el proyecto localmente

### 🔧 1. Clonar el repositorio
```bash
git clone https://github.com/JohanU89-coder/clinica_monteluz.git
cd clinica_monteluz
```

### 📦 2. Instalar dependencias de Angular
```bash
npm install
```

### 🔑 3. Configurar las variables de entorno
Crea un archivo `.env` en la raíz del proyecto con tus claves de Supabase:

```bash
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-clave-anon>
```

### ▶️ 4. Ejecutar el proyecto Angular
```bash
ng serve
```
Abrir en el navegador: [http://localhost:4200](http://localhost:4200)

### 🧾 5. Ejecutar el módulo Java (recetas médicas con Apache POI)
Si deseas generar documentos Word (.docx):

```bash
cd backend/
mvn clean install
mvn spring-boot:run
```

> Esto iniciará el microservicio encargado de la generación de documentos clínicos en formato Word.

---

## 🧩 Implementación de Apache POI
Se integró **Apache POI 5.2.5** para la generación automática de **recetas médicas en formato Word (.docx)**.

**Características implementadas:**
- Creación de documento Word con encabezado institucional.
- Inserción de tablas con datos del paciente, médico y medicamentos.
- Formato profesional con alineaciones y estilos.
- Exportación en memoria (ByteArray) para descarga directa.

**Ventajas:**
- Código abierto (Licencia Apache 2.0).  
- No requiere instalación de Microsoft Office.  
- Total compatibilidad con Word, LibreOffice y Google Docs.  
- Ideal para reportes médicos automatizados.

---

## 🧭 Conclusiones
- Git y GitHub permitieron **organizar el desarrollo** y garantizar control de versiones seguro.  
- El trabajo colaborativo en ramas y PRs evitó conflictos y mejoró la calidad del código.  
- La integración de **Apache POI** amplió el alcance funcional del proyecto, permitiendo generar documentos clínicos desde código Java.  
- El uso de **Angular + Supabase + POI** demostró la viabilidad de construir un sistema completo con tecnologías modernas y buenas prácticas de ingeniería.  
- El proyecto evolucionó de un prototipo académico a una **solución escalable aplicable en entornos reales de salud**.

---

📅 **Curso:** Integrador I  
👨‍🏫 **Docente:** Joan Alfredo Quispe Lizarbe  
📍 **Institución:** Universidad Privada del Norte – Ingeniería de Sistemas e Informática  
🗓️ **Año:** 2025
