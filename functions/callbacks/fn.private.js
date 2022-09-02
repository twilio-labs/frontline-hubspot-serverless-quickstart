
// Private endpoint for shared functions (e.g. getting CRM data)
const axios = require('axios');
const {phone} = require('phone');
const {quickReplies} = require(Runtime.getFunctions().templates.path);

/**
 * Function to check if token provided by Twilio Frontline is legitmate
 * @param {String} token 
 * @param {String} SSO_REALM_SID 
 * @param {String} ACCOUNT_SID 
 * @param {String} AUTH_TOKEN 
 * @returns {Promise}  Promise that resolves to true is token is valid, false if not.
 */
const tokenCheck = async (token, SSO_REALM_SID, ACCOUNT_SID, AUTH_TOKEN) => {
  try{
    let {data} = await axios.post("https://iam.twilio.com/v2/Tokens/validate/"+SSO_REALM_SID,
      {
          token
      },
      {
          headers: {
              "Content-Type": "application/json",
          },
          auth: {
              username: ACCOUNT_SID,
              password: AUTH_TOKEN,
          },
      }
    );
    
    return data.valid;
  }catch(err){
    console.warn(err);
    return false;
  }
}

/**
 * Normalises phone numbers from CRM from national format to e.164. 
 * @param {String} raw - Phone number from the CRM
 * @param {Boolean} wa  - Whether the number is a whatsapp number. Whatsapp Numbers will skip mobile prefix checkes 
 * @param {String} country - Country for national format. Defaults to SG (Singapore)
 * @returns {String} Normalised phone number.
 */
const normalize = (raw, wa= false,country='SG')=>{
  
  return phone(raw,{
    country,
    validateMobilePrefix: !wa
  }).phoneNumber
  
}

/**
 * Takes output from Hubspot CRM and constructs a Twilio Frontline Customer object
 * @param {Object} row row input from Hubspot CRM 
 * @returns 
 */
const parseCustomer = row=>{
          let {email,phone} = row.properties;
          let sms =normalize(phone);
          let wa =normalize(phone,true);
          let channels = [];
          
          if(email){
            channels.push({ "type": "email", "value": email })
          }
          
          if(sms){
            channels.push({ "type": "sms", "value":sms}); 
          }
          
          if(wa){
            channels.push({ "type": "whatsapp", "value": "whatsapp:"+wa }); 
          }   
          let display_name = '';
          if(row.properties.firstname){
            display_name +=row.properties.firstname
          }
          if(row.properties.lastname){
            if(display_name){
              display_name +=', '
            }
            display_name += row.properties.lastname
          }
          if(row.properties.company){
            if(display_name){
              display_name +=' '
            }else{
              display_name += email || sms||''
            }
            
            display_name +=`[${row.properties.company}]`
          }
          
          if(!display_name){
            display_name += email || sms||'Unknown';
          }
          
          
          
          return {
            customer_id:row.id,
            display_name,
            channels,
            properties:{
              firstname:row.properties.firstname,
              lastname:row.properties.lastname,
              company:row.properties.company
            }
          }
};

/**
 * Function to fetch customers from the Hubspot CRM and return an array of Twilio Frontline Customer objects
 * @param {Object} hubspotClient - The initialized hubspot CRM nodejs SDK client
 * @param {Number} pageSize - Number of records to retrieve
 * @param {Number} anchor  - Which page (startOf) for records to retireve
 * @returns {Array} Array of Twilio Frontline customer objects.
 */
const fetchCustomers = async (hubspotClient, pageSize, anchor)=>{
      const limit = pageSize||50;
      const after = anchor||undefined;
      const properties = ['company','email','phone','firstname','lastname'];
      const associations = undefined;
      const archived = false;

      try {
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getPage(limit, after, properties, associations ,archived);
        return apiResponse.body.results.map(parseCustomer);        
      } catch (e) {
        console.warn(e);
        return []
      }
        
}
/**
 * Function to retrieve Twilio Frontline Customer object from the contactId
 * @param {Object} hubspotClient - The initialized hubspot CRM nodejs SDK client
 * @param {String} contactId  - The contact ID
 * @returns {Object} Twilio Frontline Customer Object.
 */
const fetchCustomerById = async (hubspotClient, contactId)=>{
      const properties = ['company','email','phone','firstname','lastname'];
      const associations = undefined;
      const archived = false;
      try {
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(contactId, properties, associations, archived);
        return parseCustomer(apiResponse.body);        

      }
      catch (e) {
        console.warn(e);
        return false
      }

}

/**
 * Fetches response templates based on the 
 * @param {Object} hubspotClient  - The initialized hubspot CRM nodejs SDK client
 * @param {String} param2.CustomerId - Customer Id. For the second parameter, the entire event object from the callback can be passed
 * @param {String} param2.Worker - Email/Identity of the worker.
 * @param {String} param2.ConversationSid - ConversationalSid. RFU
 * @param {String} param3.TENANT_ID - Azure AD tenant ID. Optional. Used for populating name of worker from Azure AD platform
 * @param {String} param3.GRAPH_ID - Client ID of Azure AD application. Optional. Used for populating name of worker from Azure AD platform
 * @param {String} param3.GRAPH_SECRET - Client Secret of Azure AD application. Optional. Used for populating name of worker from Azure AD platform
 * @returns {Array} Array of Twilio Frontline Templates.
 */
const getTemplatesByCustomerId = async (hubspotClient, {CustomerId,Worker,ConversationSid}, {TENANT_ID:tenant,GRAPH_ID:client_id,GRAPH_SECRET:client_secret})=>{
  let Email = Worker;
  
  let customerDetails ={
    properties:{
      firstname:' '
    }
  }
  
  if(CustomerId){
    customerDetails = await fetchCustomerById(hubspotClient,CustomerId);
  }
  
  
    try{
        if(!client_id|| !tenant ||!client_secret ){
            throw 'Skip Retrieving Names'
        }
      const grant_type='client_credentials';
      const scope = 'https://graph.microsoft.com/.default';
      let params =new URLSearchParams({
          client_id,
          scope,
          client_secret,
          grant_type
      })
      let {data:{access_token:mstoken}} = await axios.post(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,params);

      let $ = axios.create({
                baseURL:`https://graph.microsoft.com/v1.0/`,
                headers: {'Authorization': 'Bearer '+mstoken}
      });
      let {data:msUser} = await $.get('/users/'+Worker)
      Worker = `${msUser.givenName} ${msUser.surname}`
  }catch{
    
  }
  
  let customerName = customerDetails.properties.firstname;
    
    let template = JSON.parse(JSON.stringify(quickReplies));
    
    for(let cat of template){
      for(let tmp of cat.templates){
        tmp.content = compileTemplate(tmp.raw, customerName,Worker,Email);
        delete tmp.raw;
      }
    }

  
  return template
  
  
}
/**
 * Function to replace template placeholders with worker name, email, and customer name.
 * @param {String} template - Raw template with placeholders
 * @param {String} customerName - Customer Name 
 * @param {String} worker - Worker Name
 * @param {String} email  - Worker Email
 * @returns {String} Compiled template.
 */
const compileTemplate = (template, customerName, worker, email) => {
    let compiledTemplate = template.replace(/{{Name}}/, customerName);
    compiledTemplate = compiledTemplate.replace(/{{Author}}/, worker);
    compiledTemplate = compiledTemplate.replace(/{{Email}}/, email);

    return compiledTemplate;
};




Object.assign(exports, {
  tokenCheck,normalize,parseCustomer,fetchCustomers,fetchCustomerById,getTemplatesByCustomerId
});