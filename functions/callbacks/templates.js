
// Public endpoint for Twilio Frontline's Templates Callback Url

const hubspotPath = Runtime.getAssets()['/providers/hubspot.js'].path
const {getHubspotClient} = require(hubspotPath);

const customersPath = Runtime.getAssets()['/providers/customers.js'].path
const {fetchCustomerById} = require(customersPath);

const templatesPath = Runtime.getAssets()['/providers/templates.js'].path
const {getTemplatesByCustomer} = require(templatesPath);


exports.handler = async function(context, event, callback) {

    const hubspotClient = getHubspotClient(context.HUBSPOT_API_KEY);

    
    const location = event.location || event.Location;
    const rsp = new Twilio.Response();
    rsp.setHeaders({
        "Content-Type":"application/json"
    });
    
    switch (location) {
        case 'GetTemplatesByCustomerId': 
            let customer = {properties:{firstname:' '}};
            if (event.CustomerId) {
                customer = await fetchCustomerById(hubspotClient, event.CustomerId);
            }
            let output = await getTemplatesByCustomer(event.Worker, customer);
            rsp.setBody(output);
        break;
        default: 
            rsp.setBody({error:"Bad Request"})
            rsp.setStatusCode(400);    
    
        break;
    }
    return callback(null, rsp);

};