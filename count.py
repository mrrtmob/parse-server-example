import tiktoken

# Initialize the tokenizer (using OpenAI's default model tokenizer)
tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")

# Sample text
text = """Due to the fact that in the formulation of Vital Nivea skin regenerating and refreshing toner, there is the property of hydrating and increasing the elasticity of the skin, therefore it prevents the creation of any wrinkles and premature aging of the skin. By using the above revitalizing toner, the skin pores are opened and able to breathe. Nivea's Vital skin rejuvenating and refreshing toner can be used for all types of skin and there is no limit to its use. This product is made in France and due to the fact that it can remove the dead layers of the skin surface, it can be used as a sharp skin refresher.Then you can rinse your face after a few seconds."""

# Tokenize the text and count tokens
tokens = tokenizer.encode(text)
token_count = len(tokens)

print(f"Token Count: {token_count}")
