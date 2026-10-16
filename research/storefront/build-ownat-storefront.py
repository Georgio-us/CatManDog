import json,re,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];private=ROOT/'research/supplier-cats'
source=json.load(open(private/'cats-sku-prices.json'));evidence=json.load(open(ROOT/'research/ownat-product-sources.json'))
studio_path=ROOT/'research/ownat-studio-manifest.json'
studio={r['slug']:r for r in json.loads(studio_path.read_text())['images']} if studio_path.exists() else {}
# Exact source names and supplier codes are retained per package, never inferred from a picture
recipes=[
('classic-kitten','classic-kitten-gato-es','Ownat Classic Kitten','Для котят','Сухой корм для котят от 1 до 12 месяцев Рецептура с курицей для периода роста и развития',['Для котят от 1 до 12 месяцев','С курицей и цельными злаками']),
('classic-daily-care','classic-daily-care-gato-es','Ownat Classic Daily Care','На каждый день','Полнорационный сухой корм для взрослых кошек с обычным уровнем активности Повседневная рецептура с курицей и злаками',['Для взрослых кошек','Для обычного уровня активности','С курицей и цельными злаками']),
('classic-fish','classic-fish-gato-es','Ownat Classic Fish','С рыбой','Сухой корм со свежей рыбой для взрослых кошек всех пород В составе злаки и источники жирных кислот омега-3 и омега-6',['Для взрослых кошек','Со свежей рыбой','Содержит злаки']),
('classic-light','classic-light-gato-es','Ownat Classic Light','Контроль веса','Сухой корм для взрослых кошек, которым нужен рацион с пониженным содержанием жиров Формула с белком и растительными ингредиентами',['Для взрослых кошек','Пониженное содержание жиров','С курицей и злаками']),
('classic-hairball','classic-hairball-gato-es','Ownat Classic Hairball','Мальт и клетчатка','Сухой корм с курицей, солодовым экстрактом и растительной клетчаткой Рецептура для кошек, которым нужен рацион для контроля образования комочков шерсти',['Солодовый экстракт и растительная клетчатка','С курицей','Содержит злаки']),
('classic-sterilized','classic-sterilized-gato-es','Ownat Classic Sterilized','Для стерилизованных','Сухой корм для стерилизованных взрослых кошек Рецептура с курицей, клетчаткой и умеренным содержанием жиров',['Для стерилизованных взрослых кошек','С курицей и злаками','Умеренное содержание жиров']),
('just-adult-chicken','gf-just-adult-chicken-cat','Ownat Just Grain Free Adult Chicken','Без зерна','Полнорационный беззерновой сухой корм с курицей для взрослых кошек В рецептуре используются горох, картофель и маниок',['Для взрослых кошек','Без злаков','С курицей']),
('just-sterilized','gf-just-sterilized-cat','Ownat Just Grain Free Sterilized','Для стерилизованных','Беззерновой сухой корм для стерилизованных кошек Рецептура с курицей и сниженным содержанием жиров',['Для стерилизованных взрослых кошек','Без злаков','С курицей']),
('just-sterilized-fish','gf-just-sterilized-fish-gato','Ownat Just Grain Free Sterilized Fish','С рыбой','Беззерновой сухой корм для стерилизованных взрослых кошек Рецептура с рыбой и курицей для повседневного питания',['Для стерилизованных взрослых кошек','Без злаков','Содержит рыбу и курицу']),
('author-fresh-oily-fish-poultry','author-fresh-oily-fish-poultry-cat','Ownat Author Fresh Oily Fish & Poultry','Рыба и птица','Сухой корм со свежей жирной рыбой, курицей и уткой Рецептура Author также содержит рис, горох и яблоко',['Свежая рыба, курица и утка','Содержит рис','Линейка Author']),
('author-sterilized-fresh-chicken','author-sterilized-fresh-chicken-gato','Ownat Author Sterilized Fresh Chicken','Для стерилизованных','Беззерновой сухой корм для стерилизованных кошек Рецептура Author со свежей курицей, семенами чиа и умеренной калорийностью',['Для стерилизованных кошек','Без злаков','Со свежей курицей и семенами чиа'])]
grouped=collections.defaultdict(list)
for r in source['products']:
 if r['brand']=='Ownat' and r['priceExTax'] is not None:
  name=re.sub(r'\s*\(CAT\)\s*.*$','',r['name']).replace('OWNAT ','').replace('just GF','JUST').replace('AUTHOR ','AUTHOR ').lower()
  key=name.replace('gf ','').replace(' & ','-').replace(' ','-')
  grouped[key].append(r)
# Resolve groups by exact source recipe labels
keys=['classic-kitten','classic-daily-care','classic-fish','classic-light','classic-hairball','classic-sterilized','just-adult-chicken','just-sterilized','just-sterilized-fish','author-fresh-oily-fish-poultry','author-sterilized-fresh-chicken']
assert set(grouped)==set(keys),(set(grouped),set(keys))
products=[];terms={}
for key,slug,name,tag,desc,details in recipes:
 ev=next(x for x in evidence if x['slug']==slug);variants=[];pid='ownat-'+key
 image={'src':ev['imagePath'],'alt':name+' - официальное изображение рецептуры','generated':False}
 if slug in studio:
  image={'src':studio[slug]['displayPath'],'alt':name+' - студийное изображение рецептуры','presentation':'editorial','generated':True,'originalSrc':ev['imagePath']}
 family={'brand':'Ownat','variants':{},'additionalPacks':[]}
 for r in sorted(grouped[key],key=lambda r:r['unitWeightGrams']):
  label=(str(r['unitWeightGrams']/1000).removesuffix('.0').replace('.',',')+' кг') if r['unitWeightGrams']>=1000 else str(int(r['unitWeightGrams']))+' г'
  vid=pid+'-'+r['supplierCode'];pdf=next(x for x in r['sources'] if x['file'].endswith('PVPR_OWNAT_DIFERENTES_PAISES_FEBRERO_2026.pdf'))
  v={'id':vid,'name':name,'brand':'Ownat','category':'Корм','pet':'cat','isReal':True,'isNew':True,'foodType':'dry','price':r['recommendedRetailSpainIncTax'],'priceStatus':'recommended','purchasePrice':None,'purchasePriceStatus':'pending','availabilityStatus':'pending','weight':label,'packageWeightKg':r['unitWeightGrams']/1000,'label':label,'sizes':[label],'optionLabel':'Фасовка','manufacturerSku':r['supplierCode'],'ean':r['ean'],'description':desc,'details':details+['Полнорационный сухой корм','Норму кормления подбирайте по таблице производителя','Свежая вода должна быть в свободном доступе'],'tag':tag,'line':'Ownat · '+label,'image':image,'productSource':{'name':'Ownat','url':ev['url'],'kind':'manufacturer'},'imageSource':{'name':'Ownat','pageUrl':ev['url'],'url':ev['imageUrl']},'retailPrice':{'amount':r['recommendedRetailSpainIncTax'],'currency':'EUR','type':'recommended','status':'recommended','taxIncluded':True,'sourceName':'Ownat - PVPR Испания, февраль 2026','sourceUrl':pdf['file']+'#page='+str(pdf['page']),'checkedAt':'2026-10-16','effectiveDate':'2026-02','shippingIncluded':False}}
  variants.append(v)
  family['variants'][vid]={k:r[k] for k in ['supplierCode','ean','name','packLabel','unitsPerSalesPack','priceExTax','pricePerInnerUnitExTax','effectiveDate','sources']}
  family['variants'][vid].update(brand='Ownat',codeLabel='Артикул',priceKind='recommended_store_price',matchStatus='Артикул, EAN и фасовка из прайса Ownat',recommendedRetailSpainIncTax=r['recommendedRetailSpainIncTax'])
 default=next((v for v in variants if v['packageWeightKg']==1.5),next((v for v in variants if v['packageWeightKg']==1),variants[0]))
 products.append({**default,'id':pid,'defaultVariantId':default['id'],'variants':variants,'sizes':[v['label'] for v in variants]});terms[pid]=family
assert len(products)==11 and sum(len(p['variants']) for p in products)==33
(ROOT/'ownat-products.js').write_text('// Ownat - 11 cat recipes, 33 supplier-listed packages, recommended Spanish retail including IVA\nexport const ownatProducts = '+json.dumps(products,ensure_ascii=False,indent=2)+';\n')
(private/'ownat-storefront-terms.json').write_text(json.dumps({'receivedOn':'2026-10-14','currency':'EUR','products':terms},ensure_ascii=False,indent=2)+'\n')
print('Ownat: 11 cards, 33 exact SKU, public PVP and private recommended store prices separated')
