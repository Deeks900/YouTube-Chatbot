from flask import Flask, request, jsonify
from main import createKnowledgeBase
import os
from getResult import getResult
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app) 
# creating a Flask app 
app = Flask(__name__) 

@app.route('/processTranscript')
@cross_origin()
def process_transcript():
    video_id = request.args.get('videoId').strip()
    if not video_id:
        return jsonify(success=False, error='Missing videoId'), 400
    
    isSuccess, error_msg = createKnowledgeBase(video_id)
    if not isSuccess:
        return jsonify(success=False, error=error_msg), 500
    
    return jsonify(success=True), 200

@app.route('/answerQuestion')
@cross_origin()
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