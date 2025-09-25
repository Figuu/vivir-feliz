# Funcionalidad del Proyecto - Vivir Feliz

## Descripción General

Sistema integral de gestión para un centro especializado en terapias infantiles que maneja el flujo completo desde la solicitud inicial de consulta hasta el seguimiento del tratamiento, incluyendo gestión de pagos, agendamiento y reportes médicos.

## Consideraciones Importantes del Proyecto

### Arquitectura y Estructura

- **Frontend en Español**: Todas las vistas, textos, diálogos y contenido visible al usuario debe estar completamente en español
- **Código en Inglés**: Variables, funciones, comentarios, nombres de archivos y rutas de API en inglés
- **Mobile Responsive**: Aplicación completamente responsive para móviles, tablets y desktop
- **Estructura de Archivos**: Respetar el uso de `/api`, `/hooks`, `/components`, `/context` según la arquitectura definida
- **Patrones de Desarrollo**: Seguir los patrones establecidos de Next.js App Router, React Query, Prisma ORM

### Roles del Sistema

1. **SUPER_ADMIN**: Gestión financiera y usuarios administrativos
2. **ADMIN**: Gestión operativa completa del centro
3. **THERAPIST**: Terapeutas especializados (incluye coordinadores)
4. **PARENT**: Padres/tutores de pacientes

## Flujo Principal de la Aplicación

### 1. Solicitud Inicial de Consulta/Entrevista

#### Página Pública de Agendamiento

- **Acceso**: Página pública accesible sin autenticación
- **Opciones**:
  - **Consulta**: Con costo (configurable por administrador)
  - **Entrevista**: Gratuita
- **Redirección**: Según selección, redirige a cuestionario específico

#### Cuestionario de Información General

- **Formulario Multi-paso**: Diferentes pasos para consulta vs entrevista
- **Información Solicitada**:
  - Datos del niño/a (nombre, edad, fecha de nacimiento, género)
  - Información de contacto de padres/tutores
  - Dirección y datos escolares
  - Información básica sobre las necesidades del niño/a
- **Validación**: Formularios con validación en tiempo real
- **Guardado**: Posibilidad de guardar progreso en cada paso

#### Selección de Motivos de Consulta (Solo para Consultas)

- **Especialidades**: Selección basada en motivos de consulta
- **Asignación**: Sistema busca terapeutas de la especialidad correspondiente
- **Filtrado**: Solo muestra terapeutas disponibles para consultas

#### Selección de Horario

- **Calendario Dinámico**: Muestra horarios disponibles de terapeutas de la especialidad
- **Configuración**: Tiempo de consulta/entrevista configurable por coordinador
- **Disponibilidad**: Busca espacios libres en horarios de todos los terapeutas de la especialidad
- **Asignación**: Asigna automáticamente al terapeuta disponible

### 2. Proceso de Pago

#### Configuración de Precios

- **Editable por Admin**: Precios de consultas modificables
- **Flexibilidad**: Diferentes precios según tipo de consulta

#### Ventana de Pago

- **Información**: Detalles del pago y consulta
- **Comprobante**: Subida de comprobante (PDF o imagen)
- **Validación**: El administrador debe revisar y confirmar el pago
- **Tiempo Límite**: Sistema permite cancelar si no se confirma el pago en tiempo determinado

### 3. Formulario Médico

#### Llenado por Padres

- **Formulario Multi-paso**: Información específica sobre el niño/a
- **Contenido**:
  - Historial médico detallado
  - Información del desarrollo
  - Ambiente familiar
  - Necesidades especiales
- **Guardado**: Botón de guardar en cada paso para evitar pérdida de información

### 4. Flujo del Terapeuta

#### Configuración de Terapeutas

- **Gestión por Coordinador**: Configurar si terapeuta toma consultas
- **Horarios**: Configuración de horarios de trabajo
- **Especialidades**: Asignación de especialidades

#### Durante la Consulta

- **Revisión de Información**: Acceso a formularios llenados por padres
- **Completar Formulario Médico**: Si no fue completado por padres
- **Formulario de Consulta**: Campos adicionales llenados por terapeuta
- **Hipótesis de Diagnóstico**: Campo específico para diagnóstico inicial
- **Historial Médico**: Toda la información se guarda como parte del historial

### 5. Propuesta Terapéutica

#### Elaboración por Terapeuta

- **Período de Tratamiento**: Selección de duración (2, 3, 6 meses, etc.)
- **Servicios**: Selección de tratamientos y evaluaciones
- **Configuración de Servicios**:
  - Código único
  - Nombre del servicio
  - Número de sesiones predeterminadas
  - Costo por sesión
  - Duración por sesión
  - Especialidad requerida
- **Propuestas A y B**: Diferentes números de sesiones para flexibilidad económica
- **Asignación de Terapeutas**: Filtrado por especialidad del servicio
- **Disponibilidad**: Horarios disponibles de padres y paciente

#### Revisión por Coordinador

- **Vista Completa**: Acceso a toda la información previa
- **Edición de Propuesta**:
  - Modificar período de tratamiento
  - Editar servicios seleccionados
  - Cambiar número de sesiones
  - Modificar terapeutas asignados
  - Ajustar precios por sesión
  - Agregar/eliminar servicios
- **Resúmenes**: Vista de propuestas A y B con totales

#### Aprobación por Administrador

- **Visualización**: Solo lectura de toda la información
- **Descarga PDF**: Generar PDFs de ambas propuestas
- **Confirmación**: Cambio de estado para continuar el flujo

### 6. Aprobación y Pago de Propuesta

#### Gestión de Pagos

- **Tabla de Pagos**: Seguimiento de todos los pagos
- **Planes de Pago**: Mensual o pago único
- **Seguimiento**: Control de pagos pendientes

#### Confirmación por Administrador

- **Selección de Propuesta**: Elegir propuesta A o B seleccionada por padres
- **Forma de Pago**: Confirmar plan de pago
- **Creación de Usuario**: Generar usuario para padre con contraseña
- **Credenciales**: Mostrar credenciales para envío a padres

### 7. Calendarización de Sesiones

#### Vista del Administrador

- **Información del Paciente**: Datos completos y disponibilidad
- **Servicios Asignados**: Lista con número de sesiones y terapeutas
- **Calendario Mensual**: Navegación entre meses
- **Horarios de Terapeutas**: Carga automática de disponibilidad
- **Selección de Sesiones**:
  - Espacios disponibles del terapeuta
  - Duración calculada según servicio
  - Total de sesiones por servicio
- **Confirmación**: Registro en agenda del terapeuta

### 8. Gestión de Terapeutas

#### Vista de Agenda

- **Agenda Semanal**: Todas las sesiones/consultas/entrevistas
- **Estados**: Marcar sesiones como iniciadas/completadas
- **Pacientes**: Vista de todos los pacientes asignados

#### Historial Médico

- **Información Detallada**: Acceso completo al historial
- **Formularios**: Información de padres y consulta inicial
- **Seguimiento**: Historial completo de tratamientos

#### Planes y Reportes

- **Plan Terapéutico**: Después de primera sesión completada
  - Objetivos del tratamiento
  - Antecedentes
  - Métricas de desarrollo
  - Recomendaciones
- **Informe de Progreso**: Después de segunda sesión
  - Actualización de métricas
  - Avances del paciente
  - Información del plan terapéutico
- **Informe Final**: Al completar todas las sesiones
  - Datos completos del tratamiento
  - Actualización final de métricas
  - Comentarios finales

#### Comentarios de Sesiones

- **Por Sesión**: Comentarios específicos de cada sesión
- **Visibilidad**: Mostrados en vista de padres

### 9. Flujo de Coordinador

#### Revisión de Reportes

- **Aprobación/Rechazo**: Revisar todos los reportes de terapeutas
- **Mensajes**: Enviar mensajes de rechazo con correcciones
- **Informe Final Completo**:
  - Recibir aportes de todos los terapeutas
  - Crear informe final consolidado
  - Comentarios generales sobre el paciente

### 10. Panel de Administrador

#### Gestión de Consultas/Entrevistas

- **Confirmación**: Revisar y confirmar pagos
- **Cancelación**: Cancelar por falta de pago

#### Gestión de Terapeutas

- **Registro/Edición**: CRUD completo de terapeutas
- **Especialidades**: Asignación de especialidades
- **Horarios**: Configuración detallada de horarios
  - Horario de trabajo
  - Tiempo de descanso entre sesiones
  - Período de almuerzo/descanso
- **Estado**: Activar/desactivar terapeutas

#### Gestión de Padres/Pacientes

- **Vista General**: Resumen de progreso y pagos
- **Registro Detallado**: Información completa del paciente
- **Documentos**: Subir/editar/eliminar documentos
- **Informes**: Ver informes aprobados por coordinador
- **PDFs**: Generar PDFs de informes

#### Registro de Nuevos Pacientes

- **Formulario Completo**: Toda la información desde solicitud inicial
- **Creación de Usuario**: Generar usuario para padre
- **Flujo Completo**: Desde consulta hasta confirmación de propuesta

#### Agenda General

- **Vista Completa**: Agenda de todos los terapeutas
- **Filtros**: Por paciente, terapeuta, fecha
- **Reprogramación**:
  - Reprogramar sesión individual
  - Cancelar sesión
  - Reprogramar todas las sesiones restantes
- **Reprogramación Automática**:
  - Nueva disponibilidad de padres
  - Frecuencia por semana (1-6 sesiones)
  - Mezcla de servicios
  - Selección automática de horarios
- **Cambio de Terapeuta**: Reprogramación con horarios del nuevo terapeuta

#### Inicio de Flujo desde Dashboard

- **Registro Presencial**: Para padres que llegan al centro
- **Formulario Completo**: Desde datos iniciales hasta pago
- **Selección de Horario**: Asignación directa de consulta

#### Gestión de Contraseñas

- **Restablecimiento**: Para padres y terapeutas

### 11. Panel de Padres

#### Vista de Información

- **Consulta de Datos**: Solo lectura de información
- **Agenda del Paciente**: Vista de sesiones programadas
- **Solicitud de Reprogramación**: Enviar solicitud al administrador

#### Gestión de Pagos

- **Información de Pagos**: Estado de pagos
- **Recordatorios Mensuales**: Avisos para pagos mensuales
- **Comprobantes**: Subir comprobantes de pago

#### Información del Hijo

- **Informes Aprobados**: Plan terapéutico, avances, informe final
- **Información de Sesiones**: Comentarios, horarios, estado

### 12. Retomación de Tratamiento

#### Iniciación por Administrador

- **Nuevo Plan Terapéutico**: Generar directamente para coordinador
- **Historial Completo**: Acceso a todo el historial previo
- **Nueva Propuesta**: Elaborar nueva propuesta terapéutica

### 13. Panel de Super Admin

#### Información Financiera

- **Dashboard Financiero**: Resumen de ingresos y pagos
- **Gestión de Usuarios**: Solo administradores y terapeutas
- **Reportes Financieros**:
  - Todos los pagos realizados
  - Filtros por tipo (consulta inicial, propuestas)
  - Filtros por tiempo
  - Pagos pendientes
  - Montos adeudados

## Características Técnicas Específicas

### Formularios

- **Multi-paso**: Todos los formularios principales son multi-paso
- **Validación**: Validación en tiempo real con mensajes en español
- **Guardado**: Posibilidad de guardar progreso en cada paso
- **Responsive**: Optimizados para dispositivos móviles

### Calendario y Agendamiento

- **Dinámico**: Carga horarios según terapeuta y especialidad
- **Configurable**: Tiempos de sesión configurables
- **Inteligente**: Evita conflictos de horarios
- **Responsive**: Calendario adaptado para móviles

### Sistema de Pagos

- **Flexible**: Múltiples formas de pago
- **Seguimiento**: Control completo de pagos
- **Comprobantes**: Subida y validación de comprobantes
- **Recordatorios**: Sistema automático de recordatorios

### Reportes y Documentos

- **PDFs**: Generación de PDFs con React PDF
- **Aprobación**: Flujo de aprobación por coordinador
- **Historial**: Mantenimiento completo del historial médico
- **Acceso**: Control de acceso por roles

### Responsive Design

- **Mobile-First**: Diseño optimizado para móviles
- **Breakpoints**: Uso de TailwindCSS para responsividad
- **Touch-Friendly**: Interfaces optimizadas para touch
- **Navegación**: Sidebar colapsable y navegación móvil

Esta funcionalidad completa describe un sistema robusto y escalable para la gestión integral de un centro de terapias infantiles, con flujos bien definidos y roles específicos para cada tipo de usuario.
