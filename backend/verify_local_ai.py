from transformers import pipeline
import time

def test_summarization():
    print("Loading model...")
    start_time = time.time()
    try:
        summarizer = pipeline(
            "summarization", 
            model="sshleifer/distilbart-cnn-12-6",
            device=-1
        )
        print(f"Model loaded in {time.time() - start_time:.2f} seconds.")
        
        text = "Job Title: Senior Software Engineer. Skills: React, Python, AWS, Docker, GraphQL. Experience: 8 years of building scalable web applications and leading engineering teams. Professionally summarize this person's career for a resume."
        
        print("\nGenerating summary...")
        result = summarizer(text, max_length=100, min_length=30, do_sample=False)
        print("\nResult:")
        print(result[0]['summary_text'])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_summarization()
