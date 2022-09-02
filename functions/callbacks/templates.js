
// Public endpoint for Twilio Frontline's Templates Callback Url

const hubspot = require('@hubspot/api-client')
const {tokenCheck,getTemplatesByCustomerId} = require(Runtime.getFunctions().fn.path);

exports.handler = async function(context, event, callback) {
    
    const {HUBSPOT_API_KEY,SSO_REALM_SID,ACCOUNT_SID,AUTH_TOKEN} = context;
    const hubspotClient = new hubspot.Client({ HUBSPOT_API_KEY })

    
    const location = event.location;
    const rsp = new Twilio.Response();
    rsp.setHeaders({
        "Content-Type":"application/json"
    });
    
    let ok = await tokenCheck(event.Token, SSO_REALM_SID, ACCOUNT_SID, AUTH_TOKEN);
    if(!ok){
        rsp.setBody({error:"Bad Request"})
        rsp.setStatusCode(400);
        return callback(null, rsp);

    }

    switch (location) {
        case 'GetTemplatesByCustomerId': 
            let output =await getTemplatesByCustomerId(hubspotClient,event, context);
            rsp.setBody(output);
        break;
        default: 
            rsp.setBody({error:"Bad Request"})
            rsp.setStatusCode(400);    
    
        break;
    }
    return callback(null, rsp);

};