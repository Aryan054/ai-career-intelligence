import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "resume_classifier.joblib")

_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        if os.path.exists(MODEL_PATH):
            _classifier = joblib.load(MODEL_PATH)
        else:
            print("WARNING: Classifier model not found. Run scripts/train_model.py first.")
    return _classifier

def predict_category(text: str) -> str:
    clf = get_classifier()
    if clf is None:
        return "Unknown"
    return clf.predict([text])[0]
