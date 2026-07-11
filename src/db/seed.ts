import 'dotenv/config';
import { db, companies, users, tenders } from './index';
import { ingestionQueue } from '../workers/ingestion.worker';
import { calculateScore } from '../services/scoring/index';

async function seed() {
  console.log('[Seed] Sembrando datos iniciales...');

  // 1. Crear la empresa VC Elemental
  const [company] = await db
    .insert(companies)
    .values({
      name:      'VC Elemental',
      rut:       '76.123.456-K',
      industry:  'Tecnología',
      region:    'RM',
      budgetMin: '0', // No operational minimum
      budgetMax: '0', // No operational maximum
      apiTicket: process.env.MP_ADMIN_TICKET ?? 'E18620F6-CC83-4690-96FC-CD61DC9FAE8D',
      plan:      'growth',
    })
    .onConflictDoUpdate({
      target: companies.rut,
      set: {
        budgetMin: '0',
        budgetMax: '0',
      }
    })
    .returning();

  const activeCompany = company || (await db.select().from(companies).limit(1))[0];
  console.log('[Seed] Empresa activa:', activeCompany.name, 'ID:', activeCompany.id);

  // 2. Crear usuario administrador
  const [user] = await db
    .insert(users)
    .values({
      companyId: activeCompany.id,
      email:     'jose@vcelemental.cl',
      name:      'José Valdés',
      role:      'owner',
      phone:     '+56912345678',
    })
    .onConflictDoNothing()
    .returning();

  console.log('[Seed] Usuario activo:', user ? user.name : 'Ya existe');

  // 3. Sembrar la licitación real 1067476-19-LE26 de SERPAT
  const rawDataForLE26 = {
    documentos: [
      {
        nombre: "Carpeta de Adjuntos (Ver y descargar todos los archivos)",
        link: "https://www.mercadopublico.cl/Procurement/Modules/Attachment/ViewAttachment.aspx?enc=54Gtu79wYeyJHBVuDtjpQBGatDvogCCQApHUiYnMJyij4lXvJWAFPRJwf84RlbrThANQ8jxCicpA0xUaLukjQ8ty7VV1PnTZxBYQaUefrdLHM8djXmhdNjaTC%2f86HSw9NCawbR9A52QX3CWM9haB7GGyGZloWYcv2eQNkRQlAYto1jwgbIGPPzfAKc76OQ19Wmb461vkL3nGojK7abmFUkcN4o%2ff2TxpRViW52r6AXnwgK7i5jSrAB9BYVLpiVoplvzzh1wAPjnteaRFVUCZ8F%2f1FkOhsJx6KZ5Ux6BahzRpigCMrFl6Dp2O6XBoaCTz"
      },
      {
        nombre: "Bases Administrativas y Técnicas",
        link: "https://www.mercadopublico.cl/Procurement/Modules/Attachment/ViewAttachment.aspx?enc=54Gtu79wYeyJHBVuDtjpQBGatDvogCCQApHUiYnMJyij4lXvJWAFPRJwf84RlbrThANQ8jxCicpA0xUaLukjQ8ty7VV1PnTZxBYQaUefrdLHM8djXmhdNjaTC%2f86HSw9NCawbR9A52QX3CWM9haB7GGyGZloWYcv2eQNkRQlAYto1jwgbIGPPzfAKc76OQ19Wmb461vkL3nGojK7abmFUkcN4o%2ff2TxpRViW52r6AXnwgK7i5jSrAB9BYVLpiVoplvzzh1wAPjnteaRFVUCZ8F%2f1FkOhsJx6KZ5Ux6BahzRpigCMrFl6Dp2O6XBoaCTz"
      },
      {
        nombre: "Anexo N° 1 - Identificación del Oferente y Aceptación de Bases",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=uuK8qNAxd2hkB51hkrLWJaJVFpLA1xX22cTBdFyWCoILt6%2fNNwT1WyFE91%2bpZZ%2f4qiHSYtx%2bBZAQXn%2bLjMQnGNi6m5YRMOafQi%2fuglruKfYmX0I6fc36bZuPUax69ghkshuCyV%2bAf6np9FTZvXb7sDRtR7KqUS5xWsp14aipUUEHx%2b4jQl4a5rw8tXWDGBPV%2fdzi4QKWlRE3JjRPNIRK5HtGu5ZQ3uxcfiZQgGFeg2AXE3Kv9DSMAfOX9IbusS1aRh0MMvLw%2fFFg80INb%2b94n0awMGPEzV%2fbj5kb%2fbEYWg7FQNvfzvgEoYyW2NgwEaLur1fXB%2fRd6WoelzjmXKRJkasyyijPW%2feEgRh6RWhft%2f0AyMHffOi7nxkxlnn7zn5jN7LTN2KZM3VJmxucalnDqjE%2b2cAA2cpORjamPNo630QXwu6YJaUklZ%2b2sAfbg8JHBCXcqyFScQmRAI0hKJ0yht6RWcCCW%2bplAGAuMiyokhY%3d"
      },
      {
        nombre: "Anexo N° 2 - Declaración Jurada de No Inhabilidades",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=xXbjP3Q1rlZb%2fB3szm5WkWi1cDNSMX%2bhxc7lQ1Gp8jVGTw6Xd2WijVBtYaTOCgZNo4qJ7255gcTnNbtTYYnpo6J1pMuX%2fcCMU0JxUcD%2fSeCrt81Ry%2bxpBqC%2bswo3Buzk2mlmt4kxkmfArt7sfjXawZ4SH9Wax%2bNfqrLiS9R10frsLYdOGs463X%2b%2bdeR79YfGRw1KyBQO3sU%2b0VY1rRQKE4weQjy5zkAVf8HaOhvAn2rp4CPNI0Ybj1TrhLiWvGFOUGFgLrHV9bAHyjenKC%2guuSqLGGjnACh3lOQ0y4VA8bU6TZaUEXiyUHeGSDZ%2fhOSQPlMknA6KhFHQS%2bvXUPBH6K6HK7ERSU1tnFEYWK4bnN%2bOS8sl0Jq7jfZciQL%2braD6Gkl5Tex4PbLF404%2fO5eMxcJfPtGmMHqiIO%2fuFIzWokDclfVxDlttOz4Vy1rRQKE4weQjy5zkAVf8HaOhvAn2rp4CPNI0Ybj1TrhLiWvGFOUGFgLrHV9bAHyjenKC%2guuSqLGGjnACh3lOQ0y4VA8bU6TZaUEXiyUHeGSDZ%2fhOSQPlMknA6KhFHQS%2bvXUPBH6K6HK7ERSU1tnFEYWK4bnN%2bOS8sl0Jq7jfZciQL%2braD6Gkl5Tex4PbLF404%2fO5eMxcJfPtGmMHqiIO%2fuFIzWokDclfVxDlttOv26YOzhFj0E1swH27hh9AaysOSOh9rN41YPgS9bF9jITggibxtTKyc%3d"
      },
      {
        nombre: "Anexo N° 3 - Declaración Jurada y Compromiso",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=7wFNm6%2fBPtBbihHD%2fCuxo3i30bwZBAG6srzuOucBIdD5eXmECViS1K0rRgfsRjwGuSju%2bn%2bdGhaqHVV65p%2fubT15jhMXWmqxPg1ey4sLwquJj8p8rsaK6aiKeZecN9C7sENIylRWEiIqdisy4OJal7aVPXBXxIurIvE5%2bCHfWVHZYp9aMfbQX0Lw%2bV7Tdxz6rHYjbG7RyYGnLVIETEsOAJTn9nnKEo4iJf0wgXgdTTW%2blvW8LMVKM8F0vxnpvwVgksGUsaw1cToUjYBz6VteYmSk38GMqb1uNjeRQJdfSYRViQ8284yBiXL32yY4dnEQ2VBuP9ALq9%2fdTAQHntrEdiikroPbvKBHWmCicM6J96iPbWVJzypwFJn1XjLcPfSc%3d"
      },
      {
        nombre: "Anexo N° 4 - Declaración de No Inhabilitación Ley 21.595 (Delitos Económicos)",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=5r4you%2bF50TTvLx3YEc2yKk%2fwXYYwqtnBIbz9nCuIHIe4OYZpEnwA0eH%2b9yDBpwj3wRozpRhF%2bWwpRXnnt9hWfoBJgecc0P%2fmEoj%2beQN8sBGQk5QFaSvc3SNXizZIhURV9q%2f1oKmPna4Dv1Ms1JEBbNb%2bqkqdh9yED08N6EgNhXIgyI5USsKSzrQHg7c%2fHIEEBCUYnkFAajgbJBjHUp8Bh5erNY8VAzfbIwB6KtNZTLV4ImBJfX%2bVyxJo1CEm8kS%2f7sCKVGTAg9ua0lTjJ6IKjEqcJHhgUG9qbOHu%2bKoYZK0BbZMNDKfXZHToNWbAJws0j728fdmojJgRUQbMUyul2LWkEWaPsZLWtmMJ1ErNUNd1vrWJPW0DmJyPpC3BqPepMDEQIbSQTeYx3zyjtfQ6LXGw7IFcbplz2iVabDBykDLVp4nKTOm4h2MgthLLstnlv4XuKKtKSYesdZ4wOVZi2TuTsGTiCLqzA%2fYYdYllB4%3d"
      },
      {
        nombre: "Anexo N° 8 - Declaración Jurada Simple - Pacto de Integridad",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=C6rLgQJhckN52ikZxVZro6wXAYoSdFvTHbp04z3vVh3kmikG5Y2xDMUKys5FpbgBAutQYa5gaRj9Lp4MoYfHWiVMV%2fq8j7H3SBMOi%2bfWEoW5Hjh%2fmidyccFfCkkDtS8HoY4rmYUoy5C42WfueBUa4WIQVpuIUizpL6Et6pg7jVqR9Ifmslidcv3l9x1YjYe8YelgEc9AyXHMm36%2bJytNGztTc7MLVWQ6HO9r2Li902JQaYZkAU3ZJGcfMMoJZ4BwasZRUaUmeD3LblRZ7TVknJsohgE2wgs7AlI2r3DxltjKxlq2Gl%2fKteRoeTHS4EE1sF6riftfCpGHdR3Q%2fMJw82Osysd9jtnyb8LzXRYBFzKlKljDO3MOLHQPmOq5uVknb1B4bDeg1K%2bOyutahMUpysdsrkDx8xQi70sc8msgE3jFFvD%2fq1D7exl%2b5TN7FQCRGoLKsVcJdf%2b1M%2fAtlcEa5U%2bfkjiNW2C0oMAjpIWju3c%3d"
      },
      {
        nombre: "Anexo N° 9 - Programas o Pacto de Integralidad",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=cSdGk1%2bD2xHqSCBkkCwYcG5CHK6RosXN2ty9PjIdF84BQAeJ0yP6rlFNJfX8CQoEsBHiU5JtdkaO2widkd0lNJAoHFCYyhbnKYXyBdj%2bFw0YVWAlmDzOm%2f%2f6ES5XyOyZUIAdMoLXlRz37JzFvrOyqAHQJ7Yo0HWVjEnBF7DotJOq%2fsZt2d5TCwstrGJx4OrAM53DVHV%2fQur3cfFMT4ToTHRrmFjCkDXqUEdEPyUcvGAjUsSGk7wJ7oLgZTWoKlTnmxw4XyhCzS7zoZeslcYBdKSoO7Jq084URoKlMamXZZYkHDiNOuCq%2fXkZCmEQsABdbF9a62%2fOfJYmR1MPG%2bi3pN0vTz4at1egS6ntfLthk7i2uTuhKEvQEqiBhnq%2fZ%2f%2f2aVyT2fCosfkSZIo14LWUzAG1hPj4c58n0WS2B%2f83pxqA%2fm61Xu66We9hpOAU3RfrrEPhS7xr%2fAg1x6pKQzPMhAqJiEb6Pc1vyMEnWJJOG8M%3d"
      },
      {
        nombre: "Anexo N° 6 - Experiencia del Diseñador/A Web",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=jcSyNROAGuExdXPR80UJooJEm7GYL00h3MmonclUvFSKMq0zcQHYtY%2bpeIMBK32UsYCOi3W0b129JKJpopJeQhDr0KN%2bDLVK8wgqBvtXtRXW1OPKNQ%2b42O3dmtnBQhppLJTrLboR8FeukqBzWjNLWb3q535bsPz%2bPMg3g8XUdtDjJDopXxaC04ip0HJSNy3T3h1llvkaMZB2baERIOgF63ZxbNzlSyADtBNgaDwnPVVv%2fak1QDCiTQjRtnF7IZuw0%2bOSMXUhAGFQGDzp81xC8xjb0%2fkoa2PKvhinwXsmUqcZJxc2OUs77HvZ0fD6UKqfXvyFvaXSVbNYeWB9r10jnvtk27x7aT1zcfJBfN93nCCiuqLCMN4KCKBku0ylDO028a4u%2btf5xHTa%2bu2VjUDEP26VCne3l4yIQe3rWyiYJMdYZok6lSmo39d68DxMnzV53UZmq9Mq8HHNVIrRbdtTml6nl%2bd765EK9vohA4pbwQA%3d"
      },
      {
        nombre: "Anexo N° 5 - Formulario de Oferta Económica",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=F0I%2b2SPLNBmYv8HJrxGQgeEr5HvKzDjJ%2b0MqNwC%2f9ybe9%2bFCkGCHB84hSGb0UtrTIiX1km2IjwRqFCc7fyLtzAzk0c0KDpeZdQByl0M%2ffVgpsLJfqkf5bA0E6ru7UuzbVG4dDXfbMf62DMli89Sx4V6Dz6kNDcCp%2bCU0rTiXxv0ezzQAmY9EOAew9LWpUQDGdSEMMFuCGNCIcLt6JuUCGyOkDbN0JLDbnECrf2R2pG0S3Rh9uUtu7pQKa4qZkTVQgg%2guwEC2nwUGzvgO5xmSG75SvJUjJ2ff49CajTsUDW0spy2lyTOxxk4lwWLyW21ycTSHUdHO6dveUZy%2ba6CB%2b0bYeV152agH%2fLY%2bmkGXoYKvmkZyXzygoxD2P0hLgPms5Kbqy%2fJi4i7wz%2fDklB%2fsaSZXFaL0b9M1hjGxuXxkjSXUO8jwc7KsGATp3SE1f1evlqjxzlom3ckr1y9YuXwlFbmLfOjhxdKsYirpzmdXOZg%3d"
      }
    ],
    requisitos: [
      "Adjuntar Anexo N° 1 - Identificación del oferente y aceptación de bases",
      "Adjuntar Anexo N° 2 - Declaración Jurada de prohibiciones para contratar",
      "Adjuntar Anexo N° 3 - Declaración Jurada y Compromiso",
      "Adjuntar Anexo N° 4 - Declaración de inhabilitación Ley 21.595",
      "Adjuntar Anexo N° 8 - Pacto de Integridad",
      "Adjuntar Propuesta Técnica detallando plan de trabajo y metodología",
      "Acreditar personal mínimo requerido en los Anexos N° 6 y N° 7",
      "Adjuntar Anexo N° 5 - Formulario de Oferta Económica"
    ],
    requisitosExcluyentes: [
      "Subcontratación estrictamente prohibida en el proceso de ejecución",
      "Acreditación de al menos 1 Diseñador Web con experiencia mínima (Anexo N°6)",
      "Acreditación de al menos 1 Desarrollador con experiencia mínima (Anexo N°7)",
      "Declaración jurada simple obligatoria firmada electrónicamente en el portal"
    ],
    textoBases: {
      caracteristicas: "• **ID Licitación:** 1067476-19-LE26\n• **Nombre Oficial:** DISEÑO WEB Y APOYO INFORMÁTICO ACTUALIZACIÓN SIGPA\n• **Tipo de Licitación:** LE (Licitación Pública entre 100 y 1000 UTM)\n• **Estado:** Publicada\n• **Moneda:** CLP (Peso Chileno)",
      organismo: "• **Comprador:** Servicio Nacional del Patrimonio Cultural (SERPAT)\n• **Unidad de Compra:** Subdirección Nacional de Patrimonio Inmaterial\n• **RUT Comprador:** 65.166.217-5\n• **Ubicación:** Región Metropolitana, Santiago\n• **Contacto Técnico/Contrato:** Pablo Hernandez Morales (`pablo.hernace@patrimoniocultural.gob.cl`)\n• **Teléfono de Contacto:** `+56162175350`",
      etapasPlazos: "• **Fecha de Publicación:** 25-06-2026 18:07:06\n• **Inicio de Foro de Preguntas:** 25-06-2026 18:21:00\n• **Cierre de Foro de Preguntas:** 30-06-2026 21:21:00\n• **Publicación de Respuestas:** 02-07-2026 21:21:00\n• **Cierre de Recepción de Ofertas:** 06-07-2026 19:59:00\n• **Acto de Apertura Técnica:** 07-07-2026 08:00:00\n• **Acto de Apertura Económica:** 07-07-2026 08:00:00",
      antecedentes: "• **Documentos Administrativos:**\n  - Anexo N° 1 (Formulario de Identificación del Oferente y Aceptación de Bases)\n  - Anexo N° 2 (Declaración Jurada de No Inhabilidades)\n  - Anexo N° 3 (Declaración Jurada y Compromiso)\n  - Anexo N° 4 (Ley 21.595 - Delitos Económicos)\n  - Anexo N° 8 (Declaración Jurada Simple - Pacto de Integridad)\n  - Anexo N° 9 (Programas o Pacto de Integridad)\n• **Documentos Técnicos:**\n  - Propuesta Técnica (Plan de trabajo y metodología que responda al objetivo)\n  - Anexo N° 6 (Ficha de Experiencia del Diseñador/a Web)\n  - Anexo N° 7 (Ficha de Experiencia del Desarrollador/a)\n• **Documentos Económicos:**\n  - Anexo N° 5 (Formulario de Oferta Económica)",
      requisitosContratar: "• **ChileProveedores:** El proveedor adjudicatario debe encontrarse hábil en el registro de proveedores del Estado antes de la suscripción del contrato.\n• **Certificaciones Obligatorias:**\n  - Certificado F30-1 al día (Acreditar que no registra deudas previsionales ni de salud con los trabajadores).\n  - Declaración Jurada de no haber sido inhabilitado para contratar con el Estado.\n• **Firma de Contrato:** Plazo de firma dentro de los 15 días hábiles desde la fecha de adjudicación.",
      criteriosEvaluacion: "• **Propuesta Técnica:** 40% (Metodología y Plan de trabajo)\n• **Precio / Oferta Económica:** 30% (Calculado con la fórmula: POE = 30 * OEB / OEE)\n• **Experiencia Diseñador/a Web:** 15% (Según acreditación en Anexo N°6)\n• **Experiencia Desarrollador/a:** 10% (Según acreditación en Anexo N°7)\n• **Cumplimiento Requisitos Formales:** 3% (Por presentación a tiempo y sin errores de foro inverso)\n• **Pacto de Integridad:** 2% (Por firma y cumplimiento de políticas anticorrupción)",
      montosDuracion: "• **Presupuesto Estimado:** $12.500.000 CLP netos/totales.\n• **Duración del Contrato:** 4 Meses (sin opción de renovación automática).\n• **Condiciones de Pago:** Pago a 30 días posteriores a la recepción conforme de la factura comercial.\n• **Responsable de Pago:** Rodrigo Ramirez (`rodrigo.ramirez@patrimoniocultural.gob.cl`).\n• **Subcontratación:** Estrictamente Prohibida. Su incumplimiento faculta el término anticipado del contrato.",
      garantias: "• **Garantía de Seriedad de la Oferta:** No se exige boleta de seriedad para este proceso según el tramo de monto.\n• **Garantía de Fiel Cumplimiento de Contrato:** Se exige boleta de garantía por un monto equivalente al **5% del valor total del contrato**, la cual debe ser entregada dentro de los 10 días siguientes a la adjudicación.",
      requerimientosTecnicos: "• **Objetivo Principal:** Apoyo a la Subdirección Nacional de Patrimonio Inmaterial en el proceso de actualización del Sistema de Información para la Gestión del Patrimonio Cultural Inmaterial (SIGPA).\n• **Labores Críticas:** Diseño de interfaz gráfica y experiencia de usuario (UX/UI), cambios en código y despliegue/migración en servidor de producción.\n• **Foro Inverso:** Plazo de 3 días corridos para subsanar errores u omisiones formales (penaliza 3% de puntaje formal).\n• **Desempate:** Criterios en orden de prelación: 1) Propuesta Técnica, 2) Experiencia de personal, 3) Oferta Económica, 4) Pacto de Integridad, 5) Cumplimiento formal, 6) Hora de ingreso de la oferta."
    }
  };

  const tenderDraft = {
    title:        'DISEÑO WEB Y APOYO INFORMÁTICO ACTUALIZACIÓN SIGPA',
    budget:       '12500000',
    buyerRegion:  'Región Metropolitana',
    closeDate:    new Date('2026-07-06T19:59:00'),
  } as any;
  const le26Score = calculateScore(tenderDraft, activeCompany);

  await db
    .insert(tenders)
    .values({
      companyId:       activeCompany.id,
      externalCode:    '1067476-19-LE26',
      title:           'DISEÑO WEB Y APOYO INFORMÁTICO ACTUALIZACIÓN SIGPA',
      status:          'Publicada',
      budget:          '12500000',
      currency:        'CLP',
      closeDate:       new Date('2026-07-06T19:59:00'),
      buyerName:       'Servicio Nacional del Patrimonio Cultural (SERPAT)',
      buyerRegion:     'Región Metropolitana',
      buyerRegionCode: 'RM',
      scoreTotalVal:   le26Score.total,
      scoreRubro:      le26Score.rubro,
      scoreRegion:     le26Score.region,
      scoreBudget:     le26Score.budget,
      scoreUrgency:    le26Score.urgency,
      scoreLabel:      le26Score.label,
      rawData:         rawDataForLE26,
      aiSummary:       'Esta licitación consiste en apoyar a la Subdirección Nacional de Patrimonio Inmaterial en el proceso de actualización del SIGPA. Requiere de 1 Diseñador Web y 1 Desarrollador, y prohíbe explícitamente la subcontratación.',
      scoredAt:        new Date(),
    })
    .onConflictDoUpdate({
      target: [tenders.companyId, tenders.externalCode],
      set: {
        title:           'DISEÑO WEB Y APOYO INFORMÁTICO ACTUALIZACIÓN SIGPA',
        status:          'Publicada',
        budget:          '12500000',
        currency:        'CLP',
        closeDate:       new Date('2026-07-06T19:59:00'),
        buyerName:       'Servicio Nacional del Patrimonio Cultural (SERPAT)',
        buyerRegion:     'Región Metropolitana',
        buyerRegionCode: 'RM',
        scoreTotalVal:   le26Score.total,
        scoreRubro:      le26Score.rubro,
        scoreRegion:     le26Score.region,
        scoreBudget:     le26Score.budget,
        scoreUrgency:    le26Score.urgency,
        scoreLabel:      le26Score.label,
        rawData:         rawDataForLE26,
        aiSummary:       'Esta licitación consiste en apoyar a la Subdirección Nacional de Patrimonio Inmaterial en el proceso de actualización del SIGPA. Requiere de 1 Diseñador Web y 1 Desarrollador, y prohíbe explícitamente la subcontratación.',
        scoredAt:        new Date(),
      }
    });

  console.log('[Seed] Licitación real 1067476-19-LE26 sembrada correctamente.');

  // --- Sembrar licitación real 2175-7-LP26 (Atacama) ---
  const rawDataForLP26 = {
    documentos: [
      {
        nombre: "Carpeta de Adjuntos (Ver y descargar todos los archivos)",
        link: "https://www.mercadopublico.cl/Procurement/Modules/Attachment/ViewAttachment.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Ficha de Licitación en Mercado Público",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idLicitacion=2175-7-LP26"
      },
      {
        nombre: "Documentos Administrativos - 1. Resolución Inicio",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Documentos Administrativos - 2. Bases Generales",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Documentos Técnicos - 1. Bases Especiales",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Documentos Técnicos - 2. Bases Técnicas",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Documentos Técnicos - 3. Formularios Administrativos y Técnicos",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Documentos Técnicos - 4. Otros anexos técnicos",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      },
      {
        nombre: "Documentos Económicos - 1. Formulario Económico",
        link: "https://www.mercadopublico.cl/Procurement/Modules/RFB/Attachment/VerAntecedentes.aspx?enc=pZyWWype9C0OVu89zPeXvGFaVLLt6UmCFGTQr2kn9gy5HBFquMUnvkr%2bcYO3lav%2b6rbbIiVzF7G6qGmuHyRY2unX4ZozsJBWmFOMXVu3vgWSg%2fnJ6Ebtmmk2HtRqiLEvzeyaCHOmlaVnZjeMRb3WvqCdQ5S14%2ffunAhpy%2fpUAgY0qtA6Z1gEHz%2b4ricziI0EHLf2d%2fEykwah0S0tJo0Uqrw95238JkyJUq6OtvHLzwL4FgwkIy1yPgSuYvR0f5XkS%2fMQzsZVlfQARB9dH%2f1pkROL%2f414snUKfM40OKUO9xzRgt5hiBiFQxCiupKEyKZ%2b"
      }
    ],
    requisitos: [
      "Confirmar y firmar electrónicamente la Declaración Jurada de Requisitos para Ofertar",
      "Presentar Resolución de Inicio y Bases Generales firmadas",
      "Presentar Formularios Administrativos y Técnicos completos",
      "Presentar Formulario Económico adjunto en el portal"
    ],
    requisitosExcluyentes: [
      "Reunión Informativa Obligatoria los días 09-07-2026 y 10-07-2026 a las 10:00 en Copiapó",
      "Subcontratación estrictamente prohibida en el proceso de ejecución",
      "Garantía de Fiel Cumplimiento de Contrato del 5% del valor neto total"
    ],
    textoBases: {
      caracteristicas: "• **Nombre de la Licitación:** SERVICIO DE MANTENCIÓN PREVENTIVO Y CORRECTIVO DE SISTEMAS DE IMPULSIÓN DE AGUA POTABLE Y SERVIDA DE LA JURISDICCIÓN DE ATACAMA\n• **Estado:** Publicada\n• **Tipo de Licitación:** Pública (LP: igual o superior a 1.000 UTM e inferior a 5.000 UTM)\n• **Convocatoria:** ABIERTO\n• **Moneda:** Unidad de Fomento (UF)\n• **Etapas:** Una Etapa\n• **Toma de Razón:** No requiere Toma de Razón por Contraloría",
      organismo: "• **Razón Social:** CORP ADMINISTRATIVA DEL PODER JUDICIAL\n• **Unidad de Compra:** Corp. Adm. del Poder Judicial - Copiapó\n• **R.U.T.:** 60.301.001-9\n• **Dirección:** Vallejos 780\n• **Comuna:** Copiapó\n• **Región:** Región de Atacama",
      etapasPlazos: "• **Fecha de Cierre (Recepción de Ofertas):** 23-07-2026 12:00:00\n• **Fecha de Publicación:** 03-07-2026 15:32:21\n• **Inicio de Preguntas:** 03-07-2026 19:03:00\n• **Cierre de Preguntas:** 13-07-2026 12:00:00\n• **Publicación de Respuestas:** 15-07-2026 12:00:00\n• **Apertura Técnica:** 24-07-2026 12:00:00\n• **Apertura Económica (Referencial):** 24-07-2026 12:00:00\n• **Fecha Estimada de Adjudicación:** 31-08-2026 12:00:00\n• **Reunión Informativa Obligatoria:** 09-07-2026 10:00:00 y 10-07-2026 10:00:00 en Vallejos 780, Copiapó\n• **Extensión Automática de Plazo:** Si se reciben 2 o menos ofertas al cierre, el plazo se ampliará automáticamente por 2 días hábiles.",
      antecedentes: "• **Obligatorio:** Confirmar y firmar electrónicamente la Declaración Jurada de Requisitos para Ofertar.\n• **Documentos Administrativos:**\n  - Resolución Inicio\n  - Bases Generales\n• **Documentos Técnicos:**\n  - Bases Especiales\n  - Bases Técnicas\n  - Formularios Administrativos y Técnicos\n  - Otros anexos técnicos\n• **Documentos Económicos:**\n  - Formulario Económico",
      requisitosContratar: "• **Inhabilidades en ChileProveedores:** No registrar condenas por cohecho, deudas tributarias > 500 UTM (> 1 año) o > 200 UTM (> 2 años), deudas previsionales/salud > 12 meses, quiebra, suspensión de ChileProveedores, o prácticas antisindicales.\n• **Documentos Obligatorios Persona Natural:**\n  - Fotocopia legalizada de Cédula de Identidad\n  - Declaración jurada de no parentesco (Art. 4 Inciso 6 Ley 19.886)\n• **Documentos Obligatorios Persona Jurídica:**\n  - Fotocopia legalizada del RUT de la empresa\n  - Declaración jurada de no parentesco (Art. 4 Inciso 6 Ley 19.886)\n  - Certificado de Vigencia de la Sociedad\n  - Certificado de Boletín de Informes Comerciales\n  - Certificado de Quiebras / Convenio Judicial",
      criteriosEvaluacion: "• **Evaluación Económica:** 55% (Según Bases Especiales)\n• **Evaluación Técnica:** 40% (Según Bases Especiales)\n• **Evaluación Formalidad:** 5% (Según Bases Especiales)",
      montosDuracion: "• **Estimación en base a:** Presupuesto Disponible\n• **Vigencia del Contrato:** 36 Meses\n• **Renovación automática:** NO\n• **Plazos de pago:** 30 días contra la recepción conforme de la factura comercial\n• **Opciones de pago:** Transferencia Electrónica\n• **Responsable de Pago:** LEONARDO PIÑONES CASTILLO (`finanzas_copiapo@pjud.cl`)\n• **Subcontratación:** No permite subcontratación (según Bases Especiales)",
      garantias: "• **Garantía de Fiel Cumplimiento de Contrato:**\n  - **Monto:** 5% del valor neto del contrato en pesos o equivalente UF\n  - **Glosa:** Para garantizar el fiel cumplimiento del contrato de la licitación ID N°2175-5-LP26\n  - **Vencimiento:** 30-01-2030\n  - **Lugar de entrega:** Oficina de partes de la Administración Zonal, Vallejos 780, Copiapó\n• **Otras Garantías (Correcta Ejecución):**\n  - **Monto:** 5%\n  - **Glosa:** Para garantizar la correcta ejecución de la obra 'Conservación de la Ilustrísima Corte de Apelaciones de Copiapó: Normalización Eléctrica ID 2175-36-LP25'\n  - **Vencimiento:** 31-01-2027",
      requerimientosTecnicos: "• **Productos y Servicios Requeridos:**\n  - Bombas de agua (1 Global) - Cod: 40151510 (Mantenimiento de sistemas de impulsión de agua potable y servidas)\n• **Resolución de Empates:**\n  - a. Oferta con mayor puntaje en oferta económica.\n  - b. Oferta con mayor puntaje en oferta técnica.\n  - c. Oferta con mayor puntaje en el subcriterio técnico de mayor ponderación.\n  - d. Oferta con mayor puntaje en el siguiente subcriterio técnico de mayor ponderación.\n  - e. Definición fundada de la Corporación en base a criterios objetivos."
    }
  };

  const lp26Draft = {
    title:        'SERVICIO DE MANTENCIÓN PREVENTIVO Y CORRECTIVO DE SISTEMAS DE IMPULSIÓN DE AGUA POTABLE Y SERVIDA DE LA JURISDICCIÓN DE ATACAMA',
    budget:       '150000000',
    buyerRegion:  'Región de Atacama',
    closeDate:    new Date('2026-07-23T12:00:00'),
  } as any;
  const lp26Score = calculateScore(lp26Draft, activeCompany);

  await db
    .insert(tenders)
    .values({
      companyId:       activeCompany.id,
      externalCode:    '2175-7-LP26',
      title:           'SERVICIO DE MANTENCIÓN PREVENTIVO Y CORRECTIVO DE SISTEMAS DE IMPULSIÓN DE AGUA POTABLE Y SERVIDA DE LA JURISDICCIÓN DE ATACAMA',
      status:          'Publicada',
      budget:          '150000000',
      currency:        'UF',
      closeDate:       new Date('2026-07-23T12:00:00'),
      buyerName:       'CORP ADMINISTRATIVA DEL PODER JUDICIAL',
      buyerRegion:     'Región de Atacama',
      buyerRegionCode: 'III',
      scoreTotalVal:   lp26Score.total,
      scoreRubro:      lp26Score.rubro,
      scoreRegion:     lp26Score.region,
      scoreBudget:     lp26Score.budget,
      scoreUrgency:    lp26Score.urgency,
      scoreLabel:      lp26Score.label,
      rawData:         rawDataForLP26,
      aiSummary:       'Esta licitación consiste en el mantenimiento preventivo y correctivo de los sistemas de impulsión de agua potable y servida del Poder Judicial en Atacama. El contrato dura 36 meses y prohíbe subcontratación.',
      scoredAt:        new Date(),
    })
    .onConflictDoUpdate({
      target: [tenders.companyId, tenders.externalCode],
      set: {
        title:           'SERVICIO DE MANTENCIÓN PREVENTIVO Y CORRECTIVO DE SISTEMAS DE IMPULSIÓN DE AGUA POTABLE Y SERVIDA DE LA JURISDICCIÓN DE ATACAMA',
        status:          'Publicada',
        budget:          '150000000',
        currency:        'UF',
        closeDate:       new Date('2026-07-23T12:00:00'),
        buyerName:       'CORP ADMINISTRATIVA DEL PODER JUDICIAL',
        buyerRegion:     'Región de Atacama',
        buyerRegionCode: 'III',
        scoreTotalVal:   lp26Score.total,
        scoreRubro:      lp26Score.rubro,
        scoreRegion:     lp26Score.region,
        scoreBudget:     lp26Score.budget,
        scoreUrgency:    lp26Score.urgency,
        scoreLabel:      lp26Score.label,
        rawData:         rawDataForLP26,
        aiSummary:       'Esta licitación consiste en el mantenimiento preventivo y correctivo de los sistemas de impulsión de agua potable y servida del Poder Judicial en Atacama. El contrato dura 36 meses y prohíbe subcontratación.',
        scoredAt:        new Date(),
      }
    });

  console.log('[Seed] Licitación real 2175-7-LP26 sembrada correctamente.');

  console.log('[Seed] Encolando ingesta de prueba para la API de Mercado Público...');

  // 3. Encolar job de ingesta real usando BullMQ
  await ingestionQueue.add('fetch-tenders-seed', {
    companyId: activeCompany.id,
    ticket:    activeCompany.apiTicket,
  });

  console.log('[Seed] ¡Ingesta de licitaciones reales encolada en BullMQ! Proceso terminado.');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});

