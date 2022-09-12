// Public endpoint for Twilio Frontline's CRM Callback URL

const hubspotPath = Runtime.getAssets()['/providers/hubspot.js'].path
const {getHubspotClient} = require(hubspotPath);

const customersPath = Runtime.getAssets()['/providers/customers.js'].path
const {fetchCustomerById,fetchCustomers} = require(customersPath);


exports.handler = async function(context, event, callback) {
  const {HUBSPOT_API_KEY} = context;
  const hubspotClient = getHubspotClient(HUBSPOT_API_KEY);
  const rsp = new Twilio.Response();
  rsp.setHeaders({
    "Content-Type":"application/json"
  });

  switch(event.location || event.Location){
    case 'GetCustomerDetailsByCustomerId':
      let customer = await fetchCustomerById(hubspotClient, event.CustomerId);
      rsp.setBody({
        objects: {
            customer
        }
      });
      break;

    case 'GetCustomersList':
      let customers = await fetchCustomers(hubspotClient, event.PageSize, event.Anchor);
      rsp.setBody({
        objects: {
            customers
        }
      });
      break;

    default:
        rsp.setBody({error:"Bad Request"})
        rsp.setStatusCode(400);    
      break;
  }

  return callback(null, rsp);
};
