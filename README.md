# Local LLM Desktop Client(I dont have a name for it yet)

A cross-platform desktop application that runs LLaMA models locally on your machine, providing a clean chat interface for interacting with the model without requiring internet connectivity.

## Features

- Run DeepSeek LLaMA models locally on your CPU or GPU
- Clean, modern chat interface built with React
- Real-time server status monitoring
- Support for both CPU and GPU inference
- Cross-platform support (Windows and macOS)
- Adjustable model parameters (temperature, max tokens, etc.)
- Health monitoring and automatic reconnection
- Powered by Rust

## Prerequisites

- Python 3.8 or higher
- Node.js 16.0 or higher
- Rust toolchain (for Tauri)
- System dependencies for Tauri:
  - Windows: Microsoft Visual Studio C++ Build Tools
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
- At least 8GB RAM (16GB recommended)
- For GPU acceleration: CUDA-capable GPU with at least 6GB VRAM (`Please consult the model specifications online`)

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

| Variable | Description | Example |
|----------|-------------|---------|
| MODEL_NAME | Name of the model file (without .gguf extension) | DeepSeek-R1-Distill-Qwen |
| PORT | Flask server port | 5000 |
| HOST | Server host address | 127.0.0.1 |
| LLM_CONTEXT_LENGTH | Context window size in tokens | 2048 |
| LLM_THREADS | Number of CPU threads | 4 |

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

To enable GPU acceleration, modify the `n_gpu_layers` parameter in `model.py`. The default value is -1, which offloads all possible layers to the GPU. Adjust this value based on your GPU's VRAM capacity.

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

- [x] Basic chat interface
- [x] Local LLM integration
- [x] Cross-platform desktop app
- [ ] Unified run script
- [ ] Enhanced chat message formatting
- [ ] Chain of thought reasoning visualization
- [ ] Code syntax highlighting in messages
- [ ] Support for multiple concurrent chat sessions
- [ ] Additional chat features and improvements

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

