import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Dummy data for demonstration purposes
data = [
    {"text": "Experienced Python developer with Django and FastAPI.", "label": "Backend Developer"},
    {"text": "Built scalable APIs in Go and PostgreSQL.", "label": "Backend Developer"},
    {"text": "ReactJS frontend engineer, Tailwind, and Vite.", "label": "Frontend Developer"},
    {"text": "UI/UX implementation using Vue and Nuxt.", "label": "Frontend Developer"},
    {"text": "Trained XGBoost models and used pandas, scikit-learn.", "label": "Data Scientist"},
    {"text": "Deep learning with PyTorch, NLP pipelines with spaCy.", "label": "Data Scientist"},
    {"text": "Kubernetes cluster administration, Docker, AWS.", "label": "DevOps Engineer"},
    {"text": "CI/CD pipelines using GitHub Actions, Terraform.", "label": "DevOps Engineer"},
]

def train_and_save_model():
    print("Preparing dataset...")
    texts = [d["text"] for d in data]
    labels = [d["label"] for d in data]
    
    X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.25, random_state=42)
    
    print("Training TF-IDF + LogisticRegression model...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english')),
        ('clf', LogisticRegression(random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    print("Evaluating model...")
    predictions = pipeline.predict(X_test)
    print(classification_report(y_test, predictions, zero_division=0))
    
    model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml", "models")
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, "resume_classifier.joblib")
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
