document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(true));
  document.querySelector('#compose-form').onsubmit = () => {

    // all are strings
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    // sends the data to the api then loads the inbox
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
      });

    load_mailbox('inbox')
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function view_email(emailID, mailbox) {
  fetch(`/emails/${emailID}`)
  .then(response => response.json())
  .then(email => {
    const recipient = email.recipients;
    const sender = email.sender;
    const subject = email.subject;
    const time = email.timestamp;
    const body = email.body;

    document.querySelector('#email-content').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    document.querySelector('#from').innerHTML = `<b>From: </b> ${sender}`;
    document.querySelector('#to').innerHTML = `<b>To: </b> ${recipient}`;
    document.querySelector('#subject').innerHTML = `<b>Subject: </b> ${subject}`;
    document.querySelector('#time').innerHTML = `<b>Timestamp: </b> ${time}`;
    document.querySelector('#body').innerHTML = body

    //Mark email as read
    fetch(`/emails/${emailID}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    
    // Add buttons

    const button = document.querySelector('#button');
    while(button.lastChild){
      button.removeChild(button.lastChild)
    }

    //add archive button
    if(mailbox !== 'sent'){
      if(email.archived) {
        const unarchive = document.createElement('button')
        unarchive.innerHTML = "Unarchive"
        unarchive.addEventListener('click', function() {
          fetch(`/emails/${emailID}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          }).then(load_mailbox('inbox'))
        })
        document.querySelector('#button').appendChild(unarchive)
      }
      else {
        const archive = document.createElement('button')
        archive.innerHTML = "Archive"
        archive.addEventListener('click', function() {
          fetch(`/emails/${emailID}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          }).then(load_mailbox('inbox'))
        })
        document.querySelector('#button').appendChild(archive)
      }
    }

    //Add reply button
    const reply = document.createElement('button')
    reply.textContent = 'Reply'
    reply.addEventListener('click', () => {
      document.querySelector('#compose-recipients').value = sender

      if(subject.slice(0,3) === 'Re:'){
        document.querySelector('#compose-subject').value = `Re: ${subject}`
      } else {
        document.querySelector('#compose-subject').value = subject
      }

      document.querySelector('#compose-body').value = `On ${time} ${sender} wrote: ${body}`;

      compose_email(false)
    })

    button.appendChild(reply);
  })
}

function compose_email(shouldClear) {

  // Show compose view and hide other views
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  if(shouldClear) {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get mailbox data and set up the inbox page
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const emailElement = document.createElement('div');
      
      const recipient = document.createElement('span')
      recipient.innerHTML = `<b>${email.recipients}</b>`

      const subject = document.createElement('span')
      subject.innerHTML = email.subject

      const front = document.createElement('span')
      front.appendChild(recipient);
      front.appendChild(subject);

      const time = document.createElement('span')
      time.innerHTML = email.timestamp

      emailElement.appendChild(front)
      emailElement.appendChild(time)

      emailElement.style.border = '1px solid black';
      emailElement.style.padding = '5px';
      emailElement.style.display = 'flex';
      emailElement.style.alignContent = 'center';
      emailElement.style.justifyContent = 'space-between';

      recipient.style.marginRight = '10px';

      emailElement.style.backgroundColor = email.read ? 'grey' : 'inherit';

      emailElement.addEventListener('click', () => view_email(email.id, mailbox))

      document.querySelector('#emails-view').appendChild(emailElement)
    })
  })
}