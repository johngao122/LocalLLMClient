from typing import Dict, Optional
import logging
from llama_cpp import Llama
from python.utils.errors import ModelError

logger = logging.getLogger(__name__)


class LLMModel:
    def __init__(
        self,
        model_path: str,
        n_ctx: int = 4096,
        n_threads: int = 4,
        n_gpu_layers: int = 0,
    ):
        """
        Initialization

        Args:
            model_path: Path to the GGUF model file
            n_ctx: Context window size
            n_threads: Number of CPU threads to use
            n_gpu_layers: Number of layers to offload to GPU

        """

        try:
            self.model = Llama(
                model_path=model_path,
                n_ctx=n_ctx,
                n_threads=n_threads,
                n_gpu_layers=-1,  # Change depending on hardware
                verbose=True,
            )
            logger.info(f"Loaded model {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {e}")
            raise ModelError(f"Failed to load model {model_path}: {e}")

    def generate(
        self,
        prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        top_p: float = 0.95,
        stop: Optional[list[str]] = None,
        stream: bool = False,
    ) -> Dict:
        """Text Generation

        Args:
            prompt: Input text
            max_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            stop: List of strings to stop generation at
            stream: Whether to stream the response

        Returns:
            Dictionary containing the generated text and metadata
        """

        try:
            response = self.model(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                stop=stop,
                stream=stream,
            )
            if stream:
                return response

            return {
                "text": response["choices"][0]["text"],
                "usage": {
                    "prompt_tokens": response["usage"]["prompt_tokens"],
                    "completion_tokens": response["usage"]["completion_tokens"],
                    "total_tokens": response["usage"]["total_tokens"],
                },
            }
        except Exception as e:
            logger.error(f"Failed to generate text: {e}")
            raise ModelError(f"Failed to generate text: {e}")

    def tokenize(self, text: str) -> list:
        """Tokenization

        Args:
            text: Input text to tokenize

        Returns:
            List of token IDs
        """

        try:
            return self.model.tokenize(text.encode())
        except Exception as e:
            logger.error(f"Failed to tokenize text: {e}")
            raise ModelError(f"Failed to tokenize text: {e}")
