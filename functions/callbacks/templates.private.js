
// Private file for configuring and retrieving templates

exports.quickReplies =[
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