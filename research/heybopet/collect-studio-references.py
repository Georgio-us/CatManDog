import json,subprocess,concurrent.futures
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[2]
products=json.load(open(ROOT/'research/heybopet/catalogue.json'))['products']
def fetch(p):
 url=p['imageSourceUrls'][0];name=Path(urlparse(url).path).name;existing='assets/heybopet/'+name;dest=existing if (ROOT/existing).exists() else 'assets/heybopet/references/'+name
 if not (ROOT/dest).exists():(ROOT/dest).write_bytes(subprocess.check_output(['curl','-g','-fLsS','--max-time','40',url]))
 return {**p,'assetId':p['model'].lower().removeprefix('heybopet-'),'referencePath':dest,'referenceUrl':url,'referenceSource':p['sourceUrl']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(fetch,products))
(ROOT/'research/heybopet/studio-references.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('Collected',len(rows),'model references')
