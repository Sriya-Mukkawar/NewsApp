from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import time
import torch
from typing import Dict, Any

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize BART model with specific parameters
bart_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")
bart_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn")

# Initialize T5 model with specific parameters
t5_tokenizer = AutoTokenizer.from_pretrained("t5-base")
t5_model = AutoModelForSeq2SeqLM.from_pretrained("t5-base")

def bart_summarize(text: str, max_length: int = 150, min_length: int = 50) -> Dict[str, Any]:
    start_time = time.time()
    
    # BART specific preprocessing with different parameters
    inputs = bart_tokenizer([text], max_length=1024, return_tensors="pt", truncation=True)
    summary_ids = bart_model.generate(
        inputs["input_ids"],
        max_length=max_length,
        min_length=min_length,
        length_penalty=1.5,  # Lower penalty for more concise summaries
        num_beams=6,  # More beams for better quality
        no_repeat_ngram_size=3,  # Prevent repetition
        temperature=0.7,  # Add some randomness
        top_k=50,  # Limit vocabulary
        top_p=0.95,  # Nucleus sampling
        early_stopping=True
    )
    summary = bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    
    end_time = time.time()
    time_taken = end_time - start_time
    
    print(f"\nBART Model Summary:")
    print(f"Time taken: {time_taken:.2f} seconds")
    print(f"Summary: {summary}\n")
    
    return {
        "summary": summary,
        "time_taken": time_taken
    }

def t5_summarize(text: str, max_length: int = 150, min_length: int = 50) -> Dict[str, Any]:
    start_time = time.time()
    
    # T5 specific preprocessing with different parameters
    inputs = t5_tokenizer("summarize: " + text, max_length=1024, return_tensors="pt", truncation=True)
    summary_ids = t5_model.generate(
        inputs["input_ids"],
        max_length=max_length,
        min_length=min_length,
        length_penalty=2.5,  # Higher penalty for longer summaries
        num_beams=4,  # Fewer beams for faster generation
        no_repeat_ngram_size=2,  # Less strict repetition prevention
        temperature=0.9,  # More randomness
        top_k=100,  # Larger vocabulary
        top_p=0.92,  # Different sampling strategy
        early_stopping=True
    )
    summary = t5_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    
    end_time = time.time()
    time_taken = end_time - start_time
    
    print(f"\nT5 Model Summary:")
    print(f"Time taken: {time_taken:.2f} seconds")
    print(f"Summary: {summary}\n")
    
    return {
        "summary": summary,
        "time_taken": time_taken
    }

@app.route('/')
def home():
    return "Backend is running!"

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    text = data.get('text', '')
    model = data.get('model', 'bart')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    print("\n=== Starting News Summarization ===")
    print(f"Text length: {len(text)} characters")
    print(f"Requested model: {model.upper()}")
    
    try:
        if model.lower() == 'bart':
            result = bart_summarize(text)
            return jsonify({
                'summary': result['summary'],
                'time_taken': result['time_taken'],
                'model': 'BART'
            })
        else:
            result = t5_summarize(text)
            return jsonify({
                'summary': result['summary'],
                'time_taken': result['time_taken'],
                'model': 'T5'
            })
    except Exception as e:
        print(f"Error during summarization: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/compare', methods=['POST'])
def compare_models():
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    print("\n=== Starting Model Comparison ===")
    print(f"Text length: {len(text)} characters")
    
    try:
        # Run multiple iterations for better comparison
        iterations = 5
        t5_times = []
        bart_times = []
        
        for i in range(iterations):
            print(f"\nIteration {i + 1}/{iterations}")
            t5_result = t5_summarize(text)
            bart_result = bart_summarize(text)
            
            t5_times.append(t5_result['time_taken'])
            bart_times.append(bart_result['time_taken'])
        
        # Calculate averages
        avg_t5_time = sum(t5_times) / iterations
        avg_bart_time = sum(bart_times) / iterations
        
        print("\n=== Final Comparison Results ===")
        print(f"T5 Average Time: {avg_t5_time:.2f} seconds")
        print(f"BART Average Time: {avg_bart_time:.2f} seconds")
        print("==============================\n")
        
        return jsonify({
            'comparison': {
                't5': {
                    'average_time': avg_t5_time,
                    'min_time': min(t5_times),
                    'max_time': max(t5_times),
                    'model_size': 'Base (220M parameters)',
                    'strengths': [
                        'Faster inference time',
                        'Smaller memory footprint',
                        'Good for shorter texts',
                        'More efficient for real-time applications'
                    ]
                },
                'bart': {
                    'average_time': avg_bart_time,
                    'min_time': min(bart_times),
                    'max_time': max(bart_times),
                    'model_size': 'Large (400M parameters)',
                    'strengths': [
                        'Better quality summaries',
                        'More coherent output',
                        'Better at handling longer texts',
                        'More context-aware'
                    ]
                }
            }
        })
    except Exception as e:
        print(f"Error during comparison: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5002)

