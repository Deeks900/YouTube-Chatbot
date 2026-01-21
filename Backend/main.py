#First phase is the Indexing phase where we create the knowledge base from the YouTube video.
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os

# Load environment variables from .env
load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "youtubechatbot"

index_name = "youtubechatbot"

def createKnowledgeBase(videoId):
    isSuccess = True
    error_msg = ""
    try:
        #Substeps1 : Document Ingestion - This time we are using Youtube API but could have also used Langchain document loaders 
        youTubeObject = YouTubeTranscriptApi()
        resultTranscript = youTubeObject.fetch(videoId, languages=['en', 'hi'])
        #From the result get the text part aand join it
        fullTranscript = " ".join([snippet.text for snippet in resultTranscript])
        #Create a single string of trnascript that is removing line breaks.
        fullTranscript = " ".join(fullTranscript.splitlines())
        #------THis finishes the first substep of Document Ingestion

        #Substep2 : Text Chunking : Break into semantically meaningful chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=0)
        splittedText = text_splitter.split_text(fullTranscript)
        #------This finishes the second substep of Text Chunking

        #Substep3&4 : Embedding Generation and storage in vector store : Create embeddings for each chunk
        embeddings = GoogleGenerativeAIEmbeddings(model="text-embedding-004")
        vectorStore = PineconeVectorStore.from_texts(splittedText, embeddings, index_name="youtubechatbot")
        
        print("Knowledge base created successfully.")
        print(f"Total Chunks created and stored in vector store: {len(splittedText)}")
        print("Vector Store Details:")
        print(vectorStore)

        #------This finishes the third and fourth substeps of Embedding Generation and storage in vector store
    except Exception as e:
        isSuccess = False
        error_msg = str(e)
        print(f"An error occurred: {e}.No captions available for this video.")
    finally:
        return isSuccess, error_msg


if __name__ == "__main__":
    videoId = input("Enter the video ID: ")
    createKnowledgeBase(videoId)