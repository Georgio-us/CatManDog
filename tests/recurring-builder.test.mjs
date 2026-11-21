import test from 'node:test';
import assert from 'node:assert/strict';

test('account builder selects a priced SKU, date and cadence for the existing cart flow', async () => {
  const previous={fetch:globalThis.fetch,localStorage:globalThis.localStorage,location:globalThis.location};
  const values=new Map([['catmandog-language','es']]);
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  globalThis.location={hash:'#/account/recurring/build',href:'https://example.test/#/account/recurring/build'};
  globalThis.fetch=async path=>{
    if(path==='/api/config') return Response.json({accountsEnabled:true,emailEnabled:true});
    if(path==='/api/auth/me') return Response.json({customer:{id:'customer',email:'buyer@example.test'}});
    if(path==='/api/me/cabinet') return Response.json({revision:0,cabinet:{version:1,pets:[],activePetId:null,human:{},orders:[],reminders:[]}});
    if(path==='/api/me/orders'||path==='/api/me/recurring-orders') return Response.json({orders:[]});
    if(path==='/api/me/promo') return Response.json({coupon:null});
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const {createAccountUI}=await import('../account.js?recurring-builder-test');
    const selection=[];
    const product={id:'litter',name:'Arena Tofu',variants:[{id:'litter-6l',label:'6 L',price:9.99,manufacturerSku:'123'},
      {id:'litter-18l',label:'18 L',price:19.99,manufacturerSku:'456'}]};
    const ui=createAccountUI({escape:String,icon:()=>'<svg></svg>',money:value=>`${value} €`,products:[product],
      imageBlock:()=>'',render:()=>{},notify:()=>{},getCart:()=>[{productId:'litter',variantId:'litter-6l',qty:2}],repeatOrder:()=>{},
      startRecurringBasket:(items,weeks,date)=>{selection.push({items,weeks,date});return true;}});
    await ui.initialize();
    const html=ui.page('/account/recurring/build',new URLSearchParams());
    assert.match(html,/Preparar una cesta periódica/);
    assert.match(html,/data-builder-use-cart/);
    assert.doesNotMatch(html,/data-builder-add/);
    assert.doesNotMatch(html,/Цена уточняется/);
    ui.input({hasAttribute:name=>name==='data-builder-search',value:'Arena',closest:()=>null});
    const searched=ui.page('/account/recurring/build',new URLSearchParams());
    assert.match(searched,/data-builder-add="litter\|litter-6l"/);
    assert.match(searched,/19.99 €/);
    await ui.click({hasAttribute:name=>name==='data-builder-use-cart',dataset:{}});
    await ui.click({hasAttribute:name=>name==='data-builder-add',dataset:{builderAdd:'litter|litter-18l'}});
    ui.change({hasAttribute:name=>name==='data-builder-weeks',value:'6'});
    const nextDate=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
    ui.change({hasAttribute:name=>name==='data-builder-next-date',value:nextDate});
    const selected=ui.page('/account/recurring/build',new URLSearchParams());
    assert.match(selected,/data-builder-continue/);
    await ui.click({hasAttribute:name=>name==='data-builder-continue',dataset:{}});
    assert.deepEqual(selection,[{items:[{productId:'litter',variantId:'litter-6l',size:'6 L',qty:2},
      {productId:'litter',variantId:'litter-18l',size:'18 L',qty:1}],weeks:6,date:nextDate}]);
    assert.equal(location.hash,'/cart');
  } finally { Object.assign(globalThis,previous); }
});
