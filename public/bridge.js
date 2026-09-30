export const EXTENSION_ID = 'jldogdgepmcedfdhgnmclgemehfhpomg';
export function allowedBridgeOrigin(){return ['https://rtrvr.ai','https://www.rtrvr.ai'].includes(location.origin)||(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname));}
export function pingExtension(){
  if(!allowedBridgeOrigin())return Promise.resolve({ok:false,error:'The shipped extension bridge accepts rtrvr.ai and localhost. Host the controller there.'});
  if(!globalThis.chrome?.runtime?.sendMessage)return Promise.resolve({ok:false,error:'Use Chrome with the rtrvr extension installed.'});
  return new Promise(resolve=>{const timer=setTimeout(()=>resolve({ok:false,error:'Extension did not respond.'}),4000);try{chrome.runtime.sendMessage(EXTENSION_ID,{type:'RTRVR_PING_FROM_WEB'},reply=>{clearTimeout(timer);const err=chrome.runtime.lastError;resolve(err?{ok:false,error:err.message}:reply||{ok:false,error:'No response'});});}catch(e){clearTimeout(timer);resolve({ok:false,error:e.message});}});
}
