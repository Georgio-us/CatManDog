"""Verify public retail price metadata without browser automation"""
import concurrent.futures
import datetime
import html
import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def nodes(value):
    if isinstance(value,list):
        for item in value:yield from nodes(item)
    elif isinstance(value,dict):
        if value.get('@type') in ['Product','ProductGroup']:yield value
        if '@graph' in value:yield from nodes(value['@graph'])

def fetch(offer):
    result=subprocess.run(['curl','-L','--max-time','25','-sS','-w','\n%{http_code}',offer['sourceUrl']],capture_output=True,text=True)
    body,_,status=result.stdout.rpartition('\n')
    record=dict(offer,httpStatus=status,priceEvidenceType='web_search_index',availability='not_verified',checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'))
    record['currentPriceEUR']=None
    if status!='200':
        record['verificationNote']='Прямая страница недоступна, значение из веб-индекса не подтверждено напрямую'
        return record
    candidates=[]
    for raw in re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>',body,re.S|re.I):
        try:data=json.loads(raw)
        except ValueError:continue
        for product in nodes(data):
            product_offers=product.get('offers',[])
            if isinstance(product_offers,dict):product_offers=[product_offers]
            for variant in product_offers:
                if not isinstance(variant,dict):continue
                price=variant.get('price');currency=variant.get('priceCurrency')
                if price is None and isinstance(variant.get('priceSpecification'),dict):
                    price=variant['priceSpecification'].get('price');currency=variant['priceSpecification'].get('priceCurrency')
                try:price=float(str(price).replace(',','.'))
                except (ValueError,TypeError):continue
                if price>0 and currency=='EUR':candidates.append(dict(price=price,availability=variant.get('availability','').rsplit('/',1)[-1] or 'not_verified',title=product.get('name'),seller=variant.get('seller')))
    record['structuredCandidates']=candidates
    if candidates:
        usable=[c for c in candidates if c['availability'] not in ['OutOfStock','Discontinued','SoldOut']]
        chosen=min(usable or candidates,key=lambda c:c['price'])
        record.update(currentPriceEUR=chosen['price'],availability=chosen['availability'],priceEvidenceType='live_public_structured_offer',sourceProductName=chosen['title'],seller=chosen['seller'])
    else:
        record['verificationNote']='Страница прочитана, явная связка EUR-цены с этим товаром в структурированных данных не найдена'
    return record

if __name__=='__main__':
    offers=json.loads((ROOT/'analogue-offers.json').read_text())
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for i,r in enumerate(pool.map(fetch,offers),1):
            results.append(r)
            if i%10==0:print(json.dumps({'processed':i,'total':len(offers)}),flush=True)
    # Extraction is provisional: product groups can include filters or other accessories
    # Preserve the manually reviewed snapshot used by the report
    (ROOT/'analogue-price-evidence-unreviewed.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    for r in results:print(json.dumps({k:r.get(k) for k in ['id','name','httpStatus','currentPriceEUR','observedPriceEUR','availability','sourceProductName']},ensure_ascii=False),flush=True)
