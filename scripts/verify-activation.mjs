import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const env={...process.env};
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){const match=line.match(/^([A-Z_0-9]+)=(.*)$/);if(match)env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');}
const url=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
if(new URL(url).hostname!=='sendtdqvmudegrzamngt.supabase.co')throw Error('The configured project does not match the linked project.');
const admin=createClient(url,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const anon=createClient(url,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
let failed=false;
for(const table of ['users','documents','shares','document_versions','document_invitations','review_rounds','review_responses','notification_outbox','ai_usage','analytics_daily','document_images']){
 const check=await admin.from(table).select('*',{count:'exact',head:true});
 console.log(JSON.stringify({table,serverAccess:!check.error,rows:check.count,errorCode:check.error?.code}));if(check.error)failed=true;
 const publicCheck=await anon.from(table).select('*',{head:true});
 const denied=!!publicCheck.error;console.log(JSON.stringify({table,anonymousAccessDenied:denied}));if(!denied)failed=true;
}
const call=await admin.rpc('plainpage_save',{p_id:'00000000-0000-4000-8000-000000000000',p_actor:'00000000-0000-4000-8000-000000000000',p_revision:1,p_title:'No record is created'});
const rpcAvailable=call.error?.message==='NOT_FOUND';console.log(JSON.stringify({revisionRpcAvailable:rpcAvailable}));if(!rpcAvailable)failed=true;
const denied=await anon.rpc('plainpage_save',{p_id:'00000000-0000-4000-8000-000000000000',p_actor:'00000000-0000-4000-8000-000000000000',p_revision:1});
console.log(JSON.stringify({anonymousRpcDenied:denied.error?.message!=='NOT_FOUND'&&!!denied.error}));
if(!denied.error||denied.error.message==='NOT_FOUND')failed=true;
const bucket=await admin.storage.getBucket('document-images');console.log(JSON.stringify({privateImageBucket:bucket.data?.public===false}));if(bucket.error||bucket.data?.public!==false)failed=true;
if(failed)process.exitCode=1;
