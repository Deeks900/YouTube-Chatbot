from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate(
    template = """You are a helpful assistant.
    Answer ONLY from the provided transcript context.
    Provide a detailed and comprehensive answer based on the context.
    If the context is insufficient, say "I don't know based on the available transcript."
    Context: {context}
    Question: {question}
    """,
    input_variables=['context', 'question'],
)