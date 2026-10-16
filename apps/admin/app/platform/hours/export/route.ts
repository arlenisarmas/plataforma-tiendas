import { NextResponse, type NextRequest } from 'next/server';
import { periodRange, platformWorkHours } from '../../../../lib/platform-data';
import { userClient } from '../../../../lib/server-client';

function csvCell(value: string | number | null): string {
  const text = String(value ?? '');
  // Evita fórmulas al abrir en Excel y escapa comillas.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Horas por persona y tienda en CSV (solo admins: la función SQL lo verifica). */
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('period') === 'month' ? 'month' : 'week';
  const range = periodRange(kind);
  const client = await userClient();
  let rows: Awaited<ReturnType<typeof platformWorkHours>>;
  try { rows = await platformWorkHours(client, range.from, range.to); }
  catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }
  const lines = [['persona', 'correo', 'tienda', 'minutos', 'horas', 'sesiones'].map(csvCell).join(','),
    ...rows.map((row) => [row.full_name, row.email, row.store_name ?? '', row.minutes, (row.minutes / 60).toFixed(2), row.sessions]
      .map(csvCell).join(','))];
  return new NextResponse(`\uFEFF${lines.join('\r\n')}\r\n`, { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="horarios-${range.from}-${range.to}.csv"`,
    'Cache-Control': 'no-store' } });
}
