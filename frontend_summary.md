## Next.js — Páginas
./.backup_navfix_20250827-023623/app/contenidos/page.tsx
./.backup_navfix_20250827-023623/app/creadoras/page.tsx
./.backup_navfix_20250827-023623/app/insights/page.tsx
./.backup_navfix_20250827-023623/app/topicos/page.tsx
./.next/server/app/comments/page.js
./.next/server/app/contenidos/page.js
./.next/server/app/topicos/page.js
./.next/static/chunks/app/comments/page.js
./.next/static/chunks/app/contenidos/page.js
./.next/static/chunks/app/topicos/page.js
./.next/types/app/comments/page.ts
./.next/types/app/contenidos/page.ts
./.next/types/app/topicos/page.ts
./app/comments/page.tsx
./app/contenidos-lite/page.tsx
./app/contenidos/page.tsx
./app/creadoras/page.tsx
./app/dashboard/page.tsx
./app/insights/page.tsx
./app/page.tsx
./app/topicos-lite/page.tsx
./app/topicos/_bak/page.tsx
./app/topicos/pack/page.tsx
./app/topicos/page.tsx

## Next.js — Rutas API
./.next/server/app/api/comments/v1/route.js
./.next/server/app/api/contenidos/route.js
./.next/server/app/api/topicos/v2/route.js
./.next/static/chunks/app/api/comments/v1/route.js
./.next/static/chunks/app/api/contenidos/route.js
./.next/static/chunks/app/api/topicos/v2/route.js
./.next/types/app/api/comments/v1/route.ts
./.next/types/app/api/contenidos/route.ts
./.next/types/app/api/topicos/v2/route.ts
./app/api/bq-dryrun/route.ts
./app/api/comments/v1/route.ts
./app/api/contenidos/route.ts
./app/api/creadoras/route.ts
./app/api/embeddings/route.ts
./app/api/enrichment/route.ts
./app/api/health/route.ts
./app/api/ig/route.ts
./app/api/insights/route.ts
./app/api/topicos.off/route.ts
./app/api/topicos.off/topicos/route.ts
./app/api/topicos/route.ts
./app/api/topicos/v2/route.ts
./node_modules/color-convert/route.js

## Next.js — Rutas API
./.next/server/app/api/comments/v1/route.js
./.next/server/app/api/contenidos/route.js
./.next/server/app/api/topicos/v2/route.js
./.next/static/chunks/app/api/comments/v1/route.js
./.next/static/chunks/app/api/contenidos/route.js
./.next/static/chunks/app/api/topicos/v2/route.js
./.next/types/app/api/comments/v1/route.ts
./.next/types/app/api/contenidos/route.ts
./.next/types/app/api/topicos/v2/route.ts
./app/api/bq-dryrun/route.ts
./app/api/comments/v1/route.ts
./app/api/contenidos/route.ts
./app/api/creadoras/route.ts
./app/api/embeddings/route.ts
./app/api/enrichment/route.ts
./app/api/health/route.ts
./app/api/ig/route.ts
./app/api/insights/route.ts
./app/api/topicos.off/route.ts
./app/api/topicos.off/topicos/route.ts
./app/api/topicos/route.ts
./app/api/topicos/v2/route.ts
./node_modules/color-convert/route.js

## Next.js — Config & package.json
next.config.js
package.json

## Endpoints externos
./middleware.ts:12:    if (!skip && (pathname === '/api/topicos' || pathname.startsWith('/api/topicos/'))) {
./middleware.ts:14:      rewriteURL.pathname = '/api/topicos/v2';
./middleware.ts:22:  matcher: ['/api/topicos', '/api/topicos/:path*'],
./app/insights/BigQueryStrip.tsx:35:        {resultados.length} registros | Fuente: /api/insights
./app/insights/page.tsx:1:// app/insights/page.tsx (conectado a /api/insights)
./app/insights/page.tsx:39:  const url = `${base}/api/insights?limit=200`;
./app/comments/page.tsx:28:        const res = await fetch(`/api/comments/v1?creators=${creators}&limit=60`, { cache: "no-store" });
./app/topicos/page.tsx.next:62:  const url = '/api/topicos?limit=120';
./app/topicos/page.tsx.bak.1757542146:176:  const url = '/api/topicos?limit=120';
./app/topicos/_bak/page.tsx.20250910-143805:167:  const url = '/api/topicos?limit=120';
./app/topicos/_bak/page.tsx.20250910-141549:167:  const url = '/api/topicos?limit=120';
./app/topicos/page.tsx.safe.bak:31:        const res = await fetch("/api/topicos?limit=30", { headers: { Accept: "application/json" }});
./app/topicos/page.tsx.safe.bak:66:        <div className="text-sm text-gray-500">Fuente viva <code>/api/topicos</code> (v2)</div>
./app/topicos/page.tsx:397:  const url = '/api/topicos/v2?limit=120'; // Apuntamos a la API v2
./app/topicos/page.tsx.good.alma:62:  const url = '/api/topicos?limit=120';
./app/topicos-page.tsx.bak.1757542146:31:        const res = await fetch("/api/topicos?limit=30", { headers: { Accept: "application/json" }});
./app/topicos-page.tsx.bak.1757542146:67:        <div className="text-sm text-gray-500">Fuente viva <code>/api/topicos</code> (v2)</div>
./app/topicos-lite/page.tsx:17:  const res = await fetch("http://localhost:3000/api/topicos?limit=20", { cache: "no-store" });
./app/topicos-lite/page.tsx:18:  if (!res.ok) throw new Error("No pude leer /api/topicos");
./app/creadoras/page.tsx:18:  const res  = await fetch(`${base}/api/creadoras?limit=60`, { cache: 'no-store' });
./app/contenidos-lite/page.tsx:6:  const res = await fetch('/api/contenidos', { cache: 'no-store' });
## Endpoints externos
./middleware.ts:12:    if (!skip && (pathname === '/api/topicos' || pathname.startsWith('/api/topicos/'))) {
./middleware.ts:14:      rewriteURL.pathname = '/api/topicos/v2';
./middleware.ts:22:  matcher: ['/api/topicos', '/api/topicos/:path*'],
./app/insights/BigQueryStrip.tsx:35:        {resultados.length} registros | Fuente: /api/insights
./app/insights/page.tsx:1:// app/insights/page.tsx (conectado a /api/insights)
./app/insights/page.tsx:39:  const url = `${base}/api/insights?limit=200`;
./app/comments/page.tsx:28:        const res = await fetch(`/api/comments/v1?creators=${creators}&limit=60`, { cache: "no-store" });
./app/topicos/page.tsx.next:62:  const url = '/api/topicos?limit=120';
./app/topicos/page.tsx.bak.1757542146:176:  const url = '/api/topicos?limit=120';
./app/topicos/_bak/page.tsx.20250910-143805:167:  const url = '/api/topicos?limit=120';
./app/topicos/_bak/page.tsx.20250910-141549:167:  const url = '/api/topicos?limit=120';
./app/topicos/page.tsx.safe.bak:31:        const res = await fetch("/api/topicos?limit=30", { headers: { Accept: "application/json" }});
./app/topicos/page.tsx.safe.bak:66:        <div className="text-sm text-gray-500">Fuente viva <code>/api/topicos</code> (v2)</div>
./app/topicos/page.tsx:397:  const url = '/api/topicos/v2?limit=120'; // Apuntamos a la API v2
./app/topicos/page.tsx.good.alma:62:  const url = '/api/topicos?limit=120';
./app/topicos-page.tsx.bak.1757542146:31:        const res = await fetch("/api/topicos?limit=30", { headers: { Accept: "application/json" }});
./app/topicos-page.tsx.bak.1757542146:67:        <div className="text-sm text-gray-500">Fuente viva <code>/api/topicos</code> (v2)</div>
./app/topicos-lite/page.tsx:17:  const res = await fetch("http://localhost:3000/api/topicos?limit=20", { cache: "no-store" });
./app/topicos-lite/page.tsx:18:  if (!res.ok) throw new Error("No pude leer /api/topicos");
./app/creadoras/page.tsx:18:  const res  = await fetch(`${base}/api/creadoras?limit=60`, { cache: 'no-store' });
./app/contenidos-lite/page.tsx:6:  const res = await fetch('/api/contenidos', { cache: 'no-store' });
./app/contenidos-lite/page.tsx:7:  if (!res.ok) throw new Error('No pude leer /api/contenidos');
./app/dashboard/page.tsx:87:          fetch(`${base}/api/insights?limit=200`, { cache: 'no-store' }),
./app/dashboard/page.tsx:88:          fetch(`${base}/api/contenidos?limit=400`, { cache: 'no-store' }),
./app/dashboard/page.tsx:89:          fetch(`${base}/api/topicos?sinceDays=30&limit=200`, { cache: 'no-store' }),
./app/dashboard/page.tsx:90:          fetch(`${base}/api/creadoras?limit=20`, { cache: 'no-store' }),
./app/api/insights/route.ts:1:// app/api/insights/route.ts (BigQuery + SA)
./app/api/health/route.ts:4:  return NextResponse.json({ ok: true, route: '/api/health' });
./app/api/creadoras/route.ts:15:  try { fs.appendFileSync('/tmp/next.out', `[${new Date().toISOString()}] /api/creadoras ${msg} ${JSON.stringify(meta)}\n`); } catch {}
./app/api/_bak/route.ts.bak:42:  const v1 = new URL('/api/topicos', origin);
./app/api/_bak/route.ts.bak:76:    const res = await fetch(`${origin}/api/enrichment`, {
./app/api/_bak/route.ts.bak:98:  if (dryrun) return NextResponse.json({ ok: true, route: '/api/topicos/v2', dryrun: true, test: 1 });
./app/api/_bak/route.ts.bak:130:        provider: process.env.ENRICHMENT_MOCK === '1' ? 'deterministic' : '/api/enrichment',
./app/api/_bak/route.ts.bak:137:      hint: 'Verifica que /api/topicos (v1) responde y que BIGQUERY_* credenciales están configuradas. Usa ?dryrun=1 para prueba rápida.',
./app/api/_bak/route.ts.bak_1757354280:19:    // ¿Forzar mock? => /api/topicos?mock=1
./app/api/topicos.off/topicos/route.ts.probesrc.bak:1:// app/api/topicos/route.ts — handler limpio con BigQuery (JOIN a vw_posts_pilares)
./app/api/topicos.off/topicos/route.ts.probesrc.bak:81:      return NextResponse.json({ ok: true, route: '/api/topicos' }, { status: 200 });
./app/api/topicos.off/topicos/route.ts.probesrc.bak:148:    console.error('GMX /api/topicos error:', e?.stack || e);
./app/api/topicos.off/topicos/route.ts.qtry.bak:1:// app/api/topicos/route.ts — handler limpio con BigQuery (JOIN a vw_posts_pilares)
./app/api/topicos.off/topicos/route.ts.qtry.bak:81:      return NextResponse.json({ ok: true, route: '/api/topicos' }, { status: 200 });
./app/api/topicos.off/topicos/route.ts.qtry.bak:189:    console.error('GMX /api/topicos error:', e?.stack || e);
./app/api/topicos.off/topicos/route.ts.joinfix.bak:1:// app/api/topicos/route.ts — handler limpio con BigQuery (JOIN a vw_posts_pilares)
./app/api/topicos.off/topicos/route.ts.joinfix.bak:81:      return NextResponse.json({ ok: true, route: '/api/topicos' }, { status: 200 });
./app/api/topicos.off/topicos/route.ts.joinfix.bak:192:    console.error('GMX /api/topicos error:', e?.stack || e);
./app/api/topicos.off/topicos/route.ts:1:// app/api/topicos/route.ts — versión estable sin JOIN (dominio gmx), sin “ALMA”
./app/api/topicos.off/topicos/route.ts:79:      return NextResponse.json({ ok: true, route: '/api/topicos' }, { status: 200 });
./app/api/topicos.off/topicos/route.ts:112:    console.error('GMX /api/topicos error:', e?.stack || e);
./app/api/topicos.off/topicos/route.ts.probe.bak:1:// app/api/topicos/route.ts — handler limpio con BigQuery (JOIN a vw_posts_pilares)
./app/api/topicos.off/topicos/route.ts.probe.bak:81:      return NextResponse.json({ ok: true, route: '/api/topicos' }, { status: 200 });
./app/api/topicos.off/topicos/route.ts.probe.bak:122:    console.error('GMX /api/topicos error:', e?.stack || e);
## Envs en Front
./middleware.ts:5:  if (process.env.TOPICOS_VIEW === 'v2') {
./app/insights/page.tsx:38:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./app/creadoras/page.tsx:17:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./app/dashboard/page.tsx:79:    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
./app/api/insights/route.ts:32:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/comments/v1/route.ts:8:    projectId: process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
./app/api/comments/v1/route.ts:10:    location: process.env.BQ_LOCATION || "US",
./app/api/comments/v1/route.ts:25:    const viewFQN = process.env.COMMENTS_VIEW_FQN || "galletas-piloto-ju-250726.gmx_week_2025_09_04_2025_09_11.vw_comments_app_api";
./app/api/topicos/route.ts.bak.1757540218:47:  return new BigQuery({ projectId, keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
./app/api/topicos/v2/route.ts:4:const VIEW_FQN = process.env.TOPICOS_VIEW_V2 || "gmx.vw_topicos_v2";
./app/api/topicos/route.ts:104:  return new BigQuery({ projectId, keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS })
./app/api/embeddings/route.ts:8:    return Response.json({ ok: true, provider_order: process.env.EMBEDDINGS_PROVIDER_ORDER, dim: v.length, preview: v.slice(0,8) });
./app/api/ig/route.ts:6:    const sheetId = process.env.IG_SHEET_ID!;
./app/api/ig/route.ts:7:    const tab = process.env.IG_SHEET_TAB || 'ig_master';
./app/api/bq-dryrun/route.ts:20:        projectId: process.env.GOOGLE_PROJECT_ID,
./app/api/bq-dryrun/route.ts:21:        dataset: process.env.GOOGLE_DATASET,
./app/api/bq-dryrun/route.ts:22:        table: process.env.GOOGLE_TABLE,
./app/api/_bak/route.ts.bak:72:  const mock = process.env.ENRICHMENT_MOCK === '1';
./app/api/_bak/route.ts.bak:105:    const apiKey = process.env.API_KEY;
./app/api/_bak/route.ts.bak:129:        mock: process.env.ENRICHMENT_MOCK === '1',
./app/api/_bak/route.ts.bak:130:        provider: process.env.ENRICHMENT_MOCK === '1' ? 'deterministic' : '/api/enrichment',
./app/api/_bak/route.ts.bak.limit:4:const VIEW_FQN = process.env.TOPICOS_VIEW_V2 || "gmx.vw_topicos_v2";
./app/api/_bak/route.ts.bak_1757354280:54:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.probesrc.bak:91:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.probesrc.bak:97:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
./app/api/topicos.off/topicos/route.ts.probesrc.bak:105:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null
./app/api/topicos.off/topicos/route.ts.probesrc.bak:117:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.qtry.bak:93:          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.qtry.bak:132:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.qtry.bak:138:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
./app/api/topicos.off/topicos/route.ts.qtry.bak:146:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null
./app/api/topicos.off/topicos/route.ts.qtry.bak:158:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.joinfix.bak:93:          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.joinfix.bak:135:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.joinfix.bak:141:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
./app/api/topicos.off/topicos/route.ts.joinfix.bak:149:        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null
./app/api/topicos.off/topicos/route.ts.joinfix.bak:161:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts:87:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/topicos/route.ts.probe.bak:91:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/route.ts.syntaxfix.bak:85:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/route.ts.harden.bak:85:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/route.ts:96:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/api/topicos.off/route.ts.bak:74:      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
./app/contenidos/page.datawire.backup.tsx:16:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./app/contenidos/page.tsx:21:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./.backup_navfix_20250827-023623/app/insights/page.tsx:5:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./.backup_navfix_20250827-023623/app/topicos/page.tsx:12:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./.backup_navfix_20250827-023623/app/contenidos/page.tsx:14:  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
./node_modules/styled-jsx/dist/babel/index.js:5488:                if (process.env.BABEL_TYPES_8_BREAKING) (0, _validate.validateChild)(node, subkey, v);
./node_modules/styled-jsx/dist/babel/index.js:5782:                default: !process.env.BABEL_TYPES_8_BREAKING ? [] : undefined
## BigQuery FQNs (root + front)
./app/api/topicos/route.ts:92:  // Construimos FQN como `project.dataset.vista` si viewFqn viene como dataset.vista
./frontend/node_modules/zod/src/v4/classic/tests/string.test.ts:116:    `email.domain.com`,
./frontend/node_modules/zod/src/v4/classic/tests/string.test.ts:127:    `Abc.example.com`,
./frontend/node_modules/zod/src/v3/tests/string.test.ts:111:    `email.domain.com`,
./frontend/node_modules/zod/src/v3/tests/string.test.ts:122:    `Abc.example.com`,
./frontend/node_modules/styled-jsx/dist/babel/index.js:17737:   * `Array.prototype.forEach` takes.
./frontend/node_modules/styled-jsx/readme.md:692:Example of `next.config.js` to integrate `styled-jsx/webpack`:
./frontend/node_modules/styled-jsx/readme.md:909:No, this feature is not supported. However we support React Fragments, which are available in React `16.2.0` and above.
./frontend/node_modules/@pkgjs/parseargs/internal/primordials.js:47:// It is using `bind.bind(call)` to avoid using `Function.prototype.bind`
./frontend/node_modules/@pkgjs/parseargs/internal/primordials.js:48:// and `Function.prototype.call` after it may have been mutated by users.
./frontend/node_modules/@pkgjs/parseargs/internal/primordials.js:54:// It is using `bind.bind(apply)` to avoid using `Function.prototype.bind`
./frontend/node_modules/@pkgjs/parseargs/internal/primordials.js:55:// and `Function.prototype.apply` after it may have been mutated by users.
./frontend/node_modules/@pkgjs/parseargs/internal/primordials.js:60:// also create `${prefix}${key}Apply`, which uses `Function.prototype.apply`,
./frontend/node_modules/@pkgjs/parseargs/internal/primordials.js:61:// instead of `Function.prototype.call`, and thus doesn't require iterator
./frontend/node_modules/@types/node/tls.d.ts:1214:     * Defaults to the content of `crypto.constants.defaultCoreCipherList`, unless
./frontend/node_modules/@types/node/tty.d.ts:13: * the `process.stdout.isTTY` property is `true`:
./frontend/node_modules/@types/node/crypto.d.ts:3797:         * returned. The returned name might be an exact match (e.g., `foo.example.com`)
./frontend/node_modules/@types/node/crypto.d.ts:3988:     * * `crypto.constants.ENGINE_METHOD_RSA`
./frontend/node_modules/@types/node/crypto.d.ts:3989:     * * `crypto.constants.ENGINE_METHOD_DSA`
./frontend/node_modules/@types/node/crypto.d.ts:3990:     * * `crypto.constants.ENGINE_METHOD_DH`
./frontend/node_modules/@types/node/crypto.d.ts:3991:     * * `crypto.constants.ENGINE_METHOD_RAND`
./frontend/node_modules/@types/node/crypto.d.ts:3992:     * * `crypto.constants.ENGINE_METHOD_EC`
./frontend/node_modules/@types/node/crypto.d.ts:3993:     * * `crypto.constants.ENGINE_METHOD_CIPHERS`
./frontend/node_modules/@types/node/crypto.d.ts:3994:     * * `crypto.constants.ENGINE_METHOD_DIGESTS`
./frontend/node_modules/@types/node/crypto.d.ts:3995:     * * `crypto.constants.ENGINE_METHOD_PKEY_METHS`
./frontend/node_modules/@types/node/crypto.d.ts:3996:     * * `crypto.constants.ENGINE_METHOD_PKEY_ASN1_METHS`
./frontend/node_modules/@types/node/crypto.d.ts:3997:     * * `crypto.constants.ENGINE_METHOD_ALL`
./frontend/node_modules/@types/node/crypto.d.ts:3998:     * * `crypto.constants.ENGINE_METHOD_NONE`
./frontend/node_modules/@types/node/crypto.d.ts:4012:     * A convenient alias for `crypto.webcrypto.subtle`.
./frontend/node_modules/@types/node/crypto.d.ts:4224:             * Valid key usages depend on the key algorithm (identified by `cryptokey.algorithm.name`).
./frontend/node_modules/@types/node/trace_events.d.ts:16: * * `node.threadpoolwork.sync`: Enables capture of trace data for threadpool synchronous operations, such as `blob`, `zlib`, `crypto` and `node_api`.
./frontend/node_modules/@types/node/trace_events.d.ts:17: * * `node.threadpoolwork.async`: Enables capture of trace data for threadpool asynchronous operations, such as `blob`, `zlib`, `crypto` and `node_api`.
./frontend/node_modules/@types/node/trace_events.d.ts:18: * * `node.dns.native`: Enables capture of trace data for DNS queries.
./frontend/node_modules/@types/node/trace_events.d.ts:19: * * `node.net.native`: Enables capture of trace data for network.
./frontend/node_modules/@types/node/trace_events.d.ts:21: * * `node.fs.sync`: Enables capture of trace data for file system sync methods.
./frontend/node_modules/@types/node/trace_events.d.ts:22: * * `node.fs_dir.sync`: Enables capture of trace data for file system sync directory methods.
./frontend/node_modules/@types/node/trace_events.d.ts:23: * * `node.fs.async`: Enables capture of trace data for file system async methods.
./frontend/node_modules/@types/node/trace_events.d.ts:24: * * `node.fs_dir.async`: Enables capture of trace data for file system async directory methods.
./frontend/node_modules/@types/node/trace_events.d.ts:26: *    * `node.perf.usertiming`: Enables capture of only Performance API User Timing
./frontend/node_modules/@types/node/trace_events.d.ts:28: *    * `node.perf.timerify`: Enables capture of only Performance API timerify
./frontend/node_modules/@types/node/trace_events.d.ts:30: * * `node.promises.rejections`: Enables capture of trace data tracking the number
./frontend/node_modules/@types/node/trace_events.d.ts:32: * * `node.vm.script`: Enables capture of trace data for the `node:vm` module's `runInNewContext()`, `runInContext()`, and `runInThisContext()` methods.
./frontend/node_modules/@types/node/os.d.ts:480:     * priority classes, `priority` is mapped to one of six priority constants in `os.constants.priority`. When retrieving a process priority level, this range
./frontend/node_modules/@types/node/buffer.d.ts:307:             * This is not the same as [`String.prototype.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length), which does not account
./frontend/node_modules/@types/node/stream/web.d.ts:40:    // copy from lib.dom.d.ts
./frontend/node_modules/@types/node/vm.d.ts:284:         *    If `contextObject` is `vm.constants.DONT_CONTEXTIFY`, don't contextify anything.
./frontend/node_modules/@types/node/vm.d.ts:313:         * @param contextObject Either `vm.constants.DONT_CONTEXTIFY` or an object that will be contextified.
./frontend/node_modules/@types/node/vm.d.ts:443:     * without the contextifying quirks, pass `vm.constants.DONT_CONTEXTIFY` as the `contextObject`
./frontend/node_modules/@types/node/vm.d.ts:444:     * argument. See the documentation of `vm.constants.DONT_CONTEXTIFY` for details.
./frontend/node_modules/@types/node/vm.d.ts:455:     * @param contextObject Either `vm.constants.DONT_CONTEXTIFY` or an object that will be contextified.
