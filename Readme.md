Twilio Serverless framework for integrating hubspot with Twilio Frontline

# Frontline Hubspot Serverless Quickstart

This repository implements a Twilio Frontline integration service using Twilio Serverless with Hubspot as the 
contact database.  It implements a few features:
- 📇 Display a contact list in Frontline from a list of Hubspot Contacts
- 🔀 Route inbound conversations in Frontline based on Hubspot record ownership

## Prerequisites
We recommend following the setup outlined Frontline node.js quickstart, which shows you how to do the following:

* A Twilio Account. Don't have one? [Sign up](https://www.twilio.com/try-twilio) for free!
* An SMS enabled [phone number](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart#sign-up-for-a-twilio-account-and-get-a-phone-number).
* A [Twilio Frontline instance](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart#create-a-new-twilio-frontline-instance).
* Twilio Conversations [configured](https://www.twilio.com/docs/frontline/nodejs-demo-quickstart#configure-twilio-conversations) to use the Frontline Conversations service as it's default conversation service.
* A Free [Hubspot Account](https://www.hubspot.com)

Once you reach the step to "Configure the Frontline Integration Service" you are ready to deploy this app.

## Project setup
Follow these steps to clone the repository, install dependencies, and set environment variables:

```bash
# Clone the repository:
git clone

# Change to the project directory:
cd frontline-hubspot-serverless-quickstart

# Install dependencies:
npm install

# Copy the sample environment variables file to .env:
cp .env.example .env
```

### Environment Variables Reference
```bash
ACCOUNT_SID= # Your twilio account SID, found in the console.
AUTH_TOKEN= # Your auth token, found in the console.

SSO_REALM_SID= # Go to console > Frontline > Manage > SSO/Log in

TWILIO_SMS_NUMBER= # SMS enabled phone number in e164 format (e.g. +14135551234)
TWILIO_WHATSAPP_NUMBER= # A Twilio WhatsApp sender, if you have one.

HUBSPOT_API_KEY= # Your Hubspot API key
```

## Deploy
Deploy this Serverless app with one command:
```bash
twilio serverless:deploy --service-name=frontline-hubspot-quickstart
```
> :information_source: **Always deploy to the same Twilio Account as your Frontline Service**: This integration service uses Twilio-signed requests to protect the callback URLs. The callback URLs will reject requests from a different Twilio account with a 403 error. You can check which account you're deploying to with `twilio profiles:list` and add another account with `twilio profiles:add`. 

If your deploy is successful, you should see an output that looks like this:

<img src="readmefiles/D1.png">

The app provides five callback URLs:
* `/callbacks/crm`: called when Frontline loads the contact list or a user detail page.
* `/callbacks/outgoing-conversation`: called when a user initiates an outbound conversation.
* `/callbacks/routing`: called when a messages is sent inbound that does not match an open conversation.
* `/callbacks/templates`: called when a user opens the templates menu.
* `/callbacks/twilio-conversations`: called after a conversation is created or a participant is added to the conversation.


## Configure Callbacks
Copy and paste the callback URLs (uncluding your unique subdomain) into your Frontline configuration in the console.

### Routing configuration
In the Twilio Console, go to ***Frontline > Manage > Routing*** and add `[your_app_url]/callbacks/routing` under Custom routing:
<img width="1278" alt="Screen Shot 2022-02-28 at 11 43 02 PM" src="https://user-images.githubusercontent.com/1418949/156145008-bdffde5e-3c71-465e-b660-a9312f6167cc.png">

### Frontline callbacks
In the Twilio Console, go to ***Frontline > Manage > Callbacks*** and copy / paste the following callback URLs from your Frontline integration service:
* CRM Callback URL: `[your_app_url]/callbacks/crm`
* Outgoing Conversations Callback URL: `[your_app_url]/callbacks/outgoing-conversation`
* Templates Callback URL: `[your_app_url]/callbacks/templates`

### Conversations Setup Callbacks
In the Twilio Console, go to ***Conversations > Services > Defaults***
* Find the service entry marked `Default Conversation Service` and click on the 'View Service' button.
* From the service configuration page, click on the ***Webhooks** link
* In the Webhook Url section, set BOTH the pre and post webhook URLs to `[your_app_url]/callbacks/twilio-conversations`
* In the Webhook Filtering section, select the `onConversationAdded` and `onParticipantAdded` events.

This callback receives the `onConversationAdd` and `onParticipantAdded` events from the Conversations service and sets the name of the conversation as well as the participant and participant avatar that is joining the conversation.

