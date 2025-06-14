"""
Factory for creating and managing voice journal clients.

This module provides a factory pattern implementation for managing
multiple voice journal API clients simultaneously.
"""

import asyncio
import logging
from typing import Dict, Optional, List, Any

from app.journal_client_base import JournalClientBase
from app.limitless_adapter import LimitlessAdapter
from app.bee_adapter import BeeAdapter

class JournalClientFactory:
    """Factory for creating and managing voice journal clients."""
    
    def __init__(self):
        """Initialize the journal client factory."""
        self.clients = {}
        self.polling_tasks = {}
        self.logger = logging.getLogger("JournalClientFactory")
    
    def create_client(self, client_type: str, api_key: str, poll_interval: int = 300) -> JournalClientBase:
        """
        Create a client of the specified type.
        
        Args:
            client_type: Type of client ('limitless' or 'bee')
            api_key: API key for the service
            poll_interval: Time in seconds between API polls
            
        Returns:
            Configured client instance
        
        Raises:
            ValueError: If client_type is not supported
        """
        if client_type == "limitless":
            client = LimitlessAdapter(api_key, poll_interval)
        elif client_type == "bee":
            client = BeeAdapter(api_key, poll_interval)
        else:
            raise ValueError(f"Unsupported client type: {client_type}")
        
        self.clients[client_type] = client
        return client
    
    def get_client(self, client_type: str) -> Optional[JournalClientBase]:
        """
        Get a client by type.
        
        Args:
            client_type: Type of client ('limitless' or 'bee')
            
        Returns:
            Client instance or None if not found
        """
        return self.clients.get(client_type)
    
    def get_all_clients(self) -> Dict[str, JournalClientBase]:
        """
        Get all active clients.
        
        Returns:
            Dictionary of client instances by type
        """
        return self.clients
    
    async def start_polling_for_client(self, client_type: str):
        """
        Start continuous polling for a specific client.
        
        Args:
            client_type: Type of client ('limitless' or 'bee')
            
        Raises:
            ValueError: If client of specified type is not found
        """
        client = self.get_client(client_type)
        if not client:
            raise ValueError(f"No client found for type: {client_type}")
        
        # Stop existing task if any
        await self.stop_polling_for_client(client_type)
        
        # Create a new polling task
        task = asyncio.create_task(client.run_continuous_polling())
        self.polling_tasks[client_type] = task
        self.logger.info(f"Started polling for {client_type} client")
    
    async def stop_polling_for_client(self, client_type: str):
        """
        Stop continuous polling for a specific client.
        
        Args:
            client_type: Type of client ('limitless' or 'bee')
        """
        task = self.polling_tasks.get(client_type)
        if task:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
            self.polling_tasks.pop(client_type)
            self.logger.info(f"Stopped polling for {client_type} client")
    
    async def start_all_polling(self):
        """Start continuous polling for all configured clients."""
        for client_type in self.clients:
            await self.start_polling_for_client(client_type)
    
    async def stop_all_polling(self):
        """Stop continuous polling for all clients."""
        client_types = list(self.polling_tasks.keys())
        for client_type in client_types:
            await self.stop_polling_for_client(client_type)
    
    def remove_client(self, client_type: str):
        """
        Remove a client by type.
        
        Args:
            client_type: Type of client ('limitless' or 'bee')
        """
        if client_type in self.clients:
            self.clients.pop(client_type)
            self.logger.info(f"Removed {client_type} client")
    
    async def get_recent_entries_from_all(self, limit: int = 20) -> Dict[str, List[Any]]:
        """
        Get recent entries from all clients.
        
        Args:
            limit: Maximum number of entries to return per client
            
        Returns:
            Dictionary of entries by client type
        """
        result = {}
        for client_type, client in self.clients.items():
            entries = await client.get_recent_entries(limit)
            result[client_type] = entries
        return result

# Create a singleton instance
journal_client_factory = JournalClientFactory()