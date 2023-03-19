jQuery(document).ready(function($) {
    var socket = io.connect('http://167.99.200.88:3000');
    var chatForm = $('#gpt-chat-form');
    var chatInput = $('#gpt-chat-input');
    var chatMessages = $('#gpt-chat-messages');

    chatForm.on('submit', function(e) {
        e.preventDefault();
        var message = chatInput.val().trim();
        if (message.length > 0) {
            socket.emit('user_message', {content: message});
            chatMessages.append('<div class="user-message">' + message + '</div>');
            chatInput.val('');
        }
    });

    socket.on('assistant_message', function(data) {
        chatMessages.append('<div class="assistant-message">' + data.content + '</div>');
    });
});
