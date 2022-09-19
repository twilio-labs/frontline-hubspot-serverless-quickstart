
// Private endpoint for shared functions (e.g. getting CRM data)
const hubspotPath = Runtime.getAssets()['/providers/hubspot.js'].path
const {getHubspotClient} = require(hubspotPath);

const {phone} = require('phone');

/**
 * 
 * @param {Object} context - environment context containing Hubspot API key
 * @returns {Object} Hubspot SDK Client
 */
const initHubspot = (context) => {
  const {HUBSPOT_API_KEY} = context;
  return getHubspotClient(HUBSPOT_API_KEY);
}

/**
 * Normalises phone numbers from CRM from national format to e.164. 
 * @param {String} raw - Phone number from the CRM
 * @param {Boolean} wa  - Whether the number is a whatsapp number. Whatsapp Numbers will skip mobile prefix checkes 
 * @param {String} country - Country for national format. Defaults to US (United States)
 * @returns {String} Normalised phone number.
 */
const normalize = (raw, wa= false, country='US')=>{
  
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
 * @param {Object} context - environment context containing Hubspot API key
 * @param {Number} pageSize - Number of records to retrieve
 * @param {Number} anchor  - Which page (startOf) for records to retireve
 * @returns {Array} Array of Twilio Frontline customer objects.
 */
const fetchCustomers = async (context, pageSize, anchor)=>{
      const limit = pageSize||50;
      const after = anchor||undefined;
      const properties = ['company','email','phone','firstname','lastname'];
      const associations = undefined;
      const archived = false;

      try {
        const hubspotClient = initHubspot(context);
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getPage(limit, after, properties, associations ,archived);
        return apiResponse.body.results.map(parseCustomer);        
      } catch (e) {
        console.warn(e);
        return []
      }
        
}

/**
 * Function to retrieve Twilio Frontline Customer object from the contactId
 * @param {Object} context - environment context containing Hubspot API key
 * @param {String} contactId  - The contact ID
 * @returns {Object} Twilio Frontline Customer Object.
 */
const fetchCustomerById = async (context, contactId)=>{
      const properties = ['company','email','phone','firstname','lastname'];
      const associations = undefined;
      const archived = false;
      try {
        const hubspotClient = initHubspot(context);
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(contactId, properties, associations, archived);
        return parseCustomer(apiResponse.body);        

      }
      catch (e) {
        console.warn(e);
        return false
      }

}

/**
 * Function to find first matching Hubspot customer record based on phone number
 * @param {Object} context - environment context containing Hubspot API key
 * @param {Object} twilioClient  - The initialized twilio SDK client
 * @param {String} phone - Phone number to attempt to match against existing Customer records
 * @returns {Object} Twilio Frontline Customer Object.
 */
const findCustomerByPhone = async (context, twilioClient, phone)=>{
  const {nationalFormat} = (await twilioClient.lookups.v1.phoneNumbers(phone).fetch())
  const cleannumber = nationalFormat.replace(/[^\d]/g,'');
  const searchOptions = {
    filterGroups: [
      {
        "filters":[
          {"value":phone,"propertyName":"phone","operator":"EQ"},
        ]
      },{
        "filters": [
          {"value":nationalFormat,"propertyName":"phone","operator":"EQ"}
        ]
      },{
        "filters":[
          {"value":cleannumber,"propertyName":"phone","operator":"EQ"}
        ]
      }
    ],
    sorts: ["id"],
    properties: ['company','email','phone','firstname','lastname'],
    limit: 1, //ensures no more than 1 match returned
    after: 0
  };

  const hubspotClient = initHubspot(context);
  const apiResponse = await hubspotClient.crm.contacts.searchApi.doSearch(searchOptions);
  let customerMatch = apiResponse.body.results[0];
  if (customerMatch) return parseCustomer(customerMatch);
  return null;
}

Object.assign(exports, {
  normalize,parseCustomer,fetchCustomers,fetchCustomerById, findCustomerByPhone
});