from augmentation import prompt
import os
from langchain_core.runnables import RunnableLambda, RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from llm import get_llm
from retreiver import retrieveDocuments, formatRetreivedDocs    

def getResult(videoId, question):
    ans = None
    try:
        
        vectorStore = PineconeVectorStore(index_name="youtubechatbot", embedding=GoogleGenerativeAIEmbeddings(model="text-embedding-004"))
        question = question.strip()
        createllm = get_llm()
        

        parallelChain = RunnableParallel(
            {
                "context": RunnableLambda(lambda question: retrieveDocuments(vectorStore, question)) 
                                    | RunnableLambda(lambda docs: formatRetreivedDocs(docs)),
                "question": RunnablePassthrough()
            }
        )
        parser = StrOutputParser()

        #Now let's make another serialize chain
        finalResultChain = parallelChain | prompt | createllm | parser
        ans = finalResultChain.invoke(question)
        print(f"Final Answer: {ans}")

    except Exception as e:
        print(f"An error occurred: {e}.No captions available for this video.")
    finally:
        return ans

# getResult("Rni7Fz7208c", "What is the main topic discussed in the video?")  
