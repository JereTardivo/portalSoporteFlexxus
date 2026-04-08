import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Find-or-create teams by name (preserves IDs on re-run so sessions stay valid)
  async function findOrCreateTeam(name: string) {
    const existing = await prisma.team.findFirst({ where: { name } });
    if (existing) return existing;
    return prisma.team.create({ data: { name } });
  }

  const [eq1, eq2, eq3, eq4, eq5, corralon] = await Promise.all([
    findOrCreateTeam("Equipo 1"),
    findOrCreateTeam("Equipo 2"),
    findOrCreateTeam("Equipo 3"),
    findOrCreateTeam("Equipo 4"),
    findOrCreateTeam("Equipo 5"),
    findOrCreateTeam("Equipo Corralón"),
  ]);
  console.log("✅ Teams ready");

  const pwd = await bcrypt.hash("flexxus2024", 10);

  const allUsers: Array<{ name: string; email: string; role: string; teamId: string | null; diasVacaciones: number }> = [
    // ── ADMINS ─────────────────────────────────────────────────────────────────
    { name: "Maximiliano Wartel",   email: "maximilianow@flexxus.com.ar",       role: "admin", teamId: null,         diasVacaciones: 21 },
    { name: "Gabriela Zurita",      email: "gabrielaz@flexxus.com.ar",          role: "admin", teamId: eq1.id,       diasVacaciones: 21 },
    { name: "Francisco Picone",     email: "franciscop@flexxus.com.ar",         role: "admin", teamId: eq2.id,       diasVacaciones: 21 },
    { name: "Jeremias Tardivo",     email: "jeremiast@flexxus.com.ar",          role: "admin", teamId: eq3.id,       diasVacaciones: 21 },
    { name: "Milton Canal",         email: "milton.canal@flexxus.com.ar",       role: "admin", teamId: eq4.id,       diasVacaciones: 21 },
    { name: "Gonzalo Andines",      email: "gonzalo.andines@flexxus.com.ar",    role: "admin", teamId: eq5.id,       diasVacaciones: 21 },
    { name: "Karina Barzola",       email: "karinab@flexxus.com.ar",            role: "admin", teamId: corralon.id,  diasVacaciones: 21 },
    // ── EQUIPO 1 ────────────────────────────────────────────────────────────────
    { name: "Alan Abella",          email: "alan.abella@flexxus.com.ar",        role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    { name: "Alejandro Gomez",      email: "alejandrog@flexxus.com.ar",         role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    { name: "Facundo Zaracho",      email: "facundo.zaracho@flexxus.com.ar",    role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    { name: "Juan Rico",            email: "juan.rico@flexxus.com.ar",          role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    { name: "Manuel Moyano",        email: "manuelm@flexxus.com.ar",            role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    { name: "Sergio Diaz",          email: "sergio.diaz@flexxus.com.ar",        role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    { name: "Mayra Quevedo",        email: "mayra.quevedo@flexxus.com.ar",      role: "agent", teamId: eq1.id,       diasVacaciones: 15 },
    // ── EQUIPO 2 ────────────────────────────────────────────────────────────────
    { name: "Barbara Bressan",      email: "barbara.bressan@flexxus.com.ar",    role: "agent", teamId: eq2.id,       diasVacaciones: 15 },
    { name: "Candelaria Escudero",  email: "candelaria.escudero@flexxus.com.ar",role: "agent", teamId: eq2.id,       diasVacaciones: 15 },
    { name: "Cristian Ugarte",      email: "cristian.ugarte@flexxus.com.ar",    role: "agent", teamId: eq2.id,       diasVacaciones: 15 },
    { name: "Danny Gomez",          email: "danny.gomez@flexxus.com.ar",        role: "agent", teamId: eq2.id,       diasVacaciones: 15 },
    { name: "Juan Rodas",           email: "juan.rodas@flexxus.com.ar",         role: "agent", teamId: eq2.id,       diasVacaciones: 15 },
    { name: "Naira Bruzzoni",       email: "naira.bruzzoni@flexxus.com.ar",     role: "agent", teamId: eq2.id,       diasVacaciones: 15 },
    // ── EQUIPO 3 ────────────────────────────────────────────────────────────────
    { name: "Agustin Giuliani",     email: "agustin.giuliani@flexxus.com.ar",   role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    { name: "Agustin Masanti",      email: "agustinm@flexxus.com.ar",           role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    { name: "Benjamin De Giorgi",   email: "benjamin.degiorgi@flexxus.com.ar",  role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    { name: "Ignacio Tulian",       email: "ignacio.tulian@flexxus.com.ar",     role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    { name: "Juan Avila",           email: "juan.avila@flexxus.com.ar",         role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    { name: "Juan Castro",          email: "juan.castro@flexxus.com.ar",        role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    { name: "Gonzalo Acevedo",      email: "gonzalo.acevedo@flexxus.com.ar",    role: "agent", teamId: eq3.id,       diasVacaciones: 15 },
    // ── EQUIPO 4 ────────────────────────────────────────────────────────────────
    { name: "Alixis Varela",        email: "alexis.varela@flexxus.com.ar",      role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    { name: "Brenda Fernandez",     email: "brenda.fernandez@flexxus.com.ar",   role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    { name: "Eric Andrada",         email: "eric.andrada@flexxus.com.ar",       role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    { name: "Ignacio Casas",        email: "ignaciohc@flexxus.com.ar",          role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    { name: "Natalia Salas",        email: "natalia.salas@flexxus.com.ar",      role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    { name: "Paola Casalino",       email: "paola.casalino@flexxus.com.ar",     role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    { name: "Priscila Diaz",        email: "priscila.diaz@flexxus.com.ar",      role: "agent", teamId: eq4.id,       diasVacaciones: 15 },
    // ── EQUIPO 5 ────────────────────────────────────────────────────────────────
    { name: "Agustin Ramallo",      email: "agustin.ramallo@flexxus.com.ar",    role: "agent", teamId: eq5.id,       diasVacaciones: 15 },
    { name: "Carol Manzoli",        email: "carol.manzoli@flexxus.com.ar",      role: "agent", teamId: eq5.id,       diasVacaciones: 15 },
    { name: "Gaston Hruby",         email: "gaston.hruby@flexxus.com.ar",       role: "agent", teamId: eq5.id,       diasVacaciones: 15 },
    { name: "Karen Arteaga",        email: "karen.arteaga@flexxus.com.ar",      role: "agent", teamId: eq5.id,       diasVacaciones: 15 },
    { name: "Martin Melendez",      email: "martin.melendez@flexxus.com.ar",    role: "agent", teamId: eq5.id,       diasVacaciones: 15 },
    { name: "Rodrigo Rosello",      email: "rodrigo.rosello@flexxus.com.ar",    role: "agent", teamId: eq5.id,       diasVacaciones: 15 },
    // ── EQUIPO CORRALÓN ─────────────────────────────────────────────────────────
    { name: "Alejandro Orellano",   email: "alejandro.orellano@flexxus.com.ar", role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
    { name: "Debora Silva",         email: "debora.silva@flexxus.com.ar",       role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
    { name: "Elizabeth Orellano",   email: "elizabeth.orellano@flexxus.com.ar", role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
    { name: "Ignacio Olmos",        email: "ignacio.olmos@flexxus.com.ar",      role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
    { name: "Luciana Lepore",       email: "luciana.lepore@flexxus.com.ar",     role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
    { name: "Marcos Gulli",         email: "marcos.gulli@flexxus.com.ar",       role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
    { name: "Gonzalo Benavidez",    email: "gonzalo.benavides@flexxus.com.ar",  role: "agent", teamId: corralon.id,  diasVacaciones: 15 },
  ];

  for (const u of allUsers) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role, teamId: u.teamId, diasVacaciones: u.diasVacaciones },
      create: { name: u.name, email: u.email, password: pwd, role: u.role, teamId: u.teamId, diasVacaciones: u.diasVacaciones },
    });
    console.log(`✅ User upserted: ${u.name} (${u.role})`);
  }

  // Seed precios
  const precios = [
    {
      id: "precio-prem-visita-ph",
      categoria: "premium_basico",
      subtipo: "visita_empresa",
      concepto: "primer_hora",
      label: "Primer Hora",
      valor: 80682,
      orden: 1,
    },
    {
      id: "precio-prem-visita-hr",
      categoria: "premium_basico",
      subtipo: "visita_empresa",
      concepto: "horas_restantes",
      label: "Horas Restantes",
      valor: 48899,
      orden: 2,
    },
    {
      id: "precio-prem-remota",
      categoria: "premium_basico",
      subtipo: "solucion_remota",
      concepto: "valor_hora",
      label: "Valor Hora",
      valor: 48899,
      orden: 3,
    },
    {
      id: "precio-sin-visita-ph",
      categoria: "sin_soporte",
      subtipo: "visita_empresa",
      concepto: "primer_hora",
      label: "Primer Hora",
      valor: 105132,
      orden: 4,
    },
    {
      id: "precio-sin-visita-hr",
      categoria: "sin_soporte",
      subtipo: "visita_empresa",
      concepto: "horas_restantes",
      label: "Horas Restantes",
      valor: 73348,
      orden: 5,
    },
    {
      id: "precio-sin-remota",
      categoria: "sin_soporte",
      subtipo: "solucion_remota",
      concepto: "valor_hora",
      label: "Valor Hora",
      valor: 73348,
      orden: 6,
    },
    {
      id: "precio-alta-rs",
      categoria: "alta_razon_social",
      subtipo: null,
      concepto: "alta",
      label: "Alta de Razón Social",
      valor: 590895,
      orden: 7,
    },
    {
      id: "precio-firebird-micro",
      categoria: "firebird_stack",
      subtipo: null,
      concepto: "micro",
      label: "Firebird 1.5G + Datos 0.5G — 2 CPUs · Sincro 1x día",
      valor: 114742.82,
      orden: 8,
    },
    {
      id: "precio-firebird-pequena",
      categoria: "firebird_stack",
      subtipo: null,
      concepto: "pequeña",
      label: "Firebird 2G + Datos 0.5G — 2 CPUs · Sincro 1x día",
      valor: 123326.69,
      orden: 9,
    },
    {
      id: "precio-firebird-mediano",
      categoria: "firebird_stack",
      subtipo: null,
      concepto: "mediano",
      label: "Firebird 4G + Datos 0.5G — 3 CPUs · Sincro 2x día",
      valor: 147735.58,
      orden: 10,
    },
  ];

  for (const precio of precios) {
    await prisma.precioSoporte.upsert({
      where: { id: precio.id },
      update: { valor: precio.valor },
      create: precio,
    });
  }
  console.log("✅ Precios seeded");

  // Seed respuestas rápidas — limpiar y recargar
  await prisma.respuestaRapida.deleteMany();

  const respuestas = [
    // ── RESPUESTAS GENERALES ──────────────────────────────────────────────────
    {
      segmento: "Respuestas Generales",
      titulo: "Primera Respuesta",
      detalle:
        "Estimado Cliente,\n\nHemos recibido su solicitud y queremos agradecerle por contactarnos.\n\nNuestro equipo está revisando su caso y, en caso de requerir información adicional, nos pondremos en contacto con usted para asegurarnos de brindarle una solución lo más pronto posible.\n\nQuedamos a su disposición para cualquier consulta adicional.\n\nSaludos cordiales,\n\nEquipo de Soporte",
      orden: 1,
    },
    {
      segmento: "Respuestas Generales",
      titulo: "Solicitar Conexión",
      detalle:
        "Estimado Cliente,\n\nPara revisar el inconveniente reportado, necesitamos conectarnos a una de sus PC, preferiblemente la que actúa como Servidor.\n\nRealizaremos la conexión a través de TeamViewer. Le solicitamos que nos proporcione los datos de acceso (ID y Contraseña).\n\nSi aún no tiene la aplicación instalada, puede descargarla desde el siguiente enlace:\nhttps://download.teamviewer.com/download/TeamViewer_Host_Setup_x64.exe\n\nQuedamos atentos a su respuesta para proceder.\n\nSaludos cordiales,\n\nEquipo de Soporte",
      orden: 2,
    },
    {
      segmento: "Respuestas Generales",
      titulo: "Cierre de Ticket",
      detalle:
        "Estimado/a cliente:\n\nMENSAJE\n\nSaludos cordiales,\n\n[Nombre del Agente]",
      orden: 3,
    },

    // ── RESPUESTAS A ACTUALIZACIONES ─────────────────────────────────────────
    {
      segmento: "Actualizaciones",
      titulo: "Actualizar Sistema",
      detalle:
        "Estimado Cliente,\n\nNos complace informarle que ya se encuentra disponible la versión que soluciona el inconveniente reportado. Para implementarla, será necesario realizar una actualización de su sistema local.\n\nPor favor, indíquenos el día y horario en que podríamos llevar a cabo esta tarea. Le recordamos que las actualizaciones se realizan de lunes a jueves, entre las 08:00 y las 22:00 horas.\n\nQuedamos atentos a su respuesta para coordinar la actualización.\n\nSaludos cordiales,\n[Nombre del Agente]",
      orden: 4,
    },
    {
      segmento: "Actualizaciones",
      titulo: "Actualización Realizada",
      detalle:
        "Estimado Cliente,\n\nLe informamos que la actualización del sistema se realizó correctamente y sin inconvenientes.\n\nEn este sentido, le solicitamos por favor validar el caso reportado y confirmarnos si el comportamiento observado ha quedado resuelto tras la actualización.\n\nQuedamos a disposición ante cualquier consulta adicional.\n\nSaludos cordiales,\n[Nombre del Agente]",
      orden: 5,
    },
    {
      segmento: "Actualizaciones",
      titulo: "Falta de Respuesta — Actualización",
      detalle:
        "Estimado Cliente,\n\nHasta la fecha, no hemos recibido su respuesta para coordinar la actualización necesaria para resolver el inconveniente.\n\nDado el tiempo transcurrido, nos vemos en la necesidad de cerrar el caso. No obstante, le recordamos que puede solicitar la actualización en cualquier momento que lo requiera.\n\nAgradecemos su comprensión y quedamos a su disposición.\n\nSaludos cordiales, [Nombre del Agente]",
      orden: 6,
    },

    // ── CLIENTES POR CASOS Y SIN SOPORTE ─────────────────────────────────────
    {
      segmento: "Clientes Por Casos y Sin Soporte",
      titulo: "Primera Respuesta — Por Casos",
      detalle:
        "Estimado Cliente,\n\nEs un gusto poder asesorarlo. Con relación a su solicitud, no se preocupe, estamos aquí para ayudarle a revisar el inconveniente.\n\nLe informamos que, debido al tipo de soporte contratado, no contamos con la posibilidad de comunicarnos telefónicamente, por lo que este medio será nuestra vía exclusiva de contacto. Le solicitamos que describa el inconveniente de la forma más detallada y comprensible posible. Además, tiene la opción de adjuntar archivos relevantes como imágenes, documentos o videos que puedan ayudarnos en el análisis.\n\nComo primer paso, necesitamos confirmar si lo reportado se trata de un inconveniente o error del sistema.\n\nQuedamos atentos a su respuesta para avanzar con la revisión.\n\nSaludos cordiales,\nEquipo de Soporte",
      orden: 7,
    },
    {
      segmento: "Clientes Por Casos y Sin Soporte",
      titulo: "Cotización Consulta — Por Casos",
      detalle:
        "Estimado Cliente,\n\nEn relación a su solicitud, no se preocupe, estamos en condiciones de revisar el tema planteado. Sin embargo, antes de avanzar, y debido al tipo de soporte contratado, es necesario cotizar la consulta, ya que no se trata de un error de sistema.\n\nEl costo de esta consulta es de $XX.XXX + IVA, y tiene una validez de 5 (cinco) días a partir de la fecha de este mensaje.\n\nPor favor, indíquenos si desea proceder para avanzar con el análisis.\n\nSaludos cordiales,\n[Nombre del Agente]",
      orden: 8,
    },
    {
      segmento: "Clientes Por Casos y Sin Soporte",
      titulo: "Cliente Sin Soporte",
      detalle:
        "Estimado Cliente:\n\nLe recuerdo que, al no contar con el servicio de Mesa de Ayuda contratado, en caso de precisarla para poder solucionar inconvenientes en el sistema se presupuestará la tarea a realizar.\n\nEl valor hora es de $ + IVA, no fraccionable.\n\nSaludos,\n\nNombre Agente",
      orden: 9,
    },

    // ── TIEMPOS DE RESPUESTA ──────────────────────────────────────────────────
    {
      segmento: "Tiempos de Respuesta",
      titulo: "Solicitud de Respuesta",
      detalle:
        "Estimado Cliente,\n\nLe recordamos que estamos a la espera de una respuesta referente a esta solicitud. Le solicitamos revisar la información proporcionada en nuestra comunicación anterior.\n\nEn caso de no recibir novedades en breve, el caso será cerrado por inactividad.\n\nQuedamos atentos a su respuesta.\n\nSaludos cordiales,\n\nEquipo de Soporte",
      orden: 10,
    },
    {
      segmento: "Tiempos de Respuesta",
      titulo: "Cierre por Falta de Respuesta",
      detalle:
        "Estimado Cliente,\n\nDamos por cerrada esta solicitud debido a que, hasta la fecha, no hemos recibido una respuesta de su parte respecto al inconveniente reportado.\n\nLe recordamos que, si lo desea, puede abrir una nueva solicitud en cualquier momento. Podrá realizar la misma consulta o reportar el mismo incidente, haciendo referencia al número de este ticket.\n\nAgradecemos su comprensión y quedamos a su disposición para futuras consultas.\n\nSaludos cordiales,\n[Nombre del Agente]",
      orden: 11,
    },
    {
      segmento: "Tiempos de Respuesta",
      titulo: "Falta de Aprobación a Solución",
      detalle:
        "Estimado cliente,\n\nLe recordamos que el ticket se encuentra resuelto conforme a lo indicado en nuestra última respuesta. Actualmente está pendiente de su aprobación/cierre desde la mesa de ayuda.\n\nLe pedimos, por favor, que pueda revisarlo y confirmarnos si la solución brindada es correcta, o bien indicarnos si necesita alguna aclaración adicional para poder asistirlo.\n\nQuedamos atentos a su confirmación para dar cierre al caso.\n\nSaludos cordiales.\n\nEquipo de Soporte",
      orden: 12,
    },

    // ── DERIVACIONES A OTRAS ÁREAS ────────────────────────────────────────────
    {
      segmento: "Derivaciones",
      titulo: "Tarea Partner",
      detalle:
        "Estimado Cliente,\n\nLe informamos que la realización de este tipo de tareas adicionales al soporte es gestionada directamente por el Partner, en este caso, X.\n\nHemos derivado el ticket al Partner para que continúen con la gestión de su caso.\n\nQuedamos a su disposición para cualquier consulta adicional.\n\nSaludos cordiales,\n\nEquipo de Soporte",
      orden: 13,
    },
    {
      segmento: "Derivaciones",
      titulo: "Tarea Partner — Cliente Por Casos",
      detalle:
        "Estimado cliente:\n\nLe informamos que, conforme al tipo de soporte que posee contratado, no cuenta con servicio de consultoría del sistema. Dicha gestión es realizada directamente por el Partner asignado, en este caso, X.\n\nHemos derivado el ticket al Partner para que continúe con el seguimiento de su caso.\n\nQuedamos a su disposición ante cualquier consulta adicional.\n\nSaludos cordiales,\nEquipo de Soporte",
      orden: 14,
    },
    {
      segmento: "Derivaciones",
      titulo: "Falta Certificado — Derivar a Administración",
      detalle:
        "Estimado Cliente:\n\nHemos notado que aún no se ha generado el nuevo certificado de licencia. Por este motivo, derivamos el caso al Área de Administración para que revisen su situación.\n\nLe recordamos que el sistema Flexxus emite un aviso con 10 días de anticipación al vencimiento de la licencia. Cada vez que se ingresa al sistema, se notifica cuántos días faltan para dicho vencimiento. Durante ese período, el cliente debe comunicarse con el equipo de soporte en caso de que el cartel de advertencia continúe apareciendo, a fin de resolver la situación antes de que se vea afectado el funcionamiento del sistema.\n\nQuedamos atentos a cualquier consulta adicional.\n\nSaludos cordiales,\nEquipo de Soporte",
      orden: 15,
    },
    {
      segmento: "Derivaciones",
      titulo: "Derivar a Garantía",
      detalle:
        "Estimado Cliente:\n\nHemos finalizado la validación funcional de lo reportado, por lo que derivamos el caso al área de mantenimiento de producto para que se corrobore dicha situación en la programación del sistema.\n\nSaludos,\n\nEquipo de Soporte",
      orden: 16,
    },
    {
      segmento: "Derivaciones",
      titulo: "Derivar a PROCOM",
      detalle:
        "Estimado Cliente,\n\nEl inconveniente en cuestión corresponde al Área encargada del mantenimiento de Datacenter. Deben de ponerse en contacto con PROCOM para que les den una solución llamando al número: 0351-5691101.\n\nSe deriva la solicitud bajo el Nro. de Caso:\n\nQuedamos atentos a cualquier consulta adicional.\n\nSaludos cordiales,\nEquipo de Soporte",
      orden: 17,
    },
    {
      segmento: "Derivaciones",
      titulo: "Derivar a Desarrollo",
      detalle:
        "Estimado Cliente,\n\nActualmente, la funcionalidad que usted solicita no está disponible en el sistema. Para incorporar dicha funcionalidad, será necesario solicitarla al Área de Producto como un Desarrollo de Nueva Funcionalidad, siguiendo los pasos detallados en la imagen adjunta.\n\nAgradecemos su comprensión y quedamos atentos a cualquier consulta adicional.\n\nSaludos cordiales,\n\nEquipo de Soporte",
      orden: 18,
    },

    // ── PASO A SOPORTE ────────────────────────────────────────────────────────
    {
      segmento: "Paso a Soporte",
      titulo: "Paso a Soporte",
      detalle:
        "Estimado cliente,\n\nLe confirmamos que, a partir de ahora, su servicio deja de ser atendido por el área de Postimplementación y pasa a gestionarse directamente desde el área de Soporte.\n\nEn esta nueva etapa contará con un equipo dedicado de 8 agentes, liderado por quien suscribe, y conformado por:\n\n• Jeremías Tardivo (Líder de Equipo)\n• Agustín Masanti\n• Gonzalo Acevedo\n• Juan Castro\n• Benjamín De Giorgi\n• Ignacio Tulian\n• Agustín Giuliani\n• Juan Cruz Ávila\n\nLos canales de comunicación se mantienen sin cambios:\n• Atención telefónica: 0810-122-9987\n• Mesa de ayuda: soporte.flexxus.com.ar (con sus usuarios habituales).\nEn caso de requerir nuevos accesos, podrán solicitarlos por los mismos medios.\n\nLe damos la bienvenida al equipo de soporte y quedamos a disposición para acompañarlos en el día a día, brindando asistencia cada vez que lo necesiten dentro de Flexxus.\n\nSaludos cordiales,\n\nIng. Jeremías Tardivo\nLíder de Equipo de Soporte",
      orden: 19,
    },
  ];

  for (const r of respuestas) {
    await prisma.respuestaRapida.create({ data: r });
  }
  console.log("✅ Respuestas rápidas seeded");

  // Seed valores de tareas
  const tareas = [
    { id: "tarea-01", nombre: "INSTALACION SERVIDOR",                          premium: "4",          basico: "4",          porCasos: "4",          sinSoporte: "4",          orderAdvanced: "4",          orden: 1  },
    { id: "tarea-02", nombre: "RAZON SOCIAL ADICIONAL EN INSTALACION",          premium: "1",          basico: "1",          porCasos: "1",          sinSoporte: "1",          orderAdvanced: "1",          orden: 2  },
    { id: "tarea-03", nombre: "INSTALACION PUESTO",                             premium: "-",          basico: "-",          porCasos: "1",          sinSoporte: "1",          orderAdvanced: "1",          orden: 3  },
    { id: "tarea-04", nombre: "DISEÑO DE IMPRESIÓN",                            premium: "COTIZACION", basico: "COTIZACION", porCasos: "COTIZACION", sinSoporte: "COTIZACION", orderAdvanced: "COTIZACION", orden: 4  },
    { id: "tarea-05", nombre: "REACONDICIONAR IMPRESIÓN",                       premium: "-",          basico: "-",          porCasos: "1",          sinSoporte: "1",          orderAdvanced: "1",          orden: 5  },
    { id: "tarea-06", nombre: "FACTURA ELECTRONICA DESDE CERO",                 premium: "4",          basico: "4",          porCasos: "4",          sinSoporte: "4",          orderAdvanced: "4",          orden: 6  },
    { id: "tarea-07", nombre: "FACTURA ELECTRONICA CON BACKUP",                 premium: "2",          basico: "2",          porCasos: "2",          sinSoporte: "2",          orderAdvanced: "3",          orden: 7  },
    { id: "tarea-08", nombre: "CONSULTA A MEDIDA",                              premium: "COTIZACION", basico: "COTIZACION", porCasos: "COTIZACION", sinSoporte: "COTIZACION", orderAdvanced: "COTIZACION", orden: 8  },
    { id: "tarea-09", nombre: "ALTA RAZON SOCIAL",                              premium: "VALOR FIJO", basico: "VALOR FIJO", porCasos: "VALOR FIJO", sinSoporte: "VALOR FIJO", orderAdvanced: "VALOR FIJO", categoriaEspecial: "alta_razon_social", orden: 9  },
    { id: "tarea-10", nombre: "ALTA SUCURSAL",                                  premium: "8",          basico: "8",          porCasos: "8",          sinSoporte: "8",          orderAdvanced: "-",          orden: 10 },
    { id: "tarea-11", nombre: "PARTICULARIDADES DE ALTA DE RAZON SOCIAL",       premium: "COTIZACION", basico: "COTIZACION", porCasos: "COTIZACION", sinSoporte: "COTIZACION", orderAdvanced: "COTIZACION", orden: 11 },
    { id: "tarea-12", nombre: "MIGRACION",                                      premium: "COTIZACION", basico: "COTIZACION", porCasos: "COTIZACION", sinSoporte: "COTIZACION", orderAdvanced: "COTIZACION", orden: 12 },
    { id: "tarea-13", nombre: "SERVIDOR DE IMPRESIÓN FISCAL",                   premium: "-",          basico: "-",          porCasos: "1",          sinSoporte: "1",          orderAdvanced: "1",          orden: 13 },
    { id: "tarea-14", nombre: "INICIALIZACION MULTIEMPRESA - A CERO",           premium: "10",         basico: "10",         porCasos: "10",         sinSoporte: "10",         orderAdvanced: "10",         orden: 14 },
    { id: "tarea-15", nombre: "INICIALIZACION MULTIEMPRESA - A FECHA",          premium: "20",         basico: "20",         porCasos: "20",         sinSoporte: "20",         orderAdvanced: "20",         orden: 15 },
    { id: "tarea-16", nombre: "USUARIO DE LECTURA BD",                          premium: "3",          basico: "3",          porCasos: "3",          sinSoporte: "3",          orderAdvanced: "3",          orden: 16 },
    { id: "tarea-17", nombre: "ALTA PUNTO DE VENTA",                            premium: "-",          basico: "-",          porCasos: "1",          sinSoporte: "1",          orderAdvanced: "1",          orden: 17 },
  ];

  for (const t of tareas) {
    await prisma.tareaValor.upsert({
      where: { id: t.id },
      update: { premium: t.premium, basico: t.basico, porCasos: t.porCasos, sinSoporte: t.sinSoporte, orderAdvanced: (t as any).orderAdvanced ?? "-", categoriaEspecial: (t as any).categoriaEspecial ?? null },
      create: t,
    });
  }
  console.log("✅ Valores de tareas seeded");

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
