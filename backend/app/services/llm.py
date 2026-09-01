import os
import httpx

class LLMProvider:
    def generate(self, prompt: str) -> str:
        raise NotImplementedError

class MockLLMProvider(LLMProvider):
    def generate(self, prompt: str) -> str:
        if "recommendation" in prompt.lower():
            return "Based on your missing skills, we highly recommend taking a course on Docker and Kubernetes to strengthen your profile for Backend and DevOps roles."
        elif "interview" in prompt.lower():
            return "Good answer! However, you could improve by mentioning how you would handle connection pooling and database indexing."
        return "This is a mocked LLM response because no API key is provided."

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.openai.com/v1/chat/completions"

    async def generate_async(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(self.url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
            
    def generate(self, prompt: str) -> str:
        # Simplistic sync wrapper for demonstration
        import asyncio
        return asyncio.run(self.generate_async(prompt))

def get_llm_provider() -> LLMProvider:
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return OpenAIProvider(api_key)
    print("WARNING: Using MockLLMProvider since OPENAI_API_KEY is not set.")
    return MockLLMProvider()
