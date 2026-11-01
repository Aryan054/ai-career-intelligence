import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Restrict multi-threading memory overhead on low-RAM containers
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

MODEL_NAME = "all-MiniLM-L6-v2"
_embedder = None

def get_embedder():
    """Lazy-load the SentenceTransformer model to keep startup RAM minimal."""
    global _embedder
    if _embedder is None:
        try:
            import torch
            torch.set_num_threads(1)
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Falling back to zero-vector embeddings.")
            return None
    return _embedder

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding vector for the given text with memory fallback."""
    embedder = get_embedder()
    if embedder is None:
        # 384-dimensional zero vector matching all-MiniLM-L6-v2 output
        return [0.0] * 384
    try:
        vector = embedder.encode(text)
        return vector.tolist()
    except Exception as e:
        logger.warning(f"Failed to encode text embedding: {e}")
        return [0.0] * 384
