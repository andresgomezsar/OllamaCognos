#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Create test audio file for the Cognos pipeline integration tests.
Generates a simple test tone that can be used for testing the audio processing pipeline.
"""

import os
import numpy as np
import wave
import struct


def create_test_tone(
    filename="test_tone.wav",
    duration_seconds=5,
    sample_rate=16000,
    frequencies=[440, 880],
    volumes=[0.5, 0.3]
):
    """
    Create a test tone with the given parameters
    
    Args:
        filename: Output filename
        duration_seconds: Duration of the audio in seconds
        sample_rate: Sample rate in Hz
        frequencies: List of frequencies in Hz
        volumes: List of volumes for each frequency (0.0-1.0)
    """
    t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds), False)
    
    # Generate signal with multiple frequencies
    signal = np.zeros_like(t)
    for freq, vol in zip(frequencies, volumes):
        signal += vol * np.sin(2 * np.pi * freq * t)
    
    # Normalize to -1.0 to 1.0
    signal = signal / np.max(np.abs(signal))
    
    # Convert to 16-bit PCM
    signal = signal * 32767
    signal = signal.astype(np.int16)
    
    # Write to WAV file
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for sample in signal:
            wav_file.writeframes(struct.pack('h', sample))
    
    print(f"Created test audio file: {filename}")
    print(f"  Duration: {duration_seconds} seconds")
    print(f"  Sample rate: {sample_rate} Hz")
    print(f"  Frequencies: {frequencies} Hz")
    
    return os.path.abspath(filename)


if __name__ == "__main__":
    # Create test tone in the test_audio directory
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_audio")
    os.makedirs(output_dir, exist_ok=True)
    
    # Create a simple test tone
    output_path = os.path.join(output_dir, "test_tone.wav")
    create_test_tone(
        filename=output_path,
        duration_seconds=5,
        frequencies=[440, 880, 1320],
        volumes=[0.6, 0.3, 0.1]
    )
    
    # Create a speech-like test file (more complex frequencies)
    speech_path = os.path.join(output_dir, "test_speech.wav")
    create_test_tone(
        filename=speech_path,
        duration_seconds=10,
        frequencies=[85, 170, 340, 680],
        volumes=[0.4, 0.3, 0.2, 0.1]
    )
    
    print("\nTest audio files created successfully!")
    print("You can use these files for integration testing with the Cognos pipeline.")
