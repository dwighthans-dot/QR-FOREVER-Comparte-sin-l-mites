const $ = (id) => document.getElementById(id);
let qr = null;
let logoData = '';
let generated = false;
let currentType = 'url';

function showToast(message){
  const t=$('toast'); t.textContent=message; t.classList.add('show');
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove('show'),2400);
}
function esc(v=''){return String(v).replace(/([\\;,:\n])/g,'\\$1');}
function normalizeUrl(value){const v=value.trim(); if(!v)return ''; return /^https?:\/\//i.test(v)?v:'https://'+v;}
function field(id,label,placeholder='',type='text',extra=''){return `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" placeholder="${placeholder}" ${extra}></div>`;}
function area(id,label,placeholder='',rows=4){return `<div class="field full"><label for="${id}">${label}</label><textarea id="${id}" rows="${rows}" placeholder="${placeholder}"></textarea></div>`;}
function renderFields(type){
  currentType=type;
  document.querySelectorAll('.type-tab').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
  const f=$('contentFields');
  const templates={
    url:`${field('urlValue','URL','https://tu-sitio.com','text','autocomplete="url"')}`,
    text:area('textValue','Tu texto','Escribe el texto que quieres compartir…',5),
    email:`${field('emailTo','Correo electrónico','nombre@ejemplo.com','email')}<div class="field full">${field('emailSubject','Asunto','Asunto del correo')}${field('emailBody','Mensaje','Escribe el mensaje…')}</div>`,
    phone:`${field('phoneValue','Número telefónico','+1 809 555 0000','tel')}`,
    sms:`${field('smsPhone','Número telefónico','+1 809 555 0000','tel')}${area('smsMessage','Mensaje SMS','Escribe el mensaje…',4)}`,
    vcard:`<div class="field-grid">${field('vcFirst','Nombre','Dwight')}${field('vcLast','Apellido','Taveras')}${field('vcOrg','Organización','Makak Desing')}${field('vcTitle','Puesto','')}</div><div class="field-grid">${field('vcMobile','Teléfono','+1 809 555 0000','tel')}${field('vcEmail','Correo electrónico','nombre@ejemplo.com','email')}${field('vcUrl','Sitio web','https://')}${field('vcStreet','Calle','')}</div><div class="field-grid">${field('vcCity','Ciudad','San Cristóbal')}${field('vcState','Estado / provincia','')}${field('vcZip','Código postal','')}${field('vcCountry','País','República Dominicana')}</div>`,
    mecard:`<div class="field-grid">${field('mcName','Nombre','APELLIDO;Nombre')}${field('mcNick','Apodo','')}${field('mcTel','Teléfono','+1 809 555 0000','tel')}${field('mcEmail','Correo electrónico','nombre@ejemplo.com','email')}</div>${field('mcUrl','Sitio web','https://')}${area('mcNote','Notas','',3)}`,
    location:`<div class="field-grid">${field('lat','Latitud','18.4167','number','step="any"')}${field('lng','Longitud','-70.1092','number','step="any"')}</div>${field('locationLabel','Nombre del lugar','Ej. Zona R')}`,
    facebook:`${field('facebookUrl','URL de Facebook','https://facebook.com/tu-pagina')}`,
    twitter:`${field('twitterUrl','URL de perfil de Twitter / X','https://x.com/tu-cuenta')}${area('twitterTweet','Texto para compartir','Escribe el texto del post…',3)}`,
    youtube:`${field('youtubeUrl','URL de YouTube','https://youtube.com/watch?v=...')}`,
    wifi:`${field('wifiSsid','Nombre de red (SSID)','Mi Wi‑Fi')}${field('wifiPassword','Contraseña','Contraseña de Wi‑Fi','text')}${`<div class="field"><label for="wifiSecurity">Encriptación</label><select id="wifiSecurity"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Sin contraseña</option></select></div>`}${`<label class="check-field"><input id="wifiHidden" type="checkbox"> Red oculta</label>`}`,
    event:`${field('eventTitle','Título del evento','Reunión')}${field('eventLocation','Lugar','Santo Domingo')}${`<div class="field-grid">${field('eventStart','Inicio','','datetime-local')}${field('eventEnd','Fin','','datetime-local')}</div>`}${area('eventDescription','Descripción','Detalles del evento…',3)}`,
    bitcoin:`${field('btcAddress','Dirección de wallet','1...')}${field('btcAmount','Cantidad','0.001','number','step="any" min="0"')}${field('btcLabel','Etiqueta','Pago')}`
  };
  f.innerHTML=`<div class="dynamic-form">${templates[type]||templates.url}</div>`;
  f.querySelectorAll('input, textarea, select').forEach(el=>el.addEventListener('input',()=>{generated=false;}));
  if(type==='url')$('urlValue')?.focus();
}
function val(id){return $(id)?.value?.trim()||'';}
function payload(){
  switch(currentType){
    case 'url': return normalizeUrl(val('urlValue'));
    case 'text': return val('textValue');
    case 'email': {const to=val('emailTo'); if(!to)return ''; const p=[]; if(val('emailSubject'))p.push(`subject=${encodeURIComponent(val('emailSubject'))}`); if(val('emailBody'))p.push(`body=${encodeURIComponent(val('emailBody'))}`); return `mailto:${to}${p.length?'?'+p.join('&'):''}`;}
    case 'phone': {const p=val('phoneValue'); return p?`tel:${p}`:'';}
    case 'sms': {const p=val('smsPhone'); return p?`SMSTO:${p}:${val('smsMessage')}`:'';}
    case 'vcard': {if(!val('vcFirst')&&!val('vcLast')&&!val('vcMobile')&&!val('vcEmail'))return ''; return ['BEGIN:VCARD','VERSION:3.0',`N:${esc(val('vcLast'))};${esc(val('vcFirst'))};;;`,`FN:${esc((val('vcFirst')+' '+val('vcLast')).trim())}`,val('vcOrg')?`ORG:${esc(val('vcOrg'))}`:'',val('vcTitle')?`TITLE:${esc(val('vcTitle'))}`:'',val('vcMobile')?`TEL;TYPE=CELL:${esc(val('vcMobile'))}`:'',val('vcEmail')?`EMAIL:${esc(val('vcEmail'))}`:'',val('vcUrl')?`URL:${esc(normalizeUrl(val('vcUrl')))}`:'',val('vcStreet')?`ADR:;;${esc(val('vcStreet'))};${esc(val('vcCity'))};${esc(val('vcState'))};${esc(val('vcZip'))};${esc(val('vcCountry'))}`:'','END:VCARD'].filter(Boolean).join('\n');}
    case 'mecard': {const n=val('mcName'); if(!n)return ''; return ['MECARD:',`N:${esc(n)}`,val('mcNick')?`NICKNAME:${esc(val('mcNick'))}`:'',val('mcTel')?`TEL:${esc(val('mcTel'))}`:'',val('mcEmail')?`EMAIL:${esc(val('mcEmail'))}`:'',val('mcUrl')?`URL:${esc(normalizeUrl(val('mcUrl')))}`:'',val('mcNote')?`NOTE:${esc(val('mcNote'))}`:''].filter(Boolean).join(';')+';';}
    case 'location': {const lat=val('lat'),lng=val('lng'); if(!lat||!lng)return ''; return `geo:${lat},${lng}${val('locationLabel')?'?q='+encodeURIComponent(lat+','+lng+' ('+val('locationLabel')+')'):''}`;}
    case 'facebook': return normalizeUrl(val('facebookUrl'));
    case 'twitter': {const u=normalizeUrl(val('twitterUrl')); return val('twitterTweet')?`${u}?text=${encodeURIComponent(val('twitterTweet'))}`:u;}
    case 'youtube': return normalizeUrl(val('youtubeUrl'));
    case 'wifi': {const ssid=val('wifiSsid'); if(!ssid)return ''; const sec=$('wifiSecurity').value; return `WIFI:T:${sec};S:${esc(ssid)};P:${esc(val('wifiPassword'))};H:${$('wifiHidden').checked?'true':'false'};;`;}
    case 'event': {const title=val('eventTitle'); if(!title)return ''; const fmt=(id)=>{const d=val(id); return d?d.replace(/[-:]/g,'').replace('T','T')+'00':''}; return ['BEGIN:VEVENT',`SUMMARY:${esc(title)}`,val('eventLocation')?`LOCATION:${esc(val('eventLocation'))}`:'',val('eventStart')?`DTSTART:${fmt('eventStart')}`:'',val('eventEnd')?`DTEND:${fmt('eventEnd')}`:'',val('eventDescription')?`DESCRIPTION:${esc(val('eventDescription'))}`:'','END:VEVENT'].filter(Boolean).join('\n');}
    case 'bitcoin': {const a=val('btcAddress'); if(!a)return ''; const q=[]; if(val('btcAmount'))q.push('amount='+encodeURIComponent(val('btcAmount'))); if(val('btcLabel'))q.push('label='+encodeURIComponent(val('btcLabel'))); return `bitcoin:${a}${q.length?'?'+q.join('&'):''}`;}
  }
}
function settings(){return {data:payload(),fg:$('fgColor').value,bg:$('bgColor').value,dot:$('dotType').value,corner:$('cornerType').value};}
function updateLabels(){$('fgValue').textContent=$('fgColor').value.toUpperCase();$('bgValue').textContent=$('bgColor').value.toUpperCase();}
function buildQR(auto=false){
  const s=settings();
  if(!s.data){$('emptyState').style.display='block'; if(!auto)showToast('Completa el contenido para crear tu QR.'); return false;}
  if(!window.QRCodeStyling){showToast('No se pudo cargar el motor QR. Revisa tu conexión.');return false;}
  const options={width:270,height:270,type:'svg',data:s.data,image:logoData||undefined,dotsOptions:{color:s.fg,type:s.dot},backgroundOptions:{color:s.bg},cornersSquareOptions:{color:s.fg,type:s.corner},cornersDotOptions:{color:s.fg,type:s.corner==='dot'?'dot':'square'},qrOptions:{errorCorrectionLevel:logoData?'H':'Q'},imageOptions:{crossOrigin:'anonymous',margin:7,imageSize:.34,hideBackgroundDots:true}};
  $('qrPreview').innerHTML=''; qr=new QRCodeStyling(options); qr.append($('qrPreview')); $('emptyState').style.display='none'; generated=true; return true;
}
function ensureQR(){return generated?true:buildQR();}
async function download(type){if(!ensureQR())return;if(type==='png'||type==='svg'){await qr.download({name:'QR-Forever',extension:type});showToast(`QR descargado en ${type.toUpperCase()}.`);return;} if(type==='pdf'){try{const blob=await qr.getRawData('png');const reader=new FileReader();reader.onload=()=>{const {jsPDF}=window.jspdf||{};if(!jsPDF){showToast('No se pudo cargar el exportador PDF.');return;}const doc=new jsPDF({unit:'mm',format:'a4'});const size=120;doc.setTextColor(38,52,74);doc.setFontSize(20);doc.text('QR Forever',105,28,{align:'center'});doc.setFontSize(10);doc.setTextColor(120,135,152);doc.text('Comparte sin límites.',105,36,{align:'center'});doc.addImage(reader.result,'PNG',(210-size)/2,48,size,size);doc.setFontSize(8);doc.text('Makak Desing. Dwight Hans Taveras',105,184,{align:'center'});doc.save('QR-Forever.pdf');showToast('QR descargado en PDF.');};reader.readAsDataURL(blob);}catch(e){console.error(e);showToast('No se pudo crear el PDF.');}}}
function copyPayload(){const data=payload();if(!data){showToast('Completa el contenido primero.');return;}navigator.clipboard?.writeText(data).then(()=>showToast('Contenido QR copiado.')).catch(()=>{const ta=document.createElement('textarea');ta.value=data;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Contenido QR copiado.');});}
function setTheme(theme){
  const next=theme==='dark'?'dark':'light';
  document.documentElement.setAttribute('data-theme',next);
  try{localStorage.setItem('qrforever-theme',next);}catch(e){}
  const icon=$('themeIcon');
  const btn=$('themeBtn');
  if(icon) icon.textContent=next==='dark'?'☀':'☾';
  if(btn){
    btn.setAttribute('aria-label',next==='dark'?'Cambiar a modo claro':'Cambiar a modo oscuro');
    btn.title=next==='dark'?'Cambiar a modo claro':'Cambiar a modo oscuro';
  }
  const meta=document.querySelector('meta[name=theme-color]');
  if(meta) meta.setAttribute('content',next==='dark'?'#151b25':'#f5f7fa');
}

function init(){
  document.querySelectorAll('.type-tab').forEach(btn=>btn.addEventListener('click',()=>{renderFields(btn.dataset.type);generated=false;}));
  $('createBtn').addEventListener('click',()=>{if(buildQR())showToast('Código QR creado.');});
  $('pngBtn').addEventListener('click',()=>download('png'));
  $('svgBtn').addEventListener('click',()=>download('svg'));
  $('pdfBtn').addEventListener('click',()=>download('pdf'));
  $('copyBtn').addEventListener('click',copyPayload);
  $('logoInput').addEventListener('change',(e)=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){showToast('El logo no puede superar 2 MB.');e.target.value='';return;}const r=new FileReader();r.onload=()=>{logoData=r.result;$('logoName').textContent=file.name;if(payload())buildQR(true);};r.readAsDataURL(file);});
  $('removeLogo').addEventListener('click',()=>{logoData='';$('logoInput').value='';$('logoName').textContent='Subir logo';if(payload())buildQR(true);});
  const themeBtn = $('themeBtn');
  if(themeBtn) themeBtn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  ['fgColor','bgColor','dotType','cornerType'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('input',()=>{updateLabels();if(payload())buildQR(true);}); });
  let saved='light';
  try{saved=localStorage.getItem('qrforever-theme')||'light';}catch(e){}
  setTheme(saved);
  updateLabels();
  renderFields('url');
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
