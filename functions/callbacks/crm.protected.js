// Public endpoint for Twilio Frontline's CRM Callback URL
const customersPath = Runtime.getAssets()['/providers/customers.js'].path
const {fetchCustomerById,fetchCustomers} = require(customersPath);


exports.handler = async function(context, event, callback) {
  const rsp = new Twilio.Response();
  rsp.setHeaders({
    "Content-Type":"application/json"
  });

  switch(event.location || event.Location){
    case 'GetCustomerDetailsByCustomerId':
      let customer = await fetchCustomerById(context, event.CustomerId);
      rsp.setBody({
        objects: {
            customer
        }
      });
      break;

    case 'GetCustomersList':
      let customers = await fetchCustomers(context, event.PageSize, event.Anchor);
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
