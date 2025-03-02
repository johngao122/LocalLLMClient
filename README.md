# Local LLM Desktop Client(I dont have a name for it yet)

A cross-platform desktop application that runs LLaMA models locally on your machine, providing a clean chat interface for interacting with the model without requiring internet connectivity.

## Features

-   Run DeepSeek LLaMA models locally on your CPU or GPU
-   Clean, modern chat interface built with React
-   Real-time server status monitoring
-   Support for both CPU and GPU inference
-   Cross-platform support (Windows and macOS)
-   Adjustable model parameters (temperature, max tokens, etc.)
-   Health monitoring and automatic reconnection
-   Powered by Rust

## Prerequisites

-   Python 3.8 or higher
-   Node.js 16.0 or higher
-   Rust toolchain (for Tauri)
-   System dependencies for Tauri:
    -   Windows: Microsoft Visual Studio C++ Build Tools
    -   macOS: Xcode Command Line Tools (`xcode-select --install`)
-   At least 8GB RAM (16GB recommended)
-   For GPU acceleration: CUDA-capable GPU with at least 6GB VRAM (`Please consult the model specifications online`)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/local-llm-client
cd local-llm-client
```

2. Create and activate a Python virtual environment:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Install Node.js dependencies:

```bash
npm install
```

5. Download the DeepSeek model:
   Download a `.gguf` model from online(I suggest huggingface.co) and insert into the `models` folder in `/backend`

## Configuration Guide

### Using Environment Variables

The application can be configured via environment variables either through a `.env` file or system environment variables.

#### On Windows:

1. Press Win + R, type `systempropertiesadvanced` and press Enter
2. Click "Environment Variables" at the bottom
3. Under "User variables", click "New" and add each variable:

```
Variable: MODEL_NAME
Value: DeepSeek-R1-Distill-Qwen

Variable: PORT
Value: 5000

Variable: HOST
Value: 127.0.0.1

Variable: LLM_CONTEXT_LENGTH
Value: 2048

Variable: LLM_THREADS
Value: 4
```

#### On macOS:

1. Open Terminal
2. Edit your shell profile:

```bash
nano ~/.zshrc  # or ~/.bash_profile for Bash
```

3. Add the following lines(You can directly run these in the shell too):

```bash
export MODEL_NAME=DeepSeek-R1-Distill-Qwen
export PORT=5000
export HOST=127.0.0.1
export LLM_CONTEXT_LENGTH=2048
export LLM_THREADS=4
```

4. Save and reload:

```bash
source ~/.zshrc  # or ~/.bash_profile for Bash
```

### Configuration Variables Explained

| Variable           | Description                                      | Example                  |
| ------------------ | ------------------------------------------------ | ------------------------ |
| MODEL_NAME         | Name of the model file (without .gguf extension) | DeepSeek-R1-Distill-Qwen |
| PORT               | Flask server port                                | 5000                     |
| HOST               | Server host address                              | 127.0.0.1                |
| LLM_CONTEXT_LENGTH | Context window size in tokens                    | 2048                     |
| LLM_THREADS        | Number of CPU threads                            | 4                        |

## Running the Application

1. Start the Flask backend server:

```bash
# Windows
python main.py

# macOS/Linux
python3 main.py
```

2. In a separate terminal, start the frontend development server:

```bash
npm run tauri dev
```

3. The application will be built and launched.

## GPU Acceleration

The application now automatically detects and uses the appropriate GPU acceleration:

-   **On macOS**: Metal is automatically detected and used for GPU acceleration on Apple Silicon and compatible Intel Macs.
-   **On Windows/Linux**: CUDA is automatically detected and used if an NVIDIA GPU is present.

You can control GPU acceleration with the following environment variables:

| Variable    | Description                                    | Default                |
| ----------- | ---------------------------------------------- | ---------------------- |
| LLAMA_METAL | Enable Metal acceleration on macOS             | 1 (on Mac)             |
| LLAMA_CUDA  | Enable CUDA acceleration for NVIDIA GPUs       | 1 (if NVIDIA detected) |
| USE_CUDA    | Whether to attempt using CUDA on Windows/Linux | 1                      |

The application will automatically fall back to CPU if no compatible GPU is detected.

## Building for Desktop

The application is built using Tauri, which provides a lightweight and secure desktop wrapper:

1. Install Rust and system dependencies:

```bash
# Windows
winget install Rust

# macOS
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

2. Build the application:

```bash
# Build for development
cargo tauri dev

# Build for production
cargo tauri build
```

(I will package it as a native application in releases in the future!)

The packaged application will be available in the `src-tauri/target/release/bundle` directory.

Note: Tauri provides significantly smaller bundle sizes and better performance compared to Electron-based alternatives.

## Project Roadmap

The following features are currently under development:

-   [x] Basic chat interface
-   [x] Local LLM integration
-   [x] Cross-platform desktop app
-   [x] Unified run script
-   [x] Enhanced chat message formatting with LaTeX support(kinda)
-   [x] Chain of thought reasoning visualization
-   [x] Code syntax highlighting in messages
-   [ ] Model fine tuning(right now if it has too much time to think, response will be empty)
-   [ ] Support for multiple concurrent chat sessions
-   [ ] Additional chat features and improvements
-   [ ] Support for multiple models

## LaTeX Support

The chat interface supports rendering of LaTeX mathematical expressions:

-   Use `$...$` for inline math expressions (e.g., $E = mc^2$)
-   Use `$$...$$` for block/display math expressions:

```
$$
P = \begin{pmatrix}
0.7 & 0.3 \\
0.4 & 0.6
\end{pmatrix}
$$
```

The application supports common LaTeX commands and environments, including:

-   Mathematical symbols and operators
-   Matrices and arrays
-   Fractions, integrals, and summations
-   Greek letters and special symbols
-   Aligned equations and multi-line expressions

## Troubleshooting

Common issues and their solutions:

1. **Model Loading Errors**:

    - Ensure the model file exists in the `models` directory
    - Verify you have sufficient RAM available
    - Check the model file isn't corrupted

2. **Server Connection Issues**:

    - Verify the Flask server is running
    - Check if the port is already in use
    - Ensure firewall settings allow local connections

3. **Performance Issues**:
    - Adjust `LLM_THREADS` based on your CPU
    - Modify `n_gpu_layers` based on available VRAM
    - Reduce `LLM_CONTEXT_LENGTH` if experiencing memory issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
