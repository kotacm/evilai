const chat = (id) => window.document.getElementById(id);

// Set the new API endpoint URL
chat.endPoint  = "https://wrmgpt.com/v1/chat/completions";
chat.headers = {
  'x-wormgpt-provider': 'worm_gpt',
  'Content-Type': 'application/json',
}
chat.body  = { 
  messages: [{ role: "user", content: "" }], // The content will be set in the stream function
  max_tokens: 820
}
chat.history = []

// stream result from wrmgpt
chat.stream = function (prompt) {
  chat.body.messages[0].content = prompt; // Set the user's prompt
  chat.result = ''
  chat.controller = new AbortController();
  const signal = chat.controller.signal

  // Include the history in the request
  for (let i=chat.history.length-1; i>=0 && i>(chat.history.length-3); i--) {
    chat.body.messages.unshift( { role:'assistant', content: chat.history[i].result } );
    chat.body.messages.unshift( { role:'user', content: chat.history[i].prompt } );
  }
  
  fetch( chat.endPoint, { method:'POST', headers: chat.headers, body: JSON.stringify(chat.body), signal } )
  .then( response => { 
    if (!response.ok) {
        throw new Error('failed to get data, error status '+response.status)
    }
    return response.json();
  })
  .then(json => {
    if (json.choices && json.choices.length > 0) {
      chat.result = json.choices[0].message.content;
      chat.onmessage(chat.result);
      chat.oncomplete(chat.result);
    }
  })
  .catch( error => chat.onerror(error) );
}

// send prompt to wrmgpt API (not used in vanilla-chatGPT)
chat.send = function (prompt) {
  chat.body.messages[0].content = prompt; // Set the user's prompt
  chat.result = ''
  chat.controller = new AbortController();
  const signal = chat.controller.signal

  fetch( chat.endPoint, { method:'POST', headers: chat.headers, body: JSON.stringify(chat.body), signal } )
  .then(response => response.json() )
  .then(json => {
     if (json.choices && json.choices.length > 0) {
        chat.result = json.choices[0].message.content;
        chat.onmessage(chat.result);
        chat.oncomplete(chat.result);
     }	 
  })
  .catch(error => chat.onerror(error));
}

// default error handle
chat.onerror = (error) => { alert(error);  };

// clear API key when logout
chat.logout = () => { 
  if (confirm( 'Logout and clear API Key?')) localStorage.clear();
}

// export conversation
chat.export = (fname) => {
  const link = document.createElement('a');
  link.href = 'data:text/plain;charset=utf-8,' 
  chat.history.forEach( (x) => { 
    link.href += encodeURIComponent('### '+x.prompt+'\n\n'+x.result+'\n\n') 
  } );  
  link.download = fname||('chat-'+new Date().toISOString().substr(0,16))+'.md';
  link.click();
  }
