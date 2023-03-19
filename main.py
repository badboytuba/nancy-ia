import os
import sys
import openai
import datetime
from flask import Flask, request, Response
from flask_socketio import SocketIO, emit
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from threading import Thread
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, cors_allowed_origins="*")

# Configurar a API OpenAI (GPT-4)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Configurar a API do Slack
slack_bot_token = os.getenv("SLACK_BOT_TOKEN")
slack_client = WebClient(token=slack_bot_token)

# Conectar ao banco de dados MongoDB
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.ia_nancy
conversations = db["conversations-ia-nancy"]

def check_mongo_connection(client):
    try:
        client.admin.command('ping')
        print("Connected to MongoDB")
        return True
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return False

connected = check_mongo_connection(client)
if not connected:
    print("Exiting due to MongoDB connection error.")
    sys.exit(1)

user_messages = {}

def replace_openai_with_bader(message):
    return message.replace("OpenAI", "BADER")

def save_conversation_to_db(user_id, username, app, question, answer):
    conversation_data = {
        "user_id": user_id,
        "username": username,
        "app": app,
        "question": question,
        "answer": answer,
        "timestamp": datetime.datetime.utcnow(),
    }

    conversations.insert_one(conversation_data)

def send_gpt_response(client, channel_id, user_id, user_messages, app):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=user_messages[user_id],
            temperature=0.7,
            timeout=600,
        )
        message_content = response.choices[0].message.content

        # Substituir OpenAI por BADER na resposta do modelo
        message_content = replace_openai_with_bader(message_content)

        # Adicione a resposta do modelo ao histórico de mensagens do usuário
        user_messages[user_id].append({"role": "assistant", "content": message_content})

        # Obter o nome do usuário no Slack
        if app == "slack":
            user_info = client.users_info(user=user_id)
            username = user_info['user']['profile']['display_name_normalized']
        else:
            username = user_messages[user_id][0]['username']

        # Salve a conversa no banco de dados
        save_conversation_to_db(user_id, username, app, user_messages[user_id][-1]["content"], message_content)

        # Envie a resposta gerada de volta para o canal do Slack com a menção ao usuário
        client.chat_postMessage(
            channel=channel_id,
            text=f"<@{user_id}>: {message_content}"
        )
    except Exception as e:
        print(f"Error: {e}")


@app.route("/", methods=["POST"])
def handle_post_request():
    data = request.form
    channel_id = data.get('channel_id')
    user_id = data.get('user_id')
    text = data.get('text')

    if user_id not in user_messages:
        user_messages[user_id] = []

    user_messages[user_id].append({"role": "user", "content": text})

    gpt4_thread = Thread(target=send_gpt_response, args=(slack_client, channel_id, user_id, user_messages, "slack"))
    gpt4_thread.start()

    response_message = f"Sua pergunta *{text}* está sendo processada. Em breve, você receberá uma resposta no Slack."
    return Response(response_message, content_type="text/plain; charset=utf-8")

@socketio.on('message')
def handle_message(data):
    user_id = request.sid

    if user_id not in user_messages:
        user_messages[user_id] = []

    user_messages[user_id].append({"role": "user", "content": data['content'], "username": data['username']})

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=user_messages[user_id],
            temperature=0.7,
            timeout=600,
        )
        message_content = response.choices[0].message.content

        # Substituir OpenAI por BADER na resposta do modelo
        message_content = replace_openai_with_bader(message_content)

        user_messages[user_id].append({"role": "assistant", "content": message_content})

        # Salve a conversa no banco de dados
        save_conversation_to_db(user_id, data['username'], "site", data['content'], message_content)

        emit('message_response', {'content': message_content})

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    socketio.run(app, host='167.99.200.88', port=3000, debug=False)
