#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Omi Necklace to Cognos Pipeline Bridge
--------------------------------------
This module provides a bridge between Omi necklace BLE audio streaming
and the Cognos audio processing pipeline.

Features:
- BLE device discovery and connection
- Real-time audio streaming from Omi necklace
- Audio buffering and preprocessing
- Integration with Cognos pipeline for VAD, diarization, and transcription
"""

import os
import sys
import asyncio
import json
import logging
import os
import sys
import struct
import time
from typing import Dict, List, Any, Optional, Tuple, Union
import numpy as np
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('omi_cognos_bridge')

# Mock BLE imports for development without actual hardware
# In production, uncomment the real imports and remove the mock classes
"""
import bleak
from bleak import BleakScanner, BleakClient
from bleak.backends.device import BLEDevice
"""

# Constants for Omi necklace (load from environment variables or use defaults)
OMI_SERVICE_UUID = os.environ.get("OMI_SERVICE_UUID", "0000180d-0000-1000-8000-00805f9b34fb")
OMI_AUDIO_CHAR_UUID = os.environ.get("OMI_AUDIO_CHAR_UUID", "00002a37-0000-1000-8000-00805f9b34fb")
OMI_CONTROL_CHAR_UUID = os.environ.get("OMI_CONTROL_CHAR_UUID", "00002a39-0000-1000-8000-00805f9b34fb")

# Audio processing parameters
SAMPLE_RATE = 16000  # Hz
CHANNELS = 1  # Mono audio
BIT_DEPTH = 16  # 16-bit PCM
FRAME_SIZE = 1024  # Audio frame size
BUFFER_SIZE = 10  # Number of frames to buffer before processing

# Import the Cognos pipeline
try:
    # Add parent directory to path for imports
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)
    
    from src.main_pipeline import process_audio
except ImportError as e:
    logger.error(f"Failed to import Cognos pipeline: {e}")
    raise


# Mock BLE classes for development without actual hardware
class MockBLEDevice:
    """Mock BLE device for testing without hardware"""
    
    def __init__(self, name: str = "Omi Necklace", address: str = "AA:BB:CC:DD:EE:FF"):
        self.name = name
        self.address = address
    
    def __str__(self):
        return f"{self.name} [{self.address}]"


class MockBleakClient:
    """Mock BleakClient for testing without hardware"""
    
    def __init__(self, device, **kwargs):
        self.device = device
        self.is_connected = False
        self.callbacks = {}
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()
    
    async def connect(self):
        logger.info(f"[MOCK] Connected to {self.device}")
        self.is_connected = True
        return True
    
    async def disconnect(self):
        logger.info(f"[MOCK] Disconnected from {self.device}")
        self.is_connected = False
    
    def is_connected(self):
        return self.is_connected
    
    async def start_notify(self, char_uuid, callback):
        logger.info(f"[MOCK] Started notification on {char_uuid}")
        self.callbacks[char_uuid] = callback
        # Start mock data generation
        asyncio.create_task(self._generate_mock_audio_data(char_uuid))
    
    async def stop_notify(self, char_uuid):
        logger.info(f"[MOCK] Stopped notification on {char_uuid}")
        if char_uuid in self.callbacks:
            del self.callbacks[char_uuid]
    
    async def write_gatt_char(self, char_uuid, data):
        logger.info(f"[MOCK] Write to {char_uuid}: {data.hex()}")
        return True
    
    async def _generate_mock_audio_data(self, char_uuid):
        """Generate mock audio data for testing"""
        if char_uuid != OMI_AUDIO_CHAR_UUID or not self.is_connected:
            return
        
        callback = self.callbacks.get(char_uuid)
        if not callback:
            return
        
        # Generate sine wave audio
        duration = 0.1  # 100ms chunks
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        
        # Continue sending mock audio until disconnected
        frame_count = 0
        while self.is_connected and char_uuid in self.callbacks:
            # Generate different frequencies to simulate speech
            freq = 440 + (frame_count % 10) * 50
            signal = 0.5 * np.sin(2 * np.pi * freq * t)
            
            # Convert to 16-bit PCM
            signal = signal * 32767
            signal = signal.astype(np.int16)
            
            # Pack into bytes
            audio_bytes = bytearray()
            for sample in signal:
                audio_bytes.extend(struct.pack('<h', sample))  # Little-endian 16-bit
            
            # Send to callback
            callback(OMI_AUDIO_CHAR_UUID, audio_bytes)
            
            # Simulate BLE latency
            await asyncio.sleep(0.1)
            frame_count += 1


class OmiBridge:
    """
    Bridge between Omi necklace and Cognos pipeline.
    Handles BLE device discovery, connection, and audio streaming.
    """
    
    def __init__(self):
        self.device = None
        self.client = None
        self.is_recording = False
        self.audio_buffer = []
        self.buffer_count = 0
        self.recording_start_time = None
        self.last_processing_time = None
        
        # Audio processing parameters
        self.vad_enabled = True
        self.diarization_enabled = True
        self.transcription_enabled = True
    
    async def discover_devices(self, name_filter: Optional[str] = "Omi") -> List[Any]:
        """
        Discover available BLE devices that match the name filter
        
        Args:
            name_filter: Optional filter for device names
            
        Returns:
            List of discovered devices
        """
        logger.info(f"Scanning for BLE devices with name filter: {name_filter}")
        
        # For mock implementation
        devices = [MockBLEDevice()]
        
        # For real implementation with bleak
        """
        devices = await BleakScanner.discover()
        if name_filter:
            devices = [d for d in devices if d.name and name_filter.lower() in d.name.lower()]
        """
        
        logger.info(f"Found {len(devices)} devices: {[str(d) for d in devices]}")
        return devices
    
    async def connect(self, device_id: Optional[str] = None) -> bool:
        """
        Connect to an Omi necklace device
        
        Args:
            device_id: Optional device ID (address) to connect to
                       If not provided, will connect to first discovered device
                       
        Returns:
            True if connected successfully, False otherwise
        """
        # Disconnect if already connected
        if self.client and self.client.is_connected:
            await self.disconnect()
        
        # Discover devices if no device is specified
        if not device_id:
            devices = await self.discover_devices()
            if not devices:
                logger.error("No devices found")
                return False
            self.device = devices[0]
        else:
            # For mock implementation
            self.device = MockBLEDevice(address=device_id)
            
            # For real implementation with bleak
            """
            devices = await BleakScanner.discover()
            for d in devices:
                if d.address.lower() == device_id.lower():
                    self.device = d
                    break
            """
            if not self.device:
                logger.error(f"Device with ID {device_id} not found")
                return False
        
        logger.info(f"Connecting to {self.device}")
        
        try:
            # For mock implementation
            self.client = MockBleakClient(self.device)
            
            # For real implementation with bleak
            """
            self.client = BleakClient(self.device)
            """
            
            await self.client.connect()
            logger.info(f"Connected to {self.device}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from the device"""
        if not self.client:
            return True
        
        try:
            # Stop recording if active
            if self.is_recording:
                await self.stop_recording()
            
            # Disconnect
            await self.client.disconnect()
            logger.info(f"Disconnected from {self.device}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to disconnect: {e}")
            return False
    
    async def start_recording(self, duration_seconds: Optional[int] = None) -> bool:
        """
        Start recording audio from the Omi necklace
        
        Args:
            duration_seconds: Optional recording duration in seconds
                             If not provided, will record until stop_recording is called
        
        Returns:
            True if recording started successfully, False otherwise
        """
        if not self.client or not self.client.is_connected:
            logger.error("Not connected to any device")
            return False
        
        if self.is_recording:
            logger.warning("Already recording")
            return True
        
        try:
            # Reset buffer
            self.audio_buffer = []
            self.buffer_count = 0
            self.recording_start_time = time.time()
            
            # Start audio notifications
            await self.client.start_notify(
                OMI_AUDIO_CHAR_UUID,
                self._audio_data_handler
            )
            
            self.is_recording = True
            logger.info(f"Started recording from {self.device}")
            
            # Set up duration-based recording if specified
            if duration_seconds:
                logger.info(f"Will record for {duration_seconds} seconds")
                asyncio.create_task(self._auto_stop_recording(duration_seconds))
            
            # Enable continuous processing
            asyncio.create_task(self._continuous_processing())
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            return False
    
    async def stop_recording(self) -> bool:
        """Stop recording audio"""
        if not self.client or not self.is_recording:
            return True
        
        try:
            # Stop audio notifications
            await self.client.stop_notify(OMI_AUDIO_CHAR_UUID)
            self.is_recording = False
            
            recording_duration = time.time() - self.recording_start_time
            logger.info(f"Stopped recording after {recording_duration:.2f} seconds")
            
            # Process any remaining audio in buffer
            if self.audio_buffer:
                await self._process_audio_buffer()
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")
            return False
    
    def _audio_data_handler(self, sender, data):
        """Handle incoming audio data from the Omi necklace"""
        if not self.is_recording:
            return
        
        # Add data to buffer
        self.audio_buffer.append(data)
        self.buffer_count += 1
        
        # Log buffer status periodically
        if self.buffer_count % 10 == 0:
            buffer_duration = len(self.audio_buffer) * FRAME_SIZE / SAMPLE_RATE
            logger.debug(f"Audio buffer: {len(self.audio_buffer)} frames, {buffer_duration:.2f}s")
    
    async def _auto_stop_recording(self, duration_seconds: int):
        """Automatically stop recording after the specified duration"""
        await asyncio.sleep(duration_seconds)
        if self.is_recording:
            logger.info(f"Auto-stopping recording after {duration_seconds} seconds")
            await self.stop_recording()
    
    async def _continuous_processing(self):
        """Continuously process audio from the buffer while recording"""
        MIN_PROCESSING_INTERVAL = 5  # seconds
        
        while self.is_recording:
            current_time = time.time()
            
            # Process if we have enough data and haven't processed recently
            if len(self.audio_buffer) >= BUFFER_SIZE and (
                self.last_processing_time is None or 
                current_time - self.last_processing_time >= MIN_PROCESSING_INTERVAL
            ):
                logger.info("Starting continuous processing of audio buffer")
                await self._process_audio_buffer()
                self.last_processing_time = time.time()
            
            # Small delay to prevent CPU hogging
            await asyncio.sleep(0.5)
    
    async def _process_audio_buffer(self) -> Dict[str, Any]:
        """
        Process the current audio buffer through the Cognos pipeline
        
        Returns:
            Dictionary with processing results
        """
        if not self.audio_buffer:
            logger.warning("No audio data to process")
            return {"error": "No audio data to process"}
        
        try:
            # Convert buffer to numpy array
            audio_data = bytearray()
            for frame in self.audio_buffer:
                audio_data.extend(frame)
            
            # Clear buffer after copying
            buffer_copy = self.audio_buffer.copy()
            self.audio_buffer = []
            
            # Save to temporary WAV file for processing
            temp_file = os.path.join(os.path.dirname(__file__), "..", "temp_recording.wav")
            self._save_audio_to_wav(audio_data, temp_file)
            
            logger.info(f"Processing {len(buffer_copy)} frames of audio data")
            
            # Process using Cognos pipeline
            result = await process_audio(
                audio_file_path=temp_file,
                enable_vad=self.vad_enabled,
                enable_diarization=self.diarization_enabled,
                enable_transcription=self.transcription_enabled
            )
            
            # Add device-specific metadata
            if not isinstance(result, dict):
                result = {}
                
            result["device_info"] = {
                "device_name": self.device.name if self.device else "Unknown",
                "device_id": self.device.address if self.device else "Unknown",
                "recording_duration": time.time() - self.recording_start_time if self.recording_start_time else 0
            }
            
            logger.info(f"Processing completed: {json.dumps(result, indent=2)}")
            return result
        
        except Exception as e:
            logger.exception(f"Error processing audio: {e}")
            return {
                "error": str(e),
                "device_info": {
                    "device_name": self.device.name if self.device else "Unknown",
                    "device_id": self.device.address if self.device else "Unknown"
                }
            }
    
    def _save_audio_to_wav(self, audio_data: bytearray, filename: str) -> None:
        """Save audio data to a WAV file"""
        import wave
        
        try:
            with wave.open(filename, 'wb') as wav_file:
                wav_file.setnchannels(CHANNELS)
                wav_file.setsampwidth(BIT_DEPTH // 8)
                wav_file.setframerate(SAMPLE_RATE)
                wav_file.writeframes(audio_data)
            
            logger.info(f"Saved audio to {filename}")
        
        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            raise
    
    def set_processing_options(
        self,
        vad_enabled: bool = True,
        diarization_enabled: bool = True,
        transcription_enabled: bool = True
    ) -> None:
        """
        Set audio processing options
        
        Args:
            vad_enabled: Enable Voice Activity Detection
            diarization_enabled: Enable speaker diarization
            transcription_enabled: Enable transcription
        """
        self.vad_enabled = vad_enabled
        self.diarization_enabled = diarization_enabled
        self.transcription_enabled = transcription_enabled
        
        logger.info(f"Processing options set: VAD={vad_enabled}, Diarization={diarization_enabled}, Transcription={transcription_enabled}")

# Wrapper function for MCP server integration
async def stream_and_process_audio(
    device_id: Optional[str] = None,
    duration_seconds: int = 10,
    enable_vad: bool = True,
    enable_diarization: bool = True,
    enable_transcription: bool = True
) -> Dict[str, Any]:
    """
    Stream and process audio from an Omi device - this is the main entry point
    for the MCP server integration.
    
    Args:
        device_id: Optional device ID to connect to
        duration_seconds: Recording duration in seconds
        enable_vad: Enable Voice Activity Detection
        enable_diarization: Enable speaker diarization
        enable_transcription: Enable transcription
    
    Returns:
        Dictionary with processing results
    """
    logger.info(f"Starting Omi streaming with device_id={device_id}, duration={duration_seconds}s")
    
    # Create bridge instance
    bridge = OmiBridge()
    result = {}
    
    try:
        # Set processing options
        bridge.set_processing_options(
            vad_enabled=enable_vad,
            diarization_enabled=enable_diarization,
            transcription_enabled=enable_transcription
        )
        
        # Connect to device
        connected = await bridge.connect(device_id)
        if not connected:
            return {"error": f"Failed to connect to Omi device {device_id or 'any'}",
                    "device_id": device_id or "unknown",
                    "status": "connection_failed"}
        
        # Start recording
        logger.info(f"Recording for {duration_seconds} seconds...")
        started = await bridge.start_recording(duration_seconds)
        if not started:
            await bridge.disconnect()
            return {"error": "Failed to start recording",
                    "device_id": device_id or "unknown",
                    "status": "recording_failed"}
        
        # Wait for recording to complete
        await asyncio.sleep(duration_seconds + 2)  # Add buffer time for processing
        
        # Stop recording explicitly to process any remaining audio
        await bridge.stop_recording()
        
        # Get the result (this will also process the buffer)
        if bridge.last_processing_time is not None:
            # We already processed some audio, return the last result
            result = await bridge._process_audio_buffer()
        
        # Disconnect
        await bridge.disconnect()
        
        # Update status
        if not result.get("error"):
            result["status"] = "success"
            result["device_id"] = device_id or result.get("device_info", {}).get("device_id", "unknown")
        
        # Return the result
        return result
        
    except Exception as e:
        logger.exception(f"Error in stream_and_process_audio: {e}")
        return {
            "error": str(e),
            "device_id": device_id or "unknown",
            "status": "error",
            "error_details": str(e)
        }
    finally:
        # Make sure we disconnect
        if bridge.client and bridge.client.is_connected:
            try:
                await bridge.disconnect()
            except Exception:
                pass

async def main():
    """Main function for testing the Omi bridge"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Omi to Cognos Bridge')
    parser.add_argument('--device', type=str, help='Device ID to connect to')
    parser.add_argument('--duration', type=int, default=10, help='Recording duration in seconds')
    parser.add_argument('--no-vad', action='store_true', help='Disable VAD')
    parser.add_argument('--no-diarization', action='store_true', help='Disable diarization')
    parser.add_argument('--no-transcription', action='store_true', help='Disable transcription')
    parser.add_argument('--test-mcp', action='store_true', help='Test MCP server integration')
    args = parser.parse_args()
    
    if args.test_mcp:
        # Test the MCP server integration wrapper
        result = asyncio.run(stream_and_process_audio(
            device_id=args.device,
            duration_seconds=args.duration,
            enable_vad=not args.no_vad,
            enable_diarization=not args.no_diarization,
            enable_transcription=not args.no_transcription
        ))
        print(json.dumps(result, indent=2))
    else:
        # Create and initialize bridge directly
        bridge = OmiBridge()
        
        try:
            # Set processing options
            bridge.set_processing_options(
                vad_enabled=not args.no_vad,
                diarization_enabled=not args.no_diarization,
                transcription_enabled=not args.no_transcription
            )
            
            # Connect to device
            connected = asyncio.run(bridge.connect(args.device))
            if not connected:
                logger.error("Failed to connect to device")
                sys.exit(1)
            
            # Start recording
            logger.info(f"Recording for {args.duration} seconds...")
            started = asyncio.run(bridge.start_recording(args.duration))
            if not started:
                logger.error("Failed to start recording")
                asyncio.run(bridge.disconnect())
                sys.exit(1)
            
            # Wait for recording to complete
            asyncio.run(asyncio.sleep(args.duration + 2))  # Add buffer time for processing
            
            # Disconnect
            asyncio.run(bridge.disconnect())
            
        except KeyboardInterrupt:
            logger.info("Recording interrupted")
            asyncio.run(bridge.stop_recording())
            asyncio.run(bridge.disconnect())
            
        except Exception as e:
            logger.exception(f"Error: {e}")
            try:
                asyncio.run(bridge.disconnect())
            except:
                pass

# Direct execution for testing
if __name__ == "__main__":
    asyncio.run(main())
