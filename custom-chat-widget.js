// Função para criar uma mensagem no chat
function createChatMessage(content, role) {
    const messageContainer = document.createElement('div');
    messageContainer.className = role;
    const messageContent = document.createElement('p');
    messageContent.innerText = content;
    messageContainer.appendChild(messageContent);
    return messageContainer;
  }
  
  // Função para enviar a mensagem do usuário ao GPT-3.5-turbo e receber a resposta
  async function sendMessageToGPT(userMessage) {
    const api_key = 'sk-8LLmV5kWebgtAEkpKvmJT3BlbkFJ7DF5ClOsQ614e0JkLl9yEY';
    const model = 'gpt-3.5-turbo';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userMessage },
        ],
      }),
    });
  
    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
  
    return assistantMessage;
  }
  
  // Função para lidar com o envio da mensagem
  async function handleMessageSend(event) {
    event.preventDefault();
  
    const messageInput = document.getElementById('message-input');
    const userMessage = messageInput.value;
    messageInput.value = '';
  
    const chatContainer = document.getElementById('chat-container');
    chatContainer.appendChild(createChatMessage(userMessage, 'user'));
  
    const assistantMessage = await sendMessageToGPT(userMessage);
    chatContainer.appendChild(createChatMessage(assistantMessage, 'assistant'));
  }
  
  // Função para criar o widget de chat
  function createChatWidget() {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chat-widget';
  
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatWidget.appendChild(chatContainer);
  
    const form = document.createElement('form');
    form.id = 'message-form';
    form.addEventListener('submit', handleMessageSend);
  
    const messageInput = document.createElement('input');
    messageInput.id = 'message-input';
    messageInput.type = 'text';
    messageInput.placeholder = 'Digite sua mensagem...';
    form.appendChild(messageInput);
  
    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.innerText = 'Enviar';
    form.appendChild(sendButton);
  
    chatWidget.appendChild(form);

    const chatWidgetImage = document.createElement('img');
    chatWidgetImage.src = chatWidgetImageUrl;
    chatWidgetImage.id = 'chat-widget-image';
    chatWidgetImage.addEventListener('click', () => {
        chatContainer.style.display = chatContainer.style.display === 'block' ? 'none' : 'block';
        form.style.display = form.style.display === 'block' ? 'none' : 'block';
  });

  chatWidget.appendChild(chatWidgetImage);
  
  return chatWidget;
}

// Inicialização do chat widget
document.addEventListener('DOMContentLoaded', () => {
  const chatWidget = createChatWidget();
  document.body.appendChild(chatWidget);
});