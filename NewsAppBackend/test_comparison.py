import requests
import json
import time

def test_comparison():
    # Sample news article
    sample_text = """
    Artificial intelligence (AI) has made significant strides in recent years, transforming various industries and aspects of daily life. 
    From healthcare to transportation, AI technologies are being deployed to improve efficiency, accuracy, and decision-making processes. 
    In healthcare, AI-powered systems are helping doctors diagnose diseases more accurately and develop personalized treatment plans. 
    The transportation sector is seeing the rise of autonomous vehicles, which promise to make roads safer and reduce traffic congestion. 
    Meanwhile, in the business world, AI is being used to analyze vast amounts of data, predict market trends, and automate routine tasks. 
    However, these advancements also raise important ethical questions about privacy, job displacement, and the potential misuse of AI technologies. 
    As AI continues to evolve, it's crucial to establish proper regulations and ethical guidelines to ensure its responsible development and deployment.
    """
    
    # Test the comparison endpoint
    url = "http://localhost:5002/compare"
    headers = {'Content-Type': 'application/json'}
    data = {'text': sample_text}
    
    print("Testing model comparison...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        results = response.json()
        print("\nComparison Results:")
        print(json.dumps(results, indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_comparison() 