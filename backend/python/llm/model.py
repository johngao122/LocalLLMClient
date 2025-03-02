from typing import Dict, Optional
import logging
import platform
import os
import subprocess
import time
import threading
from llama_cpp import Generator, Llama
from python.utils.errors import ModelError

logger = logging.getLogger(__name__)


def detect_gpu():
    """
    Detect GPU type and availability

    Returns:
        dict: Information about GPU type and availability
    """
    system = platform.system()
    gpu_info = {
        "system": system,
        "has_metal": False,
        "has_nvidia": False,
        "gpu_name": None,
    }

    # Check for Mac (Metal)
    if system == "Darwin":
        # Check if Metal is available
        try:
            # On macOS, we can check for Metal-compatible GPUs
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True,
                text=True,
            )
            output = result.stdout

            # Metal is available on most modern Macs
            if "Metal" in output:
                gpu_info["has_metal"] = True

            # Extract GPU name
            for line in output.split("\n"):
                if "Chipset Model" in line:
                    gpu_info["gpu_name"] = line.split(":")[1].strip()
                    break

            logger.info(f"Detected Mac with GPU: {gpu_info['gpu_name']}")
        except Exception as e:
            logger.warning(f"Failed to detect Metal GPU: {e}")

    # Check for NVIDIA GPU on Windows/Linux
    elif system in ["Windows", "Linux"]:
        try:
            # Try to detect NVIDIA GPU using nvidia-smi
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                capture_output=True,
                text=True,
            )

            if result.returncode == 0 and result.stdout.strip():
                gpu_info["has_nvidia"] = True
                gpu_info["gpu_name"] = result.stdout.strip()
                logger.info(f"Detected NVIDIA GPU: {gpu_info['gpu_name']}")
        except Exception as e:
            logger.warning(f"No NVIDIA GPU detected or nvidia-smi not available: {e}")

    return gpu_info


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
        # Detect GPU and set appropriate parameters
        gpu_info = detect_gpu()
        use_gpu = False
        gpu_params = {}

        # Configure for Metal on Mac
        if gpu_info["has_metal"]:
            logger.info("Using Metal for GPU acceleration")
            use_gpu = True
            gpu_params = {"n_gpu_layers": -1, "use_metal": True}  # Use all layers
        # Configure for NVIDIA GPU
        elif gpu_info["has_nvidia"]:
            logger.info("Using CUDA for GPU acceleration")
            use_gpu = True
            gpu_params = {"n_gpu_layers": -1, "use_cuda": True}  # Use all layers
        else:
            logger.info("No compatible GPU detected, using CPU only")
            gpu_params = {"n_gpu_layers": 0}

        try:
            # Initialize model with appropriate GPU parameters
            self.model = Llama(
                model_path=model_path,
                n_ctx=n_ctx,
                n_threads=n_threads,
                verbose=True,
                **gpu_params,
            )

            if use_gpu:
                logger.info(f"Loaded model {model_path} with GPU acceleration")
            else:
                logger.info(f"Loaded model {model_path} on CPU")

        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {e}")
            raise ModelError(f"Failed to load model {model_path}: {e}")

    def generate(
        self,
        prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.3,
        top_p: float = 0.95,
        stop: Optional[list[str]] = None,
        stream: bool = False,
        timeout: int = 120,  # Default timeout of 120 seconds
    ) -> Generator[Dict, None, None]:
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
                # For streaming, yield each chunk as it comes
                last_chunk = None
                start_time = time.time()
                last_token_time = start_time

                for chunk in response:
                    # Check for timeout between tokens
                    current_time = time.time()
                    if current_time - start_time > timeout:
                        logger.warning(f"Generation timed out after {timeout} seconds")
                        yield {
                            "choices": [
                                {
                                    "text": "\n\n[Generation timed out. The model took too long to respond.]",
                                    "finish_reason": "timeout",
                                }
                            ]
                        }
                        return

                    # Reset token timer when we get a new token
                    last_token_time = current_time

                    # Store the last chunk to check if we got a proper finish_reason
                    last_chunk = chunk
                    yield {
                        "choices": [
                            {
                                "text": chunk["choices"][0]["text"],
                                "finish_reason": chunk["choices"][0].get(
                                    "finish_reason"
                                ),
                            }
                        ]
                    }

                # If the last chunk didn't have a finish_reason, add a final chunk with a finish_reason
                if last_chunk and not last_chunk["choices"][0].get("finish_reason"):
                    yield {
                        "choices": [
                            {
                                "text": "",  # Empty text to avoid duplicating content
                                "finish_reason": "length",  # Assume we hit the length limit
                            }
                        ]
                    }
                return

            # For non-streaming, return the complete response
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
            # If we're streaming, yield a final error chunk so the client knows generation stopped
            if stream:
                yield {
                    "choices": [
                        {
                            "text": f"\n\n[Error during generation: {str(e)}]",
                            "finish_reason": "error",
                        }
                    ]
                }
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
