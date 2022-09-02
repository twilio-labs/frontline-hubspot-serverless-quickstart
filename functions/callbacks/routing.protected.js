
// Protected endpoint for Twilio Conversations webhooks. Used to populate the user's information from the CRM when a new unidentified message comes in.

const hubspot = require('@hubspot/api-client')
const {parseCustomer} = require(Runtime.getFunctions().fn.path);
const axios = require('axios');

/**
 * Class Method to handle callbacks.
 */
class callback_actions{
  constructor(context, event, callback){
    Object.assign(this,{context, event, callback});
    const {HUBSPOT_API_KEY} = context;
    this.hubspotClient = new hubspot.Client({ HUBSPOT_API_KEY });
    
    //For Legacy hubspot API
    this.hs_old_client = axios.create({
      params: {
        hapikey: HUBSPOT_API_KEY
      },
      headers: {
        'Content-Type': 'application/json' 
      },
      baseURL: 'https://api.hubapi.com/',
    });
    

    

  }
  async onConversationAdded(){
    return;
  }
  async onConversationStateUpdated(){
    return;
  }
  async onMessageAdded(){
    return;
  }
  async onParticipantAdded(){
    let participant = this.event.ParticipantSid;
    let conversationSid =  this.event.ConversationSid;
    let type = this.event['MessagingBinding.Type'];
    let phone = this.event['MessagingBinding.Address'];
    let attr = JSON.parse(this.event.Attributes);
    if(!['sms','whatsapp'].includes(type)){
      return;
    }
    if(type=='whatsapp'){
      phone =phone.substring(9)
    }
    
    const client = this.context.getTwilioClient()
    const {nationalFormat} = (await client.lookups.v1.phoneNumbers(phone).fetch())
    const cleannumber = nationalFormat.replace(/[^\d]/g,'');
    try{
      //Handle if no customer ID, check with CRM
      if(!attr.customer_id){
  const publicObjectSearchRequest = { filterGroups: 
  [
    
      {
        "filters":
        [
          {"value":phone,"propertyName":"phone","operator":"EQ"},
        ]
      },
      {
        "filters":
        [
          {"value":nationalFormat,"propertyName":"phone","operator":"EQ"}
        ]
      },
      {
        "filters":
        [
          {"value":cleannumber,"propertyName":"phone","operator":"EQ"}
        ]
      }
    
  ], sorts: ["id"], properties: ['company','email','phone','firstname','lastname'], limit: 1, after: 0 };
        const apiResponse = await this.hubspotClient.crm.contacts.searchApi.doSearch(publicObjectSearchRequest);
        let row = apiResponse.body.results[0]

        if(row){
          let {customer_id, display_name} = parseCustomer(row);
          let attributes = JSON.stringify({customer_id, display_name});
          await Promise.all([
            client.conversations.conversations(conversationSid).participants(participant).update({attributes}),
            client.conversations.conversations(conversationSid).update({friendlyName: display_name})
          ])
        }
      }
      return;

    }catch(err){
      console.warn(err);
      //do nothing
    }
    
  }

}

// This is your new function. To start, set the name and path on the left.

exports.handler = async function(context, event, callback) {
  let cb = new callback_actions(context, event, callback);
  
  switch(event.EventType){
    //case "onConversationAdded":
    //case "onConversationStateUpdated":
    //case "onMessageAdded":
    case "onParticipantAdded":
      await cb[event.EventType]()
    break;
  }
  return callback(null, 'ok');
};