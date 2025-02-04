import os
import logging
from flask import Flask
from flask_cors import CORS
from api.routes import api, init_model
from utils.errors import ConfigError


logging.basicConfig(
    level=logging.INFO,
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
        model_path = os.environ.get("LLM_MODEL_PATH")
        if not model_path:
            raise ConfigError("LLM_MODEL_PATH is not set")
        port = int(os.environ.get("PORT", 5000))
        host = os.environ.get("HOST", "127.0.0.1")

        init_model(
            model_path=model_path,
            n_ctx=int(os.environ.get("LLM_CONTEXT_LENGTH", "2048")),
            n_threads=int(os.environ.get("LLM_THREADS", "4")),
        )

        app = create_app()
        logger.info(f"Starting server on {host}:{port}")
        app.run(host=host, port=port)

    except ConfigError as e:
        logger.error(f"Failed to start server: {e}")
        exit(1)

    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        exit(1)


if __name__ == "__main__":
    main()
