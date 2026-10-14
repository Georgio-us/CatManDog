import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
manifest=json.load(open(ROOT/'research/compact-treats-care-studio-manifest.json'))
products=[]
groups={'creamy':('Лакомства','Кремовые лакомства'),'snacks':('Лакомства','Снеки и деликатесы'),'toppers':('Лакомства','Супы и топперы'),'malt':('Уход','Мальт-пасты и снеки'),'oil':('Уход','Масло для кожи и шерсти'),'care':('Уход','Дополнительный уход')}
for r in manifest['assets']:
 pack=r['referencePack'];cat,group=groups[r['selectionGroup']]
 label=pack.get('packLabel') or f"{pack['amount']} {pack['unit']}"
 label=label.replace('ml','мл').replace('g','г').replace('.0 ',' ')
 if r['id']=='tc-bfbb53d6d1':label='Лоток для выращивания травы'
 weight=(pack['quantity']*pack['amount']/1000) if pack['unit']=='g' and r['id']!='tc-bfbb53d6d1' else None
 p={'id':r['id'],'name':r['displayName'],'brand':r['brand'],'category':cat,'pet':'cat','price':None,'priceStatus':'pending','purchasePrice':None,'purchasePriceStatus':'pending','availabilityStatus':'pending','isReal':True,'isNew':True,'tag':group,'line':r['brand']+' · '+label,'sizes':[label],'weight':label,'optionLabel':'Упаковка','selectionGroup':r['selectionGroup'],'description':r['displayName']+' - '+label,'details':['Упаковка: '+label,'Используйте по инструкции на упаковке производителя','Для кошек'],'ean':r.get('referenceGtin'),'packageWeightKg':weight,'image':{'src':r['displayPath'],'alt':r['displayName']+' - '+label,'presentation':'editorial','generated':True,'originalSrc':r['referencePath']},'productSource':{'name':r['referenceRetailer'],'url':r['referenceSource'],'kind':'retailer'},'imageSource':{'name':r['referenceRetailer'],'pageUrl':r['referenceSource'],'url':r['referenceUrl']}}
 # One exact photographed package per selected family; other researched pack sizes remain in research
 v={**p,'id':p['id']+'-reference-pack','label':label};p.update(defaultVariantId=v['id'],variants=[v]);products.append(p)
assert len(products)==34
(ROOT/'treats-care-products.js').write_text('// Selected real treats and care - exact photographed packages, public price pending\nexport const treatsCareProducts = '+json.dumps(products,ensure_ascii=False,indent=2)+';\n')
