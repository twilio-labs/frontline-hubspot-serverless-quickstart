/**
 * Fetches response templates based on the customer and worker contexts
 * @param {String} worker - Email/Identity of the worker.
 * @param {String} customerDetails - Customer object
 * @returns {Array} Array of Twilio Frontline Templates.
 */
 const getTemplatesByCustomer = async (worker, customerDetails)=>{
    
    let customerName = customerDetails.properties.firstname;
      
      let template = JSON.parse(JSON.stringify(quickRepliesTemplates));
      
      for(let cat of template){
        for(let tmp of cat.templates){
          tmp.content = compileTemplate(tmp.raw, customerName, worker, worker);
          delete tmp.raw;
        }
      }
  
    
    return template;   
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
  
  const quickRepliesTemplates =[
    {
      display_name: 'Openers',
      templates:[
        {
          raw:'Hi {{Name}}, {{Author}} here. Thanks for reaching out.'
        },
        {
          raw:'Hi, How may I help?. ~ {{Author}}'
        }
      ]
    },
    {
      display_name: 'Replies',
      templates:[
        {
          raw:'You can drop us an email via contact@example.com and cc me at {{Email}}'
        },
        {
          raw:'You can setup a meeting at a time of your choosing via https://example.com/meeting-link'
        }
       
      ]
    },
    {
      display_name: 'Closing',
      templates:[
        {
          raw :'Happy to help, {{Name}}. If you have a moment could you leave a review about our interaction at this link: https://example.com. ~ {{Author}}.'
        }
      ]
    },
    //Grouped all Whatsapp approved starter conversations here. Note the WhatsAppApproved Booleab attribute.
    {
      display_name: 'WhatsApp Starters',
      templates:[
        {
          raw:'Hi {{Name}}, We have an update for you! Reply to continue the conversation.',
          whatsAppApproved: true
        },
        {
          raw:'Hi {{Name}}, {{Author}} here.  I\'d like to check something with you. Is now a good time? Do drop me a reply.',
          whatsAppApproved: true
        },
        {
          raw:'Hi {{Name}}, {{Author}} from Org here.  I\'d like to check something with you. Is now a good time? Do drop me a reply.',
          whatsAppApproved: true
        },
        {
          raw:'Hi {{Name}}, {{Author}} from Org here.  I\'d like to follow up on the message you sent to us earlier. Is now a good time? Do drop me a reply.',
          whatsAppApproved: true
        }
      ]
    }
  ]
  
  
  Object.assign(exports, {
    getTemplatesByCustomer
  });