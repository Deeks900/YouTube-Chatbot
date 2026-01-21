from flask import Flask, request, jsonify
from main import createKnowledgeBase
import os
from getResult import getResult
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 
# creating a Flask app 
app = Flask(__name__) 

@app.route('/processTranscript')
def process_transcript():
    video_id = request.args.get('videoId').strip()
    if not video_id:
        return jsonify(success=False, error='Missing videoId'), 400
    
    isSuccess = createKnowledgeBase(video_id)
    if isSuccess == False:
        return jsonify(success=False, error='Failed to process transcript'), 500
    
    return jsonify(success=True), 200

@app.route('/answerQuestion')
def answer_question():
    videoId = request.args.get('videoId').strip()
    question = request.args.get('question').strip()
    if not videoId or not question:
        return jsonify(error='Missing videoId or question'), 400
        
    answer = getResult(videoId, question)
    return jsonify(answer=answer), 200

# driver function 
if __name__ == '__main__': 
    app.run(debug = True) 