function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&#39;': "'",
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
    '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
    '&uuml;': 'ü', '&Uuml;': 'Ü',
    '&ordm;': 'º', '&orda;': 'ª',
    '&deg;': '°',
    '&iquest;': '¿',
    '&iexcl;': '¡',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ndash;': '–',
    '&mdash;': '—',
  };

  let result = str;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }
  result = result.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  return result;
}

function parseBasesHtml(html: string): Record<string, string> {
  const parts = html.split(/<div\s+id="Ficha(\d+)"/i);
  const result: Record<string, string> = {};

  const keysMap = [
    'none',
    'caracteristicas',
    'organismo',
    'etapasPlazos',
    'antecedentes',
    'requisitosContratar',
    'criteriosEvaluacion',
    'montosDuracion',
    'garantias',
    'requerimientosTecnicos'
  ];

  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i]);
    const key = keysMap[num];
    if (!key) continue;

    let content = parts[i + 1] || '';
    content = content.replace(/^[^>]*>/, '');

    let singleLine = content.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
    singleLine = singleLine.replace(/\d+\s*\.\s*[a-záéíóúñ\s]+/gi, '');

    singleLine = singleLine
      .replace(/<\/td>\s*<td[^>]*?>/gi, ' : ')
      .replace(/<\/tr>\s*<tr[^>]*?>/gi, '\n')
      .replace(/<\/div>\s*<div[^>]*?class="cell_a"[^>]*?>/gi, ' : ')
      .replace(/<\/div>\s*<div[^>]*?class="contenedor_00"[^>]*?>/gi, '\n')
      .replace(/<\/div>\s*<div[^>]*?class="row_a"[^>]*?>/gi, '\n');

    let cleaned = singleLine
      .replace(/<script[^]*?>[^]*?<\/script>/gi, '')
      .replace(/<style[^]*?>[^]*?<\/style>/gi, '')
      .replace(/<!--[^]*?-->/g, '')
      .replace(/<[^>]+>/g, '');

    cleaned = decodeHtmlEntities(cleaned);

    const lines = cleaned.split('\n')
      .map(line => line.trim().replace(/\s+/g, ' '))
      .filter(line => line.length > 0 && !line.startsWith('Subir') && !line.startsWith('Enviar'));

    const formattedLines: string[] = [];
    for (let j = 0; j < lines.length; j++) {
      let line = lines[j];
      line = line.replace(/\s*:\s*:/g, ':').replace(/^:\s*/, '');
      line = line.replace(/\s*Subir$/i, '');

      if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const label = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        
        if (label.length > 0 && value.length > 0 && label !== ':') {
          formattedLines.push(`• **${label}:** ${value}`);
        } else if (value.length > 0) {
          formattedLines.push(`• ${value}`);
        } else if (label.length > 0) {
          formattedLines.push(`• ${label}`);
        }
      } else {
        formattedLines.push(`• ${line}`);
      }
    }

    result[key] = formattedLines.join('\n');
  }

  return result;
}

export async function resolveBasesFromFicha(externalCode: string): Promise<Record<string, string> | null> {
  try {
    const targetUrl = `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idLicitacion=${externalCode}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) return null;
    const html = await response.text();
    const result = parseBasesHtml(html);
    if (Object.keys(result).length > 0) {
      return result;
    }
    return null;
  } catch (error: any) {
    console.error(`[Scraper] Error scraping bases for ${externalCode}:`, error.message);
    return null;
  }
}
