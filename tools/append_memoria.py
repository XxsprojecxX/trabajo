import json, sys, hashlib, datetime
from pathlib import Path

FILE = Path('MEMORIA_PERSISTENTE.json')
entry = json.loads(sys.stdin.read())

entry.setdefault('date', datetime.datetime.now().astimezone().isoformat())

core = json.dumps({
    k: entry.get(k) for k in ['task','blocks','decisions','outputs']
}, ensure_ascii=False, sort_keys=True)
entry['hash'] = 'sha256:' + hashlib.sha256(core.encode('utf-8')).hexdigest()

if not FILE.exists():
    FILE.write_text('[]', encoding='utf-8')

arr = json.loads(FILE.read_text(encoding='utf-8'))
arr.append(entry)
FILE.write_text(json.dumps(arr, ensure_ascii=False, indent=2), encoding='utf-8')
print('OK: entrada añadida')
