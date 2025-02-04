import os
import logging
from flask import Flask
from flask_cors import CORS
from python.api.routes import api, init_model
from python.utils.errors import ConfigError

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api, url_prefix="/api")
    return app


def main():
    try:

        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_name = os.environ.get("MODEL_NAME", "DeepSeek-R1-Distill-Qwen")
        model_path = os.path.join(project_root, "models", f"{model_name}.gguf")
        logger.info(f"Model path: {model_path}")

        logger.debug(f"Attempting to load model from: {model_path}")

        if not os.path.exists(model_path):
            raise ConfigError(f"Model file not found at: {model_path}")
        port = int(os.environ.get("PORT", 5000))
        host = os.environ.get("HOST", "127.0.0.1")

        init_model(
            model_path=model_path,
            n_ctx=int(os.environ.get("LLM_CONTEXT_LENGTH", "2048")),
            n_threads=int(os.environ.get("LLM_THREADS", "4")),
        )

        app = create_app()
        logger.info(f"Starting server on {host}:{port}")
        app.run(host=host, port=port, debug=True)

    except ConfigError as e:
        logger.error(f"Failed to start server: {e}")
        exit(1)

    except Exception as e:
        logger.error(f"Failed to start server: {e}", exc_info=True)
        exit(1)


if __name__ == "__main__":
    main()
