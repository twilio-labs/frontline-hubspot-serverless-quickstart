
// Public endpoint for Twilio Frontline's Outgoing Conversations Callback Url

const {tokenCheck} = require(Runtime.getFunctions().fn.path);
exports.handler = async function(context, event, callback) {
    
    const {SSO_REALM_SID,ACCOUNT_SID,AUTH_TOKEN} = context;

    
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
        case 'GetProxyAddress': 
            if(event.Channel && event.Channel.type === 'whatsapp') {
                rsp.setBody({ proxy_address: context.TWILIO_WHATSAPP_NUMBER });
            } else {
                rsp.setBody({ proxy_address: context.TWILIO_SMS_NUMBER });
            }
        break;
        default: 
            rsp.setBody({error:"Bad Request"})
            rsp.setStatusCode(400);    

        break;
    }
    return callback(null, rsp);

};