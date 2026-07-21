// Motor de Score de Rubro (0-40 puntos)
// Ponderación: 40% del score total
// Versión 3.0 — Keywords maximizadas con vocabulario real de ChileCompra/MercadoPublico

export const RUBRO_KEYWORDS: Record<string, string[]> = {

  // ─────────────────────────────────────────────────────────────────────
  // 1. TECNOLOGÍA
  // ─────────────────────────────────────────────────────────────────────
  'Tecnología': [
    // Software y desarrollo
    'software', 'sistema', 'sistema informático', 'sistema de información', 'plataforma',
    'aplicación', 'app', 'aplicativo', 'módulo', 'portal', 'portal web', 'sitio web',
    'desarrollo web', 'desarrollo de software', 'programación', 'código fuente',
    'api', 'servicio web', 'integración de sistemas', 'interfaz', 'frontend', 'backend',
    'base de datos', 'base de dato', 'servidor de base de datos', 'sql', 'postgresql',
    // Infraestructura TI
    'servidor', 'datacenter', 'data center', 'nube', 'cloud', 'hosting', 'colocation',
    'virtualización', 'contenedor', 'microservicio', 'kubernetes', 'docker',
    'red', 'red informática', 'infraestructura de red', 'switch', 'router', 'firewall',
    'acceso a internet', 'conectividad', 'banda ancha', 'fibra óptica', 'enlace dedicado',
    // Equipos
    'computador', 'computadora', 'laptop', 'notebook', 'pc', 'desktop', 'all in one',
    'tablet', 'servidor físico', 'rack', 'ups', 'impresora', 'multifuncional',
    'scanner', 'proyector', 'pantalla', 'monitor', 'periférico', 'teclado', 'mouse',
    // Seguridad informática
    'ciberseguridad', 'seguridad informática', 'antivirus', 'firewall', 'ids', 'ips',
    'penetración', 'ethical hacking', 'auditoría de seguridad', 'backup', 'respaldo',
    'recuperación ante desastres', 'continuidad operacional', 'cifrado', 'vpn',
    // Sistemas empresariales
    'erp', 'crm', 'hrm', 'sgd', 'sistema de gestión documental', 'sistema de gestión',
    'sistema contable', 'sistema de remuneraciones', 'sistema de control',
    'sistema de monitoreo', 'sistema de trazabilidad', 'plataforma de gestión',
    'plataforma digital', 'digitalización', 'transformación digital',
    // Mantenimiento y soporte TI
    'soporte técnico', 'soporte informático', 'help desk', 'mesa de ayuda',
    'mantención de sistema', 'mantención de software', 'mantención de equipos computacionales',
    'actualización de software', 'migración de datos', 'migración de sistema',
    'implementación de sistema', 'puesta en marcha', 'licencia', 'licenciamiento',
    'suscripción de software', 'office', 'microsoft', 'google workspace',
    // Comunicaciones y redes
    'telefonía ip', 'central telefónica', 'videoconferencia', 'telepresencia', 'zoom',
    'teams', 'correo electrónico', 'dominio', 'certificado ssl', 'dns',
    'telefonía celular', 'plan de datos', 'dispositivo móvil', 'smartphone', 'radio ip',
    // Datos e IA
    'análisis de datos', 'business intelligence', 'bi', 'big data', 'machine learning',
    'inteligencia artificial', 'ia', 'dashboard', 'reportería', 'visualización de datos',
    'ti', 'tic', 'tecnología de la información',
    // Vocabulario real de licitaciones de TI (ChileCompra)
    'soc', 'centro de operaciones de seguridad', 'xdr', 'siem', 'edr',
    'gobernanza de datos', 'modernización tecnológica', 'modernización informática',
    'equipamiento informático', 'suministro de equipamiento', 'adquisición de equipamiento',
    'toner', 'tóner', 'notebooks', 'notebook', 'proyector de aula',
    'sitio web institucional', 'portal institucional', 'intranet',
    'sistema de videoconferencia', 'sala de videoconferencia',
    'licencias microsoft', 'office 365', 'google workspace', 'adobe',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 2. CONSTRUCCIÓN
  // ─────────────────────────────────────────────────────────────────────
  'Construcción': [
    // Obras civiles mayores
    'construcción', 'obra civil', 'edificación', 'edificio', 'infraestructura vial',
    'pavimentación', 'repavimentación', 'pavimento', 'asfalto', 'carpeta asfáltica',
    'camino', 'ruta', 'vía', 'calle', 'vereda', 'acera', 'pasaje',
    'puente', 'pasarela', 'muro de contención', 'talud', 'terraplén',
    'alcantarillado', 'colector', 'zanja', 'evacuación aguas lluvias', 'dren',
    'urbanización', 'loteo', 'parcelación', 'ciudad', 'barrio',
    'plaza', 'parque', 'bandejón', 'multicancha', 'estadio', 'piscina',
    // Obras menores / mantención / reparación de inmuebles
    'reparación', 'reemplazo', 'instalación', 'reposición', 'habilitación',
    'mejoramiento', 'restauración', 'refacción', 'remodelación', 'rehabilitación',
    'normalización', 'adecuación', 'acondicionamiento', 'readecuación',
    'ampliación', 'extensión', 'modificación', 'demolición', 'retiro',
    'mantención', 'mantenimiento', 'mantención correctiva', 'mantención preventiva',
    'contrato de mantención', 'servicio de mantención',
    // Elementos constructivos — cerramientos y fachada
    'ventana', 'termopanel', 'vidrio', 'vidriería', 'mampara', 'puerta', 'portón',
    'reja', 'cierre perimetral', 'malla', 'cerco', 'muralla', 'cortafuego',
    'fachada', 'revestimiento', 'revestimiento exterior', 'revestimiento interior',
    'cladding', 'aluzinc', 'zinc', 'panel', 'panel sándwich', 'aislación', 'lana mineral',
    // Techumbre y cubierta
    'techo', 'techado', 'cubierta', 'teja', 'zinc ondulado', 'losa', 'membrana',
    'impermeabilización', 'impermeabilizante', 'sello', 'sellado', 'goteras',
    'cumbrera', 'bajada de aguas', 'canaleta', 'canal de aguas lluvias',
    // Estructura
    'estructura metálica', 'estructura de acero', 'perfil metálico', 'viga',
    'pilar', 'columna', 'fundación', 'cimiento', 'losa de fundación',
    'hormigón', 'hormigón armado', 'radier', 'solera', 'cama de ripio',
    'moldaje', 'enfierradura', 'armadura',
    // Pisos y revestimientos interiores
    'piso', 'baldosa', 'cerámico', 'porcelanato', 'parquet', 'piso flotante',
    'vinílico', 'alfombra', 'revestimiento de piso', 'nivelación de piso',
    // Cielos y tabiques
    'cielo', 'cielo falso', 'cielo americano', 'tabique', 'tabiquería', 'drywall',
    'planchas de yeso', 'estuco', 'enlucido', 'pintura interior', 'pintura exterior',
    // Instalaciones de edificios (sanitaria, eléctrica)
    'instalación eléctrica', 'red eléctrica', 'tablero eléctrico', 'empalme',
    'instalación sanitaria', 'red de agua potable', 'red de alcantarillado',
    'gasfitería', 'plomería', 'cañería', 'tubería', 'fitting', 'llave de paso',
    'grifo', 'medidor de agua', 'arranque de agua potable',
    'climatización', 'calefacción', 'caldera', 'radiador', 'piso radiante',
    'ventilación', 'aire acondicionado', 'split', 'fancoil', 'ductería',
    'extintor', 'red húmeda', 'red seca', 'rociador', 'sprinkler',
    // Escaleras, ascensores y accesibilidad
    'escalera', 'rampa', 'accesibilidad', 'baño universal', 'ascensor', 'elevador',
    // Carpintería y terminaciones
    'carpintería', 'carpintería de madera', 'carpintería metálica', 'aluminio',
    'perfil de aluminio', 'cierre de aluminio', 'mueble de cocina', 'closet',
    'guardarropa', 'estantería', 'locker',
    // Ingeniería de obra
    'inspección técnica de obra', 'ito', 'supervisión de obra', 'administración de obra',
    'cubicación', 'cómputo de materiales', 'presupuesto de obra',
    'estudio de mecánica de suelos', 'sondaje', 'calicata', 'topografía',
    // Entorno urbano
    'juegos infantiles', 'mobiliario urbano', 'bancas', 'luminaria', 'poste',
    'señalética vial', 'demarcación', 'semáforo', 'guarda vía', 'tachas',
    'jardín', 'área verde', 'pasto', 'árbol', 'plantación',
    'berma', 'cuneta', 'sumidero',
    // Verbos de acción frecuentes en licitaciones de construcción
    'conservación', 'conservacion', 'conservación de ruta', 'conservación periódica',
    'conservación integral', 'obras de conservación', 'obras de invierno',
    'ejecución de obras', 'contrato de obras', 'contrato de construcción',
    'adquisición e instalación',
    // Establecimientos frecuentes en licitaciones de construcción
    'cesfam', 'ccr', 'cosam', 'cecof', 'sapu', 'posta',
    'sala modular', 'salas modulares', 'sala de clases', 'pabelón',
    'jardin infantil', 'jardín infantil', 'sala cuna',
    'liceo', 'escuela', 'colegio', 'establecimiento educacional', 'establecimiento educativo',
    'modular', 'módulo habitacional', 'módulo sanitario',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 3. CONSULTORÍA
  // ─────────────────────────────────────────────────────────────────────
  'Consultoría': [
    'consultoría', 'consultor', 'asesoría', 'asesor', 'asistencia técnica',
    'acompañamiento técnico', 'apoyo técnico', 'apoyo profesional',
    'estudio', 'diagnóstico', 'diagnóstico organizacional', 'diagnóstico técnico',
    'levantamiento', 'levantamiento de información', 'levantamiento de procesos',
    'análisis', 'análisis técnico', 'análisis organizacional', 'análisis de riesgo',
    'evaluación', 'evaluación de impacto', 'evaluación de proyectos', 'evaluación técnica',
    'plan estratégico', 'planificación estratégica', 'plan de negocio',
    'plan de desarrollo', 'plan de mejora', 'hoja de ruta', 'roadmap',
    'auditoría', 'auditoría de procesos', 'auditoría de gestión', 'auditoría técnica',
    'diseño organizacional', 'rediseño de procesos', 'bpr', 'lean',
    'modelo de gestión', 'modelo operativo', 'modelo de negocios',
    'indicadores de gestión', 'kpi', 'cuadro de mando', 'balanced scorecard',
    'elaboración de política', 'política pública', 'marco regulatorio',
    'informe técnico', 'sistematización', 'documentación de procesos',
    'gestión de proyectos', 'pmo', 'metodología de proyectos', 'agile', 'scrum',
    'coaching ejecutivo', 'mentoría', 'facilitación',
    'monitoreo y evaluación', 'seguimiento', 'evaluación de desempeño',
    'propuesta técnica', 'línea de base', 'marco lógico',
    // Vocabulario real (ChileCompra)
    'pladeco', 'plan de desarrollo comunal', 'plan regulador comunal',
    'formulación de proyectos', 'inversión pública', 'fndr',
    'asesoría técnica', 'asistencia técnica profesional',
    'mejora de procesos', 'gestión organizacional',
    'estudio de factibilidad', 'factibilidad técnica',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 4. SALUD
  // ─────────────────────────────────────────────────────────────────────
  'Salud': [
    // Establecimientos
    'salud', 'hospital', 'clínica', 'cesfam', 'sapu', 'posta rural', 'crs',
    'servicio de salud', 'atención primaria', 'atención de salud',
    // Medicamentos e insumos
    'fármaco', 'medicamento', 'droga', 'vacuna', 'suero', 'inyectable',
    'antibiótico', 'analgésico', 'anestésico', 'sedante', 'insulina',
    'insumo médico', 'insumo clínico', 'insumo hospitalario', 'material médico',
    'guante', 'mascarilla', 'gafas', 'delantal', 'bioseguridad', 'epp médico',
    'jeringa', 'aguja', 'sutura', 'apósito', 'venda', 'gasa', 'tela adhesiva',
    'catéter', 'sonda', 'cánula', 'bolsa de suero', 'equipo de venoclisis',
    'oxígeno', 'oxígeno medicinal', 'concentrador de oxígeno', 'respirador',
    // Equipamiento médico
    'equipamiento médico', 'equipo médico', 'equipo clínico', 'equipo hospitalario',
    'cama clínica', 'camilla', 'silla de ruedas', 'andador', 'muleta',
    'monitor de signos vitales', 'electrocardiógrafo', 'ecógrafo', 'ecografía',
    'tomógrafo', 'rayos x', 'mamógrafo', 'resonador', 'endoscopio',
    'desfibrilador', 'ventilador mecánico', 'bomba de infusión',
    'autoclave', 'esterilizador', 'lámpara quirúrgica', 'mesa quirúrgica',
    // Especialidades
    'médico', 'dental', 'odontología', 'odontológico', 'dentista',
    'radiología', 'laboratorio clínico', 'examen de laboratorio',
    'kinesiología', 'fonoaudiología', 'psicología', 'psiquiatría',
    'oftalmología', 'otorrinolaringología', 'traumatología', 'pediatría',
    'ginecología', 'maternidad', 'urgencia', 'unidad de emergencia',
    // Residuos y limpieza hospitalaria
    'residuos hospitalarios', 'riles hospitalarios', 'esterilización',
    'reesterilización', 'lavandería hospitalaria',
    // Telemedicina
    'telemedicina', 'teleconsulta', 'salud digital',
    // Vocabulario real de licitaciones de salud (ChileCompra)
    'adquisición de medicamentos', 'adquisición de insumos',
    'suministro de insumos médicos', 'suministro de medicamentos',
    'red de atención primaria', 'aps', 'red aps', 'posta rural',
    'equipos biomédicos', 'mantención de equipos biomédicos',
    'banco de sangre', 'laboratorio de análisis clínico',
    'seguros complementarios de salud', 'csr',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 5. EDUCACIÓN
  // ─────────────────────────────────────────────────────────────────────
  'Educación': [
    'educación', 'escuela', 'liceo', 'colegio', 'establecimiento educacional',
    'establecimiento educativo', 'universidad', 'instituto', 'cftp', 'centro de formación',
    // Niveles educativos
    'educación básica', 'educación media', 'educación superior', 'educación técnica',
    'educación parvularia', 'jardín infantil', 'sala cuna', 'párvulo', 'prekinder',
    // Materiales y recursos pedagógicos
    'material didáctico', 'material educativo', 'texto escolar', 'libro de texto',
    'cuaderno', 'libro', 'biblioteca', 'bibliografía', 'recurso pedagógico',
    'pizarrón', 'pizarra interactiva', 'proyector aula', 'tablet educativa',
    'laboratorio educacional', 'laboratorio de ciencias', 'kit educativo',
    // Personal y gestión
    'docente', 'profesor', 'asistente de la educación', 'paradocente',
    'currículum', 'malla curricular', 'plan de estudios', 'programa educativo',
    'aprendizaje', 'rendimiento académico', 'evaluación educativa', 'simce',
    // Infraestructura educativa
    'sala de clases', 'aula', 'sala de computación', 'sala multiusos',
    'casino escolar', 'comedor escolar', 'patio escolar', 'baño escolar',
    'establecimiento educacional', 'subvención escolar', 'matrícula',
    // Programas educativos
    'programa educativo', 'proyecto educativo', 'programa de integración',
    'inclusión educativa', 'necesidades educativas especiales', 'nee',
    'convivencia escolar', 'habilidades socioemocionales',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 6. CAPACITACIÓN
  // ─────────────────────────────────────────────────────────────────────
  'Capacitación': [
    'capacitación', 'capacitación laboral', 'formación', 'formación laboral',
    'curso', 'taller', 'diplomado', 'seminario', 'charla', 'conferencia',
    'entrenamiento', 'perfeccionamiento', 'actualización', 'nivelación',
    'habilidades blandas', 'habilidades directivas', 'liderazgo', 'trabajo en equipo',
    'competencias', 'certificación', 'acreditación', 'otec',
    'inducción', 'programa de inducción', 'onboarding',
    'e-learning', 'capacitación online', 'plataforma e-learning', 'lms',
    'aula virtual', 'capacitación presencial', 'capacitación mixta', 'blended',
    'primera respuesta', 'primeros auxilios', 'rcp', 'desfibrilador dea',
    'prevención de riesgos', 'higiene industrial', 'seguridad laboral',
    'capacitación en sistema', 'capacitación técnica', 'formación técnica',
    'plan de capacitación', 'programa de formación',
    'coach', 'coaching organizacional', 'facilitador', 'relator',
    'material de apoyo', 'material de capacitación',
    'habilidades', 'habilidades socioemocionales', 'habilidades blandas', 'habilidades directivas',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 7. TRANSPORTE Y LOGÍSTICA
  // ─────────────────────────────────────────────────────────────────────
  'Transporte': [
    'transporte', 'movilización', 'traslado', 'traslado de personas', 'traslado de pacientes',
    'traslado de alumnos', 'transporte escolar', 'bus escolar', 'locomoción colectiva',
    'vehículo', 'flota vehicular', 'flota de vehículo', 'arriendo de vehículo',
    'arriendo de automóvil', 'arriendo de camioneta', 'arriendo de bus',
    'camión', 'bus', 'minibus', 'furgón', 'automóvil', 'pickup', 'camioneta',
    'ambulancia', 'transporte sanitario',
    'logística', 'despacho', 'distribución', 'entrega a domicilio', 'última milla',
    'mensajería', 'courier', 'encomienda', 'carga', 'flete', 'freight',
    'combustible', 'bencina', 'diesel', 'gasolina', 'gas natural vehicular',
    'lubricante', 'aceite', 'neumático', 'llanta', 'repuesto vehicular',
    'mantención vehicular', 'revisión técnica', 'permiso de circulación',
    'seguro vehicular', 'grúa', 'remolque',
    'chófer', 'conductor', 'chofer',
    // Vocabulario real (ChileCompra)
    'servicio de movilización', 'servicio de traslado de personal',
    'arriendo de vehículos livianos', 'arriendo con conductor', 'arriendo sin conductor',
    'dideco', 'serviu', 'movilización institucional',
    'vehículos para proceso electoral', 'transporte elecciones',
    'suministro de transporte', 'prestación de servicio de transporte',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 8. ALIMENTACIÓN Y CASINO
  // ─────────────────────────────────────────────────────────────────────
  'Alimentación': [
    'alimentación', 'alimento', 'comida', 'servicio de alimentación', 'servicio de casino',
    'casino', 'casino institucional', 'concesión de casino', 'comedor',
    'catering', 'servicio de catering', 'banquetería', 'restaurant',
    'colación', 'ración', 'ración de alimento', 'servicio de colación',
    'almuerzo', 'desayuno', 'cena', 'once', 'menú', 'menú ejecutivo',
    'cocina', 'preparación de alimentos', 'elaboración de alimentos',
    'nutrición', 'nutricionista', 'dieta', 'dieta terapéutica',
    'frutas', 'verduras', 'abarrotes', 'lácteos', 'pan', 'panadería',
    'carne', 'pescado', 'cecinas', 'huevo',
    'canasta familiar', 'cesta alimentaria', 'bolsa de alimento',
    'abastecimiento de alimentos', 'suministro de alimentos',
    'agua mineral', 'agua purificada', 'dispensador de agua',
    'inocuidad alimentaria', 'manipulación de alimentos', 'haccp',
    'servicio de refrigerio', 'coffee break', 'café', 'té', 'infusión',
    // Vocabulario real (ChileCompra)
    'servicio de alimentación periodo', 'concesión de alimentación',
    'complejo fronterizo', 'colación para personal de terreno',
    'servicio de aseo mantención y alimentación',
    'suministro de productos alimenticios', 'comedores escolares',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 9. SEGURIDAD PRIVADA
  // ─────────────────────────────────────────────────────────────────────
  'Seguridad': [
    'seguridad', 'seguridad privada', 'vigilancia', 'vigilancia privada',
    'guardia de seguridad', 'guardia', 'personal de seguridad', 'ronda',
    'ronda de vigilancia', 'resguardo', 'custodio',
    'portería', 'control de acceso', 'acceso vehicular', 'acceso peatonal',
    'torniquete', 'barrera de acceso', 'estacionamiento', 'control de estacionamiento',
    'cámara de seguridad', 'cctv', 'circuito cerrado de televisión',
    'alarma', 'sistema de alarma', 'monitoreo remoto', 'central de monitoreo',
    'detector de metales', 'rayos x de equipaje', 'escáner de seguridad',
    'cerca eléctrica', 'malla electrificada', 'portón automático',
    'control de ronda', 'sistema de ronda', 'gprs', 'rastreo gps',
    'perro guardián', 'unidad canina',
    'botón de pánico', 'intercomunicador', 'portero electrónico',
    // Vocabulario real (ChileCompra)
    'servicio de seguridad y vigilancia', 'seguridad física perimetral',
    'dependencias institucionales', 'instalaciones municipales',
    'seguridad para eventos masivos', 'seguridad pública',
    'control perimetral',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 10. LIMPIEZA Y ASEO
  // ─────────────────────────────────────────────────────────────────────
  'Limpieza': [
    'limpieza', 'aseo', 'aseo y limpieza', 'servicio de aseo', 'servicio de limpieza',
    'aseo de oficinas', 'limpieza de oficinas', 'aseo de dependencias',
    'limpieza de instalaciones', 'limpieza de edificio',
    'higiene', 'desinfección', 'sanitización', 'esterilización de ambientes',
    'fumigación', 'control de plagas', 'desratización', 'desinsectación',
    'limpieza de ventanas', 'limpieza de fachada', 'lavado de alfombras',
    'lavado de vidrios', 'lavado de muebles', 'limpieza profunda',
    'limpieza de techos', 'limpieza de canaletas', 'limpieza de cisternas',
    'vaciado de fosas sépticas', 'desatasco', 'limpieza de alcantarillas',
    'jardinería', 'mantención de jardines', 'mantención de áreas verdes',
    'corte de pasto', 'poda', 'riego', 'recolección de hojas',
    'servicios generales', 'servicios básicos', 'aseo general',
    'lavandería', 'lavado de ropa', 'lavado de lencería', 'lavado industrial',
    'producto de limpieza', 'detergente', 'desinfectante', 'cloro', 'amonio cuaternario',
    'paño', 'escoba', 'trapeador', 'aspiradora industrial',
    'contenedor de basura', 'recolección de residuos', 'retiro de basura',
    // Vocabulario real (ChileCompra)
    'servicio de limpieza para dependencias', 'servicio de aseo y limpieza',
    'aseo exterior e interior', 'mantención general de dependencias',
    'limpieza de flota de vehículos', 'servicio de aseo mantención',
    'aseo para parque', 'aseo para complejo',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 11. MARKETING Y COMUNICACIONES
  // ─────────────────────────────────────────────────────────────────────
  'Marketing': [
    'marketing', 'publicidad', 'comunicaciones', 'comunicaciones estratégicas',
    'imagen corporativa', 'identidad corporativa', 'identidad de marca', 'branding',
    'diseño gráfico', 'diseño visual', 'diseño de piezas', 'diagramación',
    'material gráfico', 'material comunicacional', 'material de difusión',
    'impresión', 'impresión offset', 'impresión digital', 'ploteo',
    'afiche', 'flyer', 'folleto', 'díptico', 'tríptico', 'catálogo', 'revista',
    'banner', 'roll up', 'pendón', 'letrero', 'gigantografía', 'valla publicitaria',
    'señalética', 'señalización', 'letrero de señalización',
    'fotografía', 'fotografía institucional', 'retrato', 'banco de imágenes',
    'video', 'video institucional', 'producción audiovisual', 'animación',
    'spot radial', 'spot televisivo', 'cuña radial', 'pauta de medios',
    'redes sociales', 'community manager', 'gestión de redes', 'contenido digital',
    'campaña', 'campaña de comunicación', 'campaña publicitaria',
    'relaciones públicas', 'prensa', 'nota de prensa', 'difusión',
    'página web', 'diseño web', 'ux', 'ui', 'maqueta web',
    'merchandising', 'artículo promocional', 'souvenir', 'regalo corporativo',
    'uniforme', 'polera', 'chaleco corporativo', 'indumentaria corporativa',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 12. SERVICIOS FINANCIEROS Y CONTABLES
  // ─────────────────────────────────────────────────────────────────────
  'Servicios Financieros': [
    'seguro', 'póliza de seguro', 'seguro de vida', 'seguro complementario',
    'seguro de vehículo', 'seguro de incendio', 'seguro contra todo riesgo',
    'fianza', 'garantía', 'boleta de garantía', 'póliza de garantía',
    'crédito', 'financiamiento', 'préstamo', 'mutuo', 'línea de crédito',
    'banco', 'servicio bancario', 'cuenta corriente', 'leasing', 'factoring',
    'corretaje', 'corredora', 'gestión de inversiones',
    'auditoría financiera', 'auditoría contable', 'auditoría interna',
    'contabilidad', 'servicio contable', 'outsourcing contable',
    'remuneraciones', 'liquidación de sueldos', 'procesamiento de remuneraciones',
    'declaración de impuestos', 'tributario', 'sri', 'sii',
    'recaudación', 'cobranza', 'gestión de cobro',
    'facturación', 'emisión de factura', 'factura electrónica',
    'tesorería', 'flujo de caja', 'presupuesto', 'control financiero',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 13. TURISMO Y VIAJES
  // ─────────────────────────────────────────────────────────────────────
  'Turismo y Viajes': [
    'pasajes', 'pasajes aéreos', 'pasaje de avión', 'vuelo', 'boleto aéreo',
    'pasaje de bus', 'pasaje de tren', 'pasaje de ferry',
    'alojamiento', 'hotel', 'hostal', 'cabaña', 'residencial', 'albergue',
    'gira de estudio', 'excursión', 'visita educativa', 'viaje pedagógico',
    'turismo', 'paquete turístico', 'tour', 'actividad turística',
    'viáticos', 'gastos de traslado', 'gastos de viaje',
    'agencia de viajes', 'operadora turística',
    'traslado aeropuerto', 'transfer', 'servicio de recogida',
    'arriendo de bicicleta', 'actividad outdoor', 'turismo aventura',
    'convención', 'congreso', 'viaje corporativo', 'viaje de incentivo',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 14. ENERGÍA Y COMBUSTIBLES
  // ─────────────────────────────────────────────────────────────────────
  'Energía y Combustibles': [
    'electricidad', 'suministro eléctrico', 'energía eléctrica', 'red eléctrica',
    'alumbrado público', 'alumbrado', 'luminaria', 'luminaria led', 'poste de luz',
    'eficiencia energética', 'auditoría energética', 'certificación energética',
    'generador eléctrico', 'grupo electrógeno', 'ups', 'banco de baterías',
    'panel solar', 'paneles fotovoltaicos', 'energía solar', 'instalación solar',
    'energía renovable', 'energía limpia', 'eólico', 'hidroeléctrico',
    'combustible', 'bencina', 'diesel', 'gasoil', 'petróleo', 'kerosene',
    'gas natural', 'gas licuado', 'glp', 'propano', 'butano',
    'leña', 'pellet', 'astilla', 'biomasa', 'caldero a leña',
    'caldera', 'termotanque', 'calentador de agua',
    'medidor de energía', 'factura eléctrica', 'tarifa eléctrica',
    'tensión', 'transformador', 'subestación eléctrica',
    // Vocabulario real (ChileCompra)
    'sistema fotovoltaico', 'fotovoltaico', 'off-grid',
    'media tensión', 'empalme eléctrico', 'empalme de media tensión',
    'parque solar comunitario', 'energía comunitaria',
    'iluminación pública led', 'iluminación en cementerios',
    'suministro eléctrico', 'licitación de suministro eléctrico',
    'instalación eléctrica interior', 'instalación de paneles',
    'adquisición e instalación de sistemas fotovoltaicos',
    'mantención de iluminación', 'mantención de sistemas de iluminación',
    'iluminación led', 'led', 'mantención de alumbrado',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 15. INGENIERÍA Y DISEÑO
  // ─────────────────────────────────────────────────────────────────────
  'Ingeniería y Diseño': [
    'topografía', 'levantamiento topográfico', 'estudio topográfico', 'geodesia',
    'estudio de mecánica de suelos', 'mecánica de suelos', 'sondaje', 'calicata',
    'cálculo estructural', 'diseño estructural', 'memoria de cálculo',
    'cubicación', 'cómputo métrico', 'presupuesto de ingeniería',
    'arquitectura', 'diseño arquitectónico', 'plano', 'planimetría', 'expediente técnico',
    'diseño vial', 'ingeniería vial', 'estudio de tránsito', 'aforo vehicular',
    'catastro', 'catastro de infraestructura', 'registro de activos',
    'estudio de impacto ambiental', 'eia', 'dga', 'permiso ambiental',
    'ingeniería de detalle', 'ingeniería básica', 'ingeniería conceptual',
    'diseño hidráulico', 'diseño sanitario', 'diseño eléctrico',
    'inspección técnica de obra', 'ito', 'fiscalización de obras',
    'modelación', 'bim', 'autocad', 'revit', 'civil 3d',
    'informe de inspección', 'informe técnico de ingeniería',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 16. SERVICIOS LEGALES Y JURÍDICOS
  // ─────────────────────────────────────────────────────────────────────
  'Servicios Legales': [
    'jurídico', 'asesoría jurídica', 'servicio jurídico', 'defensa legal',
    'abogado', 'abogacía', 'estudio jurídico', 'firma legal',
    'litigio', 'representación judicial', 'defensa judicial',
    'cobranza judicial', 'cobranza prejudicial', 'gestión de cobranza',
    'notaría', 'servicio notarial', 'escritura pública', 'protocolización',
    'conservador de bienes raíces', 'inscripción en cbr', 'registro',
    'contrato', 'redacción de contrato', 'revisión de contrato',
    'peritaje', 'perito', 'informe pericial',
    'mediación', 'arbitraje', 'conciliación',
    'propiedad intelectual', 'marca', 'patente', 'derecho de autor',
    'normativa', 'regulatorio', 'cumplimiento normativo', 'compliance',
    'recurso legal', 'amparo', 'reclamo',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 17. EVENTOS Y PRODUCCIÓN
  // ─────────────────────────────────────────────────────────────────────
  'Eventos y Producción': [
    'evento', 'organización de evento', 'producción de evento', 'logística de evento',
    'seminario', 'congreso', 'cumbre', 'foro', 'jornada', 'coloquio',
    'encuentro', 'reunión', 'taller participativo', 'workshop',
    'ceremonia', 'acto protocolar', 'lanzamiento', 'inauguración', 'premiación',
    'coctel', 'coffee break', 'banquetería', 'servicio de banquetería',
    'arriendo de carpa', 'arriendo de salón', 'arriendo de auditorio', 'arriendo de local',
    'escenario', 'tarima', 'montar escenario', 'estructura de evento',
    'sonido', 'audio', 'equipo de sonido', 'micrófono', 'parlante',
    'iluminación', 'iluminación escénica', 'proyección', 'pantalla led',
    'animación', 'animador', 'maestro de ceremonias', 'presentador',
    'protocolo', 'protocolo corporativo',
    'transmisión en vivo', 'streaming', 'webinar',
    'photocall', 'backdrop', 'decoración de evento',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 18. FERRETERÍA Y MATERIALES
  // ─────────────────────────────────────────────────────────────────────
  'Ferretería y Materiales': [
    'ferretería', 'materiales', 'materiales de construcción', 'suministros',
    'herramienta', 'herramienta de mano', 'herramienta eléctrica', 'equipo de trabajo',
    'taladro', 'amoladora', 'sierra', 'compresor', 'martillo neumático',
    'cemento', 'hormigón premezclado', 'mortero', 'yeso', 'estuco',
    'ladrillo', 'bloque', 'piedra', 'ripio', 'arena', 'gravilla',
    'madera', 'tabla', 'listón', 'terciado', 'mdf', 'osb',
    'fierro', 'acero', 'perfil', 'varilla', 'malla', 'alambre',
    'tubería', 'cañería', 'pvc', 'hdpe', 'polietileno', 'fitting',
    'válvula', 'llave de paso', 'grifo', 'unión', 'codo', 'te',
    'pintura', 'esmalte', 'barniz', 'sellador', 'impermeabilizante',
    'silicona', 'adhesivo', 'pegamento', 'masilla', 'espuma',
    'tornillo', 'perno', 'tuerca', 'clavo', 'taco', 'fijador',
    'lija', 'abrasivo', 'disco de corte', 'disco de desbaste',
    'candado', 'chapa', 'cerradura', 'bisagra', 'picaporte',
    'cinta', 'cinta de embalaje', 'cinta aislante', 'cinta americana',
    'plástico', 'polietileno', 'manta térmica', 'geomembrana',
    'seguridad industrial', 'epp', 'casco', 'guante de seguridad',
    'calzado de seguridad', 'arnés', 'línea de vida',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 19. INSUMOS DE OFICINA
  // ─────────────────────────────────────────────────────────────────────
  'Insumos de Oficina': [
    'insumos de oficina', 'artículos de oficina', 'material de oficina',
    'papelería', 'papel', 'resma', 'resmas de papel', 'papel bond',
    'carpeta', 'archivador', 'folder', 'sobre', 'sobre manila',
    'lápiz', 'bolígrafo', 'plumón', 'marcador', 'resaltador', 'corrector',
    'cuaderno', 'agenda', 'block', 'talonario',
    'grapadora', 'grapas', 'perforadora', 'clip', 'gancho',
    'tijera', 'cúter', 'regla', 'calculadora',
    'tóner', 'cartucho', 'tinta', 'cinta impresora',
    'post-it', 'notas adhesivas', 'etiquetas', 'sticker',
    'sello', 'fechador', 'almohadilla', 'tinta de sello',
    'cinta adhesiva', 'pegamento de barra', 'silicona líquida',
    'borrador', 'sacapuntas', 'portaminas', 'minas',
    'bibliorato', 'lomo caña', 'espiralado', 'encuadernación',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 20. MOBILIARIO
  // ─────────────────────────────────────────────────────────────────────
  'Mobiliario': [
    'mobiliario', 'mueble', 'muebles', 'amoblado', 'equipamiento',
    'silla', 'silla ergonómica', 'silla de escritorio', 'silla de espera',
    'sillón', 'poltrona', 'butaca', 'silla plegable',
    'escritorio', 'escritorio de trabajo', 'mesón', 'counter',
    'mesa', 'mesa de reuniones', 'mesa de trabajo', 'mesa plegable',
    'estante', 'estantería', 'rack de almacenamiento', 'repisa',
    'armario', 'mueble guardador', 'closet', 'locker', 'casillero',
    'pizarra', 'pizarra blanca', 'pizarra verde', 'pizarrón',
    'mobiliario escolar', 'banco escolar', 'pupitre', 'silla universitaria',
    'mueble de cocina', 'cocina integral', 'kitchenette', 'mueble bajo',
    'vitrina', 'exhibidor', 'mostrador',
    'bancas', 'banca de parque', 'mobiliario urbano', 'mesa de jardín',
    'sillón ejecutivo', 'silla de dirección',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 21. AGRÍCOLA Y GANADERÍA
  // ─────────────────────────────────────────────────────────────────────
  'Agrícola y Ganadería': [
    'semilla', 'semillero', 'planta', 'almácigo', 'vivero',
    'fertilizante', 'abono', 'compost', 'guano', 'humus',
    'plaguicida', 'pesticida', 'herbicida', 'fungicida', 'insecticida',
    'riego', 'sistema de riego', 'goteo', 'aspersión', 'microaspersión',
    'tractor', 'maquinaria agrícola', 'arado', 'rastra', 'sembradora',
    'cosecha', 'cosechadora', 'trilladora', 'recolección',
    'cultivo', 'labranza', 'siembra', 'plantación', 'poda agrícola',
    'alimento animal', 'ración animal', 'forraje', 'heno', 'silo',
    'veterinario', 'medicina veterinaria', 'vacuna animal', 'insumo veterinario',
    'ganadería', 'bovino', 'ovino', 'porcino', 'avicultura', 'apicultura',
    'pesca', 'acuicultura', 'piscicultura', 'maricultura', 'salmón',
    'forestal', 'plantación forestal', 'manejo forestal', 'tala', 'madera',
    'invernadero', 'túnel plástico',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 22. ARTES Y CULTURA
  // ─────────────────────────────────────────────────────────────────────
  'Artes y Cultura': [
    'arte', 'cultura', 'cultural', 'patrimonio', 'patrimonio cultural',
    'taller artístico', 'taller de arte', 'taller cultural',
    'obra de teatro', 'teatro', 'espectáculo teatral', 'función',
    'exposición', 'muestra', 'galería', 'museo',
    'concierto', 'recital', 'festival', 'show musical', 'banda musical',
    'danza', 'ballet', 'baile', 'compañía de danza',
    'instrumento musical', 'equipo musical', 'audio cultural',
    'cine', 'proyección de cine', 'festival de cine', 'cortometraje',
    'animación sociocultural', 'animador sociocultural',
    'feria artesanal', 'artesanía', 'artesano',
    'biblioteca', 'fomento lector', 'libro', 'editorial',
    'fotografía artística', 'instalación artística', 'performance',
    'residencia artística', 'becas de arte',
    'patrimonio histórico', 'restauración de patrimonio', 'bien patrimonial',
  ],

  // ─────────────────────────────────────────────────────────────────────
  // 23. GESTIÓN DE RESIDUOS Y MEDIO AMBIENTE
  // ─────────────────────────────────────────────────────────────────────
  'Gestión de Residuos': [
    'residuos', 'residuos sólidos', 'rsd', 'basura', 'recolección de basura',
    'recolección de residuos', 'retiro de residuos', 'disposición de residuos',
    'vertedero', 'relleno sanitario', 'planta de transferencia',
    'escombros', 'retiro de escombros', 'disposición de escombros',
    'reciclaje', 'reciclado', 'clasificación de residuos', 'separación en origen',
    'residuos peligrosos', 'residuos especiales', 'residuos hospitalarios',
    'contenedor', 'contenedor de basura', 'papelero', 'papelera',
    'compactador', 'camión recolector', 'camión de basura',
    'compostaje', 'planta de compostaje', 'humus de lombriz',
    'riles', 'aguas residuales', 'tratamiento de aguas',
    'planta de tratamiento', 'planta de tratamiento de aguas servidas',
    'alcantarillado', 'fosa séptica', 'cámara séptica',
    'auditoría ambiental', 'gestión ambiental', 'iso 14001',
    'medio ambiente', 'educación ambiental',
    'limpieza de fosas', 'limpieza de zanjas', 'limpieza de cauces',
  ],

};

// Relaciona rubros que pueden ser compatibles entre sí (score 10 = periférico)
const RUBRO_RELATED: Record<string, string[]> = {
  'Tecnología':              ['Consultoría', 'Marketing', 'Ingeniería y Diseño', 'Capacitación'],
  'Construcción':            ['Ingeniería y Diseño', 'Ferretería y Materiales', 'Limpieza', 'Gestión de Residuos', 'Energía y Combustibles'],
  'Consultoría':             ['Educación', 'Capacitación', 'Tecnología', 'Marketing', 'Servicios Legales', 'Servicios Financieros'],
  'Salud':                   ['Alimentación', 'Limpieza', 'Seguridad', 'Capacitación', 'Transporte'],
  'Educación':               ['Consultoría', 'Capacitación', 'Artes y Cultura', 'Alimentación'],
  'Capacitación':            ['Educación', 'Consultoría', 'Tecnología'],
  'Marketing':               ['Consultoría', 'Tecnología', 'Eventos y Producción'],
  'Ingeniería y Diseño':     ['Construcción', 'Tecnología', 'Energía y Combustibles'],
  'Servicios Legales':       ['Consultoría', 'Servicios Financieros'],
  'Servicios Financieros':   ['Consultoría', 'Servicios Legales'],
  'Ferretería y Materiales': ['Construcción', 'Mobiliario'],
  'Insumos de Oficina':      ['Mobiliario', 'Marketing'],
  'Mobiliario':              ['Ferretería y Materiales', 'Insumos de Oficina'],
  'Eventos y Producción':    ['Marketing', 'Alimentación', 'Artes y Cultura'],
  'Artes y Cultura':         ['Educación', 'Eventos y Producción'],
  'Gestión de Residuos':     ['Limpieza', 'Construcción'],
  'Energía y Combustibles':  ['Construcción', 'Ingeniería y Diseño'],
  'Transporte':              ['Logística', 'Alimentación', 'Salud'],
  'Alimentación':            ['Salud', 'Educación'],
  'Agrícola y Ganadería':    ['Alimentación', 'Gestión de Residuos'],
};

export function scoreRubro(
  tenderTitle: string,
  tenderDescription: string | null | undefined,
  companyIndustry: string | null | undefined
): { score: number; label: string; matches: string[] } {
  if (!companyIndustry) return { score: 10, label: 'Rubro no configurado', matches: [] };
  
  if (companyIndustry === 'Sin rubro específico') {
    return { score: 40, label: 'Sin rubro específico (Evaluación neutral)', matches: [] };
  }

  const keywords = RUBRO_KEYWORDS[companyIndustry] ?? [];
  const textCleaned = ` ${tenderTitle} ${tenderDescription ?? ''} `.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");

  const matches = keywords.filter(k => {
    const kw = k.toLowerCase();
    if (kw.length <= 3) {
      // Exigir límites de palabra completa para palabras cortas (ej. 'ti', 'ito', 'ups')
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(textCleaned);
    }
    return textCleaned.includes(kw);
  });

  // 2+ coincidencias = exacto (40pts) | 1 coincidencia = relacionado (25pts)
  if (matches.length >= 2) return { score: 40, label: 'Coincidencia exacta de rubro', matches };
  if (matches.length >= 1) return { score: 25, label: 'Rubro relacionado', matches };

  // Revisar rubros relacionados → score periférico (10pts)
  const related = RUBRO_RELATED[companyIndustry] ?? [];
  for (const relRubro of related) {
    const relKeywords = RUBRO_KEYWORDS[relRubro] ?? [];
    const relMatches = relKeywords.filter(k => text.includes(k.toLowerCase()));
    if (relMatches.length >= 2) return { score: 10, label: `Rubro periférico (${relRubro})`, matches: relMatches };
  }

  return { score: 0, label: 'Sin relación con el rubro', matches: [] };
}

export const AVAILABLE_RUBROS = Object.keys(RUBRO_KEYWORDS);
