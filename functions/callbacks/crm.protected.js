// Public endpoint for Twilio Frontline's CRM Callback URL
const hubspot = require('@hubspot/api-client')

const customersPath = Runtime.getAssets()['/providers/customers.js'].path
const {fetchCustomers,fetchCustomerById} = require(customersPath);


exports.handler = async function(context, event, callback) {
  const {HUBSPOT_API_KEY} = context;
  const hubspotClient = new hubspot.Client({ HUBSPOT_API_KEY })
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
