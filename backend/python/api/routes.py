from flask import Blueprint, json, request, jsonify, Response, stream_with_context
from typing import Optional
from python.llm.model import LLMModel
from python.utils.errors import ModelError
import logging

api = Blueprint("api", __name__)
logger = logging.getLogger(__name__)

model: Optional[LLMModel] = None


def init_model(model_path: str, n_ctx: int = 4096, n_threads: Optional[int] = None):
    global model
    try:
        model = LLMModel(model_path=model_path, n_ctx=n_ctx, n_threads=n_threads)
    except Exception as e:
        logger.error(f"Failed to initialize model: {e}")
        raise ModelError(f"Failed to initialize model: {e}")


@api.route("/generate", methods=["POST"])
def generate():
    if not model:
        return jsonify({"error": "Model not initialized"}), 500

    data = request.json
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing prompt"}), 400

    try:
        logger.info(f"Received generation request with prompt: {data['prompt']}")
        stream = data.get("stream", False)

        params = {
            "max_tokens": data.get("max_tokens", 4096),
            "temperature": data.get("temperature", 0.7),
            "top_p": data.get("top_p", 0.95),
            "stream": stream,
        }

        if stream:

            def generate_stream():
                try:
                    for chunk in model.generate(data["prompt"], **params):
                        yield f"data: {json.dumps(chunk)}\n\n"
                except Exception as e:
                    logger.error(f"Stream generation error: {e}", exc_info=True)
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                finally:
                    yield "data: [DONE]\n\n"

            return Response(
                stream_with_context(generate_stream()),
                mimetype="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            )

        response = model.generate(data["prompt"], **params)
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error during generation: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@api.route("/tokenize", methods=["POST"])
def tokenize():
    if not model:
        return jsonify({"error": "Model not initialized"}), 500

    data = request.json
    if not data or "text" not in data:
        return jsonify({"error": "Missing text"}), 400

    try:
        tokens = model.tokenize(data["text"])
        return jsonify({"tokens": tokens}), 200

    except ModelError as e:
        logger.error(f"Failed to tokenize text: {e}")
        return jsonify({"tokenization error": str(e)}), 500


@api.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model_loaded": model is not None})
