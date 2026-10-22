/**
 * Textos legales que se leen dentro de la app.
 * Borrador base: conviene que los revise un abogado antes de publicar en las tiendas.
 */
export interface LegalSection {
  title: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS: LegalDocument = {
  title: 'Términos y condiciones',
  updatedAt: '22 de octubre de 2026',
  intro:
    'Estos términos regulan el uso de EntrePanas, la app para organizar intercambios de Amigo Secreto. Al crear una cuenta o usar la app aceptas estas condiciones.',
  sections: [
    {
      title: '1. Qué es EntrePanas',
      body: 'EntrePanas permite crear grupos, invitar participantes, armar listas de deseos, hacer el sorteo del amigo secreto, conversar de forma anónima dentro de cada grupo y revelar los resultados el día del intercambio. La app no vende ni entrega regalos: cada participante compra y entrega el suyo.',
    },
    {
      title: '2. Tu cuenta',
      body: 'Debes dar datos verdaderos y mantener tu contraseña en secreto. Eres responsable de lo que se haga con tu cuenta. Si sospechas que alguien entró sin permiso, cambia tu contraseña desde Perfil y avísanos.',
    },
    {
      title: '3. Grupos y organización',
      body: 'Quien crea un grupo lo organiza: define la fecha, el presupuesto, el cupo, el lugar y las exclusiones, y hace el sorteo. Después del sorteo el presupuesto queda fijo. La organización puede quitar participantes antes del sorteo o eliminar el grupo; en ese caso se borran sus sobres, listas y chat.',
    },
    {
      title: '4. Anonimato',
      body: 'Hasta la revelación, nadie ve a quién le regala cada persona: en el chat y en los comentarios se usan alias. No intentes descubrir ni divulgar la identidad de otros participantes antes de tiempo, ni uses la app para presionar a nadie a revelarla.',
    },
    {
      title: '5. Contenido que publicas',
      body: 'Eres responsable de las fotos, deseos, comentarios y mensajes que publicas. No se permite contenido ofensivo, ilegal, con datos personales de terceros ni que infrinja derechos de autor. Podemos retirar contenido o suspender cuentas que incumplan estas reglas.',
    },
    {
      title: '6. Presupuesto y regalos',
      body: 'El presupuesto es un acuerdo entre los participantes del grupo. EntrePanas no gestiona pagos ni se hace responsable por regalos no entregados, distintos a lo esperado o por desacuerdos entre participantes.',
    },
    {
      title: '7. Disponibilidad',
      body: 'Trabajamos para que la app funcione siempre, pero puede haber interrupciones por mantenimiento o fallas. Podemos actualizar funciones o estos términos; si el cambio es importante te avisaremos en la app o por correo.',
    },
    {
      title: '8. Cancelar tu cuenta',
      body: 'Puedes dejar de usar la app cuando quieras y pedirnos que eliminemos tu cuenta escribiendo desde Perfil › Contáctanos.',
    },
    {
      title: '9. Contacto',
      body: 'Si tienes dudas sobre estos términos, escríbenos desde Perfil › Contáctanos.',
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Política de privacidad',
  updatedAt: '22 de octubre de 2026',
  intro:
    'En EntrePanas cuidamos tus datos y el secreto del intercambio. Aquí explicamos qué información guardamos, para qué la usamos y con quién la compartimos.',
  sections: [
    {
      title: '1. Datos que guardamos',
      body: 'Nombre, correo, teléfono (opcional), foto de perfil, apodo, contraseña cifrada, los grupos en los que participas, tus listas de deseos con sus fotos, comentarios, mensajes del chat y tus preferencias de notificación.',
    },
    {
      title: '2. Para qué los usamos',
      body: 'Para que la app funcione: identificarte, mostrar tus grupos, hacer el sorteo, enviarte avisos (sorteo, invitaciones, comentarios, revelación) y darte soporte. No vendemos tus datos ni los usamos para publicidad de terceros.',
    },
    {
      title: '3. Qué ven los demás',
      body: 'Los miembros de tu grupo ven tu nombre o apodo en la lista del grupo. Quien te regala ve tu lista de deseos sin saber que eres tú, y tú ves a tu pana solo con su alias. En el chat todos usan alias. Las identidades se muestran recién en la revelación.',
    },
    {
      title: '4. Servicios que usamos',
      body: 'Guardamos las imágenes en Cloudinary y enviamos los correos con Mailjet. Estos proveedores procesan los datos solo para prestarnos ese servicio.',
    },
    {
      title: '5. Seguridad',
      body: 'Las contraseñas se guardan cifradas y el acceso a la app se protege con sesiones que puedes cerrar en otros dispositivos al cambiar tu contraseña. Ningún sistema es 100% infalible, pero aplicamos medidas razonables para proteger tu información.',
    },
    {
      title: '6. Cuánto tiempo los guardamos',
      body: 'Mientras tengas tu cuenta. Si eliminas un grupo se borran sus sobres, listas y chat. Si pides eliminar tu cuenta borraremos tus datos, salvo lo que debamos conservar por ley.',
    },
    {
      title: '7. Tus derechos',
      body: 'Puedes ver y corregir tus datos desde Perfil, desactivar los correos y avisos, y pedirnos una copia o la eliminación de tu información escribiendo desde Perfil › Contáctanos.',
    },
    {
      title: '8. Menores de edad',
      body: 'Si un menor usa la app, debe hacerlo con permiso y acompañamiento de su representante.',
    },
  ],
};
