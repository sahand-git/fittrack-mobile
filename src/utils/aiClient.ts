export type AITransport = (path:string, headers:Record<string,string>, body?:unknown, method?:'GET'|'POST'|'DELETE') => Promise<{status:number;data:any}>;
export interface AIStatus { signedIn:boolean; consent:boolean; enabled:boolean; isPremium:boolean; remaining:number; limit:number; checked:boolean }
const empty = ():AIStatus => ({signedIn:false,consent:false,enabled:false,isPremium:false,remaining:0,limit:0,checked:false});
export function apiError(status:number,code?:string):Error {
  if(code==='recent_login_required') return new Error('Sign out and sign in again before deleting your account.');
  const messages:Record<number,string>={401:'Sign in again to continue.',403:'AI access is not enabled for this account.',413:'This request is too large. Use a smaller photo or shorter message.',429:'Your AI usage limit has been reached. Please try again later.',503:'AI is temporarily unavailable. Your saved records are unchanged.'};
  return new Error(messages[status] || 'Could not complete this request. Please try again.');
}
export function createAIClient(transport:AITransport) {
  let state=empty(), account:string|null=null, epoch=0;
  let tokenProvider:(()=>Promise<string>)|null=null;
  const listeners=new Set<()=>void>();
  const emit=(next:AIStatus)=>{state=next;listeners.forEach(fn=>fn());};
  const checkEpoch=(started:number)=>{if(started!==epoch)throw new Error('Your account changed. Please try again.');};
  async function request(path:string,body?:unknown,method:'GET'|'POST'|'DELETE'='POST') {
    if(!account || !tokenProvider)throw new Error('Sign in to use AI.');
    const started=epoch;
    const token=await tokenProvider();checkEpoch(started);
    let response;
    try { response=await transport(path,{'Content-Type':'application/json',Authorization:'Bearer '+token},body,method); }
    catch { checkEpoch(started);throw new Error('Could not reach the server. Check your connection and try again.'); }
    checkEpoch(started);
    if(response.status<200 || response.status>=300)throw apiError(response.status,response.data?.error);
    return response.data;
  }
  return {
    getStatus:()=>state,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    setAccount:(uid:string|null,getToken:(()=>Promise<string>)|null)=>{
      if(uid===account){tokenProvider=getToken;return;}
      epoch++;account=uid;tokenProvider=getToken;emit({...empty(),signedIn:Boolean(uid)});
    },
    setConsent:(consent:boolean)=>{emit({...state,consent:state.signedIn && consent});},
    async refresh(){
      const data=await request('/api/ai/status',undefined,'GET');
      if(typeof data?.enabled!=='boolean'||typeof data?.isPremium!=='boolean'||!Number.isFinite(data.remaining)||!Number.isFinite(data.limit)||data.remaining<0||data.limit<0)throw new Error('The server returned an invalid account status.');
      emit({...state,enabled:data.enabled,isPremium:data.isPremium,remaining:data.remaining,limit:data.limit,checked:true});return state;
    },
    async generate(prompt:string,json:boolean,image?:{data:string;mimeType:string}) {
      if(!state.signedIn)throw new Error('Sign in to use AI.');
      if(!state.consent)throw new Error('Allow AI data sharing in the AI consent panel first.');
      if(!prompt.trim()||prompt.length>20000)throw new Error('Use a message between 1 and 20,000 characters.');
      const data=await request('/api/ai/generate',{prompt,json,...(image?{image}:{})});
      if(typeof data?.text!=='string'||!data.text.trim())throw new Error('AI returned no usable answer. Please try again.');
      emit({...state,remaining:Math.max(0,state.remaining-1)});return data.text.trim();
    },
    deleteAccount:()=>request('/api/account',undefined,'DELETE'),
  };
}
