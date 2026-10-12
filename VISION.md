# Visión — App móvil de gestión de hostelería (Flutter)

## 1. Qué es

Intranet móvil de uso diario para trabajadores de bares/restaurantes: listas de
producción editables, listas de la compra (diaria/semanal) y el resto de
herramientas que hoy existen en la web (proveedores, horario, usuarios),
pero construida desde el principio para que **cualquier persona pueda dar de
alta su propio negocio** y gestionar el acceso de su equipo mediante roles.

Es la evolución de la web actual (`index.html`, `produccion-*.html`,
`compra-*.html`, `proveedores.html`, `horario.html`, `usuarios.html` +
Firebase Auth/Firestore), que hoy tiene el modelo de datos **hardcodeado**
a dos sedes fijas (La Guaracha / La Corrala). El salto principal no es solo
de plataforma (web → Flutter), es de arquitectura (fijo → multi-tenant).

## 2. Decisiones tomadas

- **Backend**: se mantiene Firebase (Auth + Firestore). Se reescriben el
  modelo de datos y las Security Rules desde cero para multi-tenancy; se
  añaden Cloud Functions para la lógica sensible (alta de organización,
  invitaciones, cambios de rol) en vez de dejarlo todo en el cliente.
- **Datos iniciales**: La Guaracha y La Corrala serán la primera
  organización real de la nueva app, migrando sus datos actuales
  (producción, compra, proveedores) al nuevo modelo.
- **Plataformas**: solo móvil (Android/iOS) en esta primera fase. Flutter
  permite añadir Web más adelante sin rehacer la arquitectura.
- **Permisos**: 3 roles fijos para empezar — **Propietario**, **Encargado
  de local**, **Empleado** — con capacidades ya definidas por rol (no hay
  editor de permisos granular en v1; se puede añadir después si hace falta).

## 3. Modelo de datos (Firestore)

```
organizaciones/{orgId}
  nombre, creadoPor, creadoEn

organizaciones/{orgId}/locales/{localId}
  nombre (ej. "La Guaracha", "La Corrala")

organizaciones/{orgId}/miembros/{uid}
  rol: propietario | encargado | empleado
  locales: [localId, ...]   // a qué locales tiene acceso
  activo: true/false
  email

organizaciones/{orgId}/invitaciones/{inviteId}
  email, rol, locales, estado: pendiente|aceptada|expirada

organizaciones/{orgId}/locales/{localId}/produccion/{listaId}
  columnas: [...]  // mismo formato que hoy (items con done/text)

organizaciones/{orgId}/locales/{localId}/compra/{listaId}
  columnas: [...]  // igual que hoy (qty, unit, proveedor)

organizaciones/{orgId}/locales/{localId}/historialCompras/{entradaId}

organizaciones/{orgId}/proveedores/{proveedorId}
  // proveedores pueden ser de organización completa o por local

organizaciones/{orgId}/locales/{localId}/horario/{turnoId}
```

Un usuario (`users/{uid}`) puede pertenecer a varias organizaciones (ej. si
trabaja en dos negocios distintos); al entrar a la app eligen/recuerdan la
organización activa.

## 4. Roles y capacidades (v1)

| Capacidad                         | Propietario | Encargado | Empleado |
|------------------------------------|:---:|:---:|:---:|
| Gestionar organización/locales     | ✅ | ❌ | ❌ |
| Invitar / dar de baja usuarios     | ✅ | ✅ (su local) | ❌ |
| Editar producción de su local      | ✅ | ✅ | ✅ |
| Editar compra de su local          | ✅ | ✅ | ✅ |
| Ver/editar horario de personal     | ✅ | ✅ (su local) | 👀 solo lectura |
| Gestionar proveedores              | ✅ | ✅ | 👀 solo lectura |

El empleado solo ve los locales a los que está asignado.

## 5. Stack técnico

- **Flutter** (Dart), arquitectura feature-first: `auth/`, `organizaciones/`,
  `produccion/`, `compra/`, `proveedores/`, `horario/`.
- **Firebase**: Auth, Firestore (sync en tiempo real + caché offline),
  Cloud Functions (altas/invitaciones/roles), Cloud Messaging (notificaciones).
- **Riverpod** para estado.
- **Firestore Security Rules** como única barrera real de seguridad
  multi-tenant: un usuario solo puede leer/escribir dentro de las
  organizaciones donde figura como miembro activo, y según su rol.

## 6. Fases de construcción

1. **Fundamentos**: proyecto Flutter + Firebase, Auth, modelo multi-tenant,
   alta de organización + locales, roles e invitaciones, Security Rules.
2. **Producción**: checklist editable por local (migrando la lógica actual).
3. **Compra**: listas diaria/semanal por categoría + archivo/historial.
4. **Resto de módulos**: proveedores, horario, gestión de miembros desde la app.
5. **Migración de datos**: importar el contenido actual de La Guaracha /
   La Corrala al nuevo modelo.
6. **Pulido**: notificaciones push, offline robusto, posible Flutter Web.
