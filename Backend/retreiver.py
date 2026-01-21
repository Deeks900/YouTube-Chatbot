from langchain_google_genai import GoogleGenerativeAIEmbeddings

def retrieveDocuments(vectorStore, question):
    docs = []
    try:
        #Convert question to embedding and retrieve top 4 similar documents from vector store
        embeddings = GoogleGenerativeAIEmbeddings(model="text-embedding-004")
        vector = embeddings.embed_query(question)
        docs = vectorStore.similarity_search_by_vector(vector, k=4)
        print(f"Number of Documents fetched are {len(docs)}")
    except Exception as e:
        print(f"An error occurred: {e} while retrieving documents.")  
    finally:
        return docs

def formatRetreivedDocs(docs):
    formattedContext = None
    try:
        #Now we cannot send 4 different documents to the prompt so let's make a string combining these all
        formattedContext = "\n\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"An error occurred: {e} while formatting documents.")
    finally:
        return formattedContext    