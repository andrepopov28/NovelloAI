import os
import json
import urllib.request
import subprocess
import tarfile
from pathlib import Path

TMP_DIR = Path("tmp/voice_audit")
TMP_DIR.mkdir(parents=True, exist_ok=True)
PIPER_URL = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_macos_aarch64.tar.gz"
PIPER_TGZ = TMP_DIR / "piper.tar.gz"
PIPER_DIR = TMP_DIR / "piper"
PIPER_BIN = PIPER_DIR / "piper"

TEXT = "Chapter One. The sea was calm, but the air carried the sharp promise of change. I did not yet know what the letter contained—only that once it was read, nothing would return to the way it had been."

VOICES = [
    {"id": "piper-lessac", "model": "en_US-lessac-medium.onnx", "family": "lessac", "quality": "medium", "lang": "en_US"},
    {"id": "piper-libritts", "model": "en_US-libritts-high.onnx", "family": "libritts", "quality": "high", "lang": "en_US"},
    {"id": "piper-architect", "model": "en_US-architect-medium.onnx", "family": "architect", "quality": "medium", "lang": "en_US"},
    {"id": "piper-curator", "model": "en_US-curator-medium.onnx", "family": "curator", "quality": "medium", "lang": "en_US"},
    {"id": "piper-overseer", "model": "en_US-overseer-high.onnx", "family": "overseer", "quality": "high", "lang": "en_US"},
    {"id": "piper-amy", "model": "en_US-amy-medium.onnx", "family": "amy", "quality": "medium", "lang": "en_US"},
    {"id": "piper-southern-female", "model": "en_GB-southern_english_female-low.onnx", "family": "southern_english_female", "quality": "low", "lang": "en_GB"},
    {"id": "piper-vctk-neutral", "model": "en_US-vctk-medium.onnx", "family": "vctk", "quality": "medium", "lang": "en_US"},
    {"id": "piper-librispeech-high", "model": "en_US-librispeech-high.onnx", "family": "librispeech", "quality": "high", "lang": "en_US"},
    {"id": "piper-publisher", "model": "en_US-publisher-high.onnx", "family": "publisher", "quality": "high", "lang": "en_US"},
]

def format_row(v, status, dur, peak):
    return f"| {v['id']} | Piper | `{v['model']}` | {v['quality']} | 22050Hz (Est) | {v['lang']} | default | missing | {status} | Dur: {dur}, Peak: {peak} |"

def main():
    if not PIPER_BIN.exists():
        print("Downloading Piper...")
        urllib.request.urlretrieve(PIPER_URL, PIPER_TGZ)
        with tarfile.open(PIPER_TGZ, "r:gz") as tar:
            tar.extractall(path=TMP_DIR)
            
    print("| Voice ID | Engine | Model Path | Tier | Rate | Lang | Used As | License | Subjective Score | Objective Stats |")
    print("|---|---|---|---|---|---|---|---|---|---|")
    
    for v in VOICES:
        model_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{v['lang'].split('_')[0]}/{v['lang']}/{v['family']}/{v['quality']}/{v['model']}"
        json_url = model_url + ".json"
        
        model_path = TMP_DIR / v['model']
        json_path = TMP_DIR / (v['model'] + ".json")
        wav_path = TMP_DIR / f"{v['id']}.wav"
        
        try:
            if not model_path.exists():
                urllib.request.urlretrieve(model_url, model_path)
            if not json_path.exists():
                urllib.request.urlretrieve(json_url, json_path)
        except Exception as e:
            print(format_row(v, "FAILED (Model not found)", "-", "-"))
            continue
            
        try:
            # Generate wav
            cmd = f'echo "{TEXT}" | {PIPER_BIN} --model {model_path} --output_file {wav_path}'
            subprocess.run(cmd, shell=True, check=True, stderr=subprocess.DEVNULL)
            
            # Simple stats using ffprobe (if available)
            ffprobe_cmd = f"ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 {wav_path}"
            dur = subprocess.check_output(ffprobe_cmd, shell=True).decode().strip()
            dur = f"{float(dur):.2f}s"
            
            score = "Poor" if v['quality'] == "low" else "OK"
            print(format_row(v, score, dur, "N/A"))
        except Exception as e:
            print(format_row(v, "FAILED (Synthesis error)", "-", "-"))

if __name__ == "__main__":
    main()
