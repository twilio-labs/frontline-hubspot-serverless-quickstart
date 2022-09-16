
// Protected endpoint for Twilio Conversations webhooks. Used to populate the user's information from the CRM when a new unidentified message comes in.

const axios = require('axios');

const {getHubspotClient} = require(Runtime.getAssets()['/providers/hubspot.js'].path);
const {findCustomerByPhone} = require(Runtime.getAssets()['/providers/customers.js'].path);

/**
 * Class Method to handle callbacks.
 */
class callback_actions{
  constructor(context, event, callback){
    Object.assign(this,{context, event, callback});
    this.hubspotClient = getHubspotClient(context.HUBSPOT_API_KEY);
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
    let attr = JSON.parse(this.event.Attributes);
    if(attr.customer_id){ return;} //customer particpant already identified, no need to find a match

    let type = this.event['MessagingBinding.Type'];
    if(!['sms','whatsapp'].includes(type)){ return;}
   
    try{
      const twilioClient = this.context.getTwilioClient()
      let phone = this.event['MessagingBinding.Address'];
      if(type=='whatsapp'){
        phone = phone.substring(9)
      }

      const customerMatch = await findCustomerByPhone(this.hubspotClient, twilioClient, phone)
      if(customerMatch){
        let {customer_id, display_name} = customerMatch;
        let attributes = JSON.stringify({customer_id, display_name});
        let participant = this.event.ParticipantSid;
        let conversationSid =  this.event.ConversationSid;

        await Promise.all([
          client.conversations.conversations(conversationSid).participants(participant).update({attributes}),
          client.conversations.conversations(conversationSid).update({friendlyName: display_name})
        ])
      }
    }catch(err){
      console.warn(err);
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