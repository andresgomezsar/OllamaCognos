"""
Base abstract class for voice journal clients.

This module defines a common interface for different voice journal API providers,
allowing the application to support multiple services with a consistent API.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import asyncio
import logging
import pytz

# Define PST timezone for consistent timestamps
PST = pytz.timezone('America/Los_Angeles')

class JournalClientBase(ABC):
    """Abstract base class for voice journal client implementations."""
    
    def __init__(self, api_key: str, poll_interval: int = 300):
        """
        Initialize the journal client.
        
        Args:
            api_key: API key for the service
            poll_interval: Time in seconds between API polls (default: 300)
        """
        self.api_key = api_key
        self.poll_interval = poll_interval
        self.last_poll_time = None
        self.processed_entry_ids = set()
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    async def get_recent_entries(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent journal entries from the service.
        
        Args:
            limit: Maximum number of entries to return
            
        Returns:
            List of journal entries
        """
        pass
    
    @abstractmethod
    async def get_entries_since(self, since_time: datetime, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get entries created since a specific time.
        
        Args:
            since_time: Only get entries created after this time
            limit: Maximum number of entries to return
            
        Returns:
            List of journal entries
        """
        pass
    
    @abstractmethod
    async def extract_text_content(self, entry: Dict[str, Any]) -> str:
        """
        Extract plain text content from a journal entry.
        
        Args:
            entry: A journal entry dictionary from the service
            
        Returns:
            Plain text content
        """
        pass
    
    @abstractmethod
    async def extract_markdown_content(self, entry: Dict[str, Any]) -> Optional[str]:
        """
        Extract markdown content from a journal entry if available.
        
        Args:
            entry: A journal entry dictionary from the service
            
        Returns:
            Markdown content or None if not available
        """
        pass
    
    @abstractmethod
    async def extract_title(self, entry: Dict[str, Any]) -> str:
        """
        Extract title from a journal entry.
        
        Args:
            entry: A journal entry dictionary from the service
            
        Returns:
            Title string
        """
        pass
    
    @abstractmethod
    async def extract_timestamp(self, entry: Dict[str, Any]) -> datetime:
        """
        Extract creation timestamp from a journal entry.
        
        Args:
            entry: A journal entry dictionary from the service
            
        Returns:
            Datetime object
        """
        pass
    
    @abstractmethod
    async def extract_unique_id(self, entry: Dict[str, Any]) -> str:
        """
        Extract unique ID from a journal entry.
        
        Args:
            entry: A journal entry dictionary from the service
            
        Returns:
            Unique ID string
        """
        pass
    
    @abstractmethod
    async def save_entry_to_db(self, entry: Dict[str, Any]) -> Any:
        """
        Process a journal entry and save it to the database.
        
        Args:
            entry: Journal entry to process
            
        Returns:
            The created database record
        """
        pass
    
    @abstractmethod
    def is_already_processed(self, entry_id: str) -> bool:
        """
        Check if a journal entry has already been processed.
        
        Args:
            entry_id: The unique ID of the entry
            
        Returns:
            True if already processed, False otherwise
        """
        pass
    
    async def poll_for_new_entries(self):
        """
        Poll for new journal entries and process any that haven't been seen before.
        """
        now = datetime.now(PST)
        
        # First run behavior - just collect IDs without processing
        if self.last_poll_time is None:
            # Get recent entries to process and save them
            entries = await self.get_recent_entries(limit=20)
            self.logger.info(f"Found {len(entries)} recent journal entries")
            
            # Process and save all entries on first run
            for entry in entries:
                entry_id = await self.extract_unique_id(entry)
                if not self.is_already_processed(entry_id):
                    self.logger.info(f"Processing entry: {await self.extract_title(entry)}")
                    await self.save_entry_to_db(entry)
                else:
                    self.processed_entry_ids.add(entry_id)
        else:
            # Get entries since last poll with a buffer to avoid missing any
            # Ensure buffer_time has timezone info
            buffer_time = self.last_poll_time - timedelta(seconds=5)
            if buffer_time.tzinfo is None:
                buffer_time = buffer_time.replace(tzinfo=PST)
                
            entries = await self.get_entries_since(buffer_time)
            
            # Process and save new entries
            for entry in entries:
                entry_id = await self.extract_unique_id(entry)
                if not self.is_already_processed(entry_id):
                    await self.save_entry_to_db(entry)
        
        self.last_poll_time = now
    
    async def run_continuous_polling(self):
        """
        Run continuous polling loop at the specified interval.
        This should be the main entry point for automated polling.
        """
        try:
            while True:
                self.logger.info("Polling for new journal entries...")
                await self.poll_for_new_entries()
                await asyncio.sleep(self.poll_interval)
        except Exception as e:
            self.logger.error(f"Error in polling loop: {str(e)}")
            raise