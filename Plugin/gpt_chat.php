<?php
/*
Plugin Name: GPT Chat
Description: Integração do GPT-4 Chat com o WordPress.
Version: 1.0
Author: Your Name
*/

function gpt_chat_enqueue_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_script('socket.io', 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.3.2/socket.io.min.js', array(), '4.3.2', true);
    wp_enqueue_script('gpt_chat_script', plugins_url('gpt_chat.js', __FILE__), array('jquery', 'socket.io'), '1.0', true);
}

add_action('wp_enqueue_scripts', 'gpt_chat_enqueue_scripts');

function gpt_chat_widget() {
    ?>
    <div id="gpt-chat-widget">
        <div id="gpt-chat-messages"></div>
        <form id="gpt-chat-form">
            <input type="text" id="gpt-chat-input" placeholder="Digite sua pergunta...">
            <button type="submit">Enviar</button>
        </form>
    </div>
    <?php
}

add_shortcode('gpt_chat', 'gpt_chat_widget');
