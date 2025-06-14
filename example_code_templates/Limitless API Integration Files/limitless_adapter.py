"""
Limitless AI adapter for the voice journal client interface.

This module implements the JournalClientBase interface for the Limitless AI service.
"""

import asyncio
import httpx
import json
import logging
import pytz
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from flask import current_app
from sqlalchemy import desc

from app import db
from app.models import JournalEntry, LimitlessEntry
from app.journal_client_base import JournalClientBase, PST
from app.sentiment_analyzer import analyze_journal_entry

class LimitlessAdapter(JournalClientBase):
    """Adapter for the Limitless Pendant API."""
    
    def __init__(self, api_key: str, poll_interval: int = 300):
        """
        Initialize the Limitless adapter.
        
        Args:
            api_key: Your Limitless API key
            poll_interval: Time in seconds between API polls (default: 300)
        """
        super().__init__(api_key, poll_interval)
        self.base_url = "https://api.limitless.ai/v1"
    
    async def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make an authenticated request to the Limitless API.
        
        Args:
            endpoint: API endpoint path
            params: Optional query parameters
            
        Returns:
            JSON response as dictionary
        """
        async with httpx.AsyncClient() as client:
            headers = {
                "X-API-Key": self.api_key,
                "Content-Type": "application/json"
            }
            try:
                response = await client.get(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                self.logger.error(f"API request error: {str(e)}")
                return {"data": {"lifelogs": []}, "meta": {}}
    
    async def get_recent_entries(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent journal entries from Limitless.
        
        Args:
            limit: Maximum number of entries to return
            
        Returns:
            List of journal entries
        """
        params = {
            "limit": limit, 
            "direction": "desc",
            "includeMarkdown": "true",
            "includeHeadings": "true",
            "timezone": "America/Los_Angeles"  # Use PST timezone for consistency
        }
        response = await self._make_request("/lifelogs", params=params)
        
        if "data" in response and "lifelogs" in response["data"]:
            return response["data"]["lifelogs"]
        return []
    
    async def get_entries_since(self, since_time: datetime, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get Limitless entries created since a specific time.
        
        Args:
            since_time: Only get entries created after this time
            limit: Maximum number of entries to return
            
        Returns:
            List of journal entries
        """
        since_str = since_time.isoformat()
        params = {
            "start_time": since_str, 
            "limit": limit, 
            "sort": "desc",
            "includeMarkdown": "true",
            "includeHeadings": "true",
            "timezone": "America/Los_Angeles"
        }
        response = await self._make_request("/lifelogs", params=params)
        
        if "data" in response and "lifelogs" in response["data"]:
            return response["data"]["lifelogs"]
        return []
    
    async def extract_text_content(self, entry: Dict[str, Any]) -> str:
        """
        Extract plain text content from a Limitless entry.
        
        Args:
            entry: A journal entry dictionary from Limitless
            
        Returns:
            Plain text content
        """
        # First check if markdown content is available
        if "markdown" in entry and entry["markdown"]:
            return entry["markdown"]
        
        # Otherwise extract content from the structured format
        text = ""
        if "contents" in entry and entry["contents"]:
            for item in entry["contents"]:
                if "content" in item:
                    text += item["content"] + "\n"
                if "children" in item and item["children"]:
                    for child in item["children"]:
                        if "content" in child:
                            text += "  " + child["content"] + "\n"
        return text
    
    async def extract_markdown_content(self, entry: Dict[str, Any]) -> Optional[str]:
        """
        Extract markdown content from a Limitless entry if available.
        
        Args:
            entry: A journal entry dictionary from Limitless
            
        Returns:
            Markdown content or None if not available
        """
        return entry.get("markdown")
    
    async def extract_title(self, entry: Dict[str, Any]) -> str:
        """
        Extract title from a Limitless entry.
        
        Args:
            entry: A journal entry dictionary from Limitless
            
        Returns:
            Title string
        """
        return entry.get("title", "Untitled Journal Entry")
    
    async def extract_timestamp(self, entry: Dict[str, Any]) -> datetime:
        """
        Extract creation timestamp from a Limitless entry.
        
        Args:
            entry: A journal entry dictionary from Limitless
            
        Returns:
            Datetime object
        """
        # Safely parse the creation timestamp
        created_at = entry.get("created_at")
        if created_at:
            try:
                # Parse the timestamp and convert to PST
                entry_time_utc = datetime.fromisoformat(str(created_at))
                # If entry_time doesn't have tzinfo, assume it's UTC
                if entry_time_utc.tzinfo is None:
                    entry_time_utc = entry_time_utc.replace(tzinfo=pytz.UTC)
                # Convert to PST for consistent timezone
                return entry_time_utc.astimezone(PST)
            except (ValueError, TypeError) as e:
                self.logger.warning(f"Could not parse timestamp: {created_at}, error: {e}, using current time")
        
        # Default to current time if no timestamp available
        return datetime.now(PST)
    
    async def extract_unique_id(self, entry: Dict[str, Any]) -> str:
        """
        Extract unique ID from a Limitless entry.
        
        Args:
            entry: A journal entry dictionary from Limitless
            
        Returns:
            Unique ID string
        """
        return entry.get("id", "")
    
    async def save_entry_to_db(self, entry: Dict[str, Any]) -> LimitlessEntry:
        """
        Process a Limitless entry and save it to the database.
        
        Args:
            entry: Limitless entry to process
            
        Returns:
            The created database entry
        """
        entry_id = await self.extract_unique_id(entry)
        title = await self.extract_title(entry)
        content = await self.extract_text_content(entry)
        markdown = await self.extract_markdown_content(entry)
        entry_time = await self.extract_timestamp(entry)
        entry_date = entry_time.date()
        
        # Create and save the database entry using the new LimitlessEntry model
        limitless_entry = LimitlessEntry()
        limitless_entry.lifelog_id = entry_id
        limitless_entry.title = title
        limitless_entry.content = content
        limitless_entry.markdown = markdown
        limitless_entry.raw_data = entry
        limitless_entry.entry_timestamp = entry_time
        limitless_entry.entry_date = entry_date
        
        db.session.add(limitless_entry)
        db.session.commit()
        
        self.logger.info(f"Saved new Limitless entry: {title}")
        self.processed_entry_ids.add(entry_id)
        
        return limitless_entry
    
    def is_already_processed(self, entry_id: str) -> bool:
        """
        Check if a Limitless entry has already been processed.
        
        Args:
            entry_id: The Limitless API entry ID
            
        Returns:
            True if already processed, False otherwise
        """
        # Check the in-memory set first
        if entry_id in self.processed_entry_ids:
            return True
            
        # Then check the database using the LimitlessEntry model
        existing = db.session.query(LimitlessEntry).filter_by(
            lifelog_id=entry_id
        ).first()
        
        if existing:
            # Add to the in-memory set for future checks
            self.processed_entry_ids.add(entry_id)
            return True
            
        return False

# Synchronous functions for API routes (for backward compatibility)

def get_recent_journal_entries(limit=10):
    """
    Get recent journal entries from the database.
    
    Args:
        limit: Maximum number of entries to return
        
    Returns:
        List of journal entries
    """
    # Get Limitless entries
    limitless_entries = db.session.query(LimitlessEntry).order_by(
        desc(LimitlessEntry.entry_timestamp)
    ).limit(limit).all()
    
    # Get other journal entries (if any)
    other_entries = db.session.query(JournalEntry).order_by(
        desc(JournalEntry.entry_timestamp)
    ).limit(limit).all()
    
    # Combine and sort
    all_entries = sorted(
        limitless_entries + other_entries,
        key=lambda x: x.entry_timestamp,
        reverse=True
    )[:limit]
    
    return all_entries

def get_journal_entries_for_date(date):
    """
    Get journal entries for a specific date.
    
    Args:
        date: The date to get entries for
        
    Returns:
        List of journal entries
    """
    # Get Limitless entries
    limitless_entries = db.session.query(LimitlessEntry).filter(
        LimitlessEntry.entry_date == date
    ).order_by(LimitlessEntry.entry_timestamp).all()
    
    # Get other journal entries (if any)
    other_entries = db.session.query(JournalEntry).filter(
        JournalEntry.entry_date == date
    ).order_by(JournalEntry.entry_timestamp).all()
    
    # Combine and sort
    all_entries = sorted(
        limitless_entries + other_entries,
        key=lambda x: x.entry_timestamp
    )
    
    return all_entries

def get_journal_entries_for_date_range(start_date, end_date):
    """
    Get journal entries for a date range.
    
    Args:
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        
    Returns:
        List of journal entries
    """
    # Log what we're doing for debugging
    print(f"Querying for entries between {start_date} and {end_date}")
    
    # Get Limitless entries
    limitless_entries = db.session.query(LimitlessEntry).filter(
        LimitlessEntry.entry_date >= start_date,
        LimitlessEntry.entry_date <= end_date
    ).order_by(desc(LimitlessEntry.entry_timestamp)).all()
    
    # Get other journal entries (if any)
    other_entries = db.session.query(JournalEntry).filter(
        JournalEntry.entry_date >= start_date,
        JournalEntry.entry_date <= end_date
    ).order_by(desc(JournalEntry.entry_timestamp)).all()
    
    # Combine and sort
    all_entries = sorted(
        limitless_entries + other_entries,
        key=lambda x: x.entry_timestamp,
        reverse=True
    )
    
    print(f"Found {len(all_entries)} entries in date range")
    return all_entries

def format_journal_entry(entry):
    """
    Format a journal entry for API response.
    
    Args:
        entry: JournalEntry or LimitlessEntry object
        
    Returns:
        Formatted dictionary for API response
    """
    # Check if it's a LimitlessEntry object
    if isinstance(entry, LimitlessEntry):
        # If no sentiment score is available, analyze the text
        sentiment_score = entry.sentiment_score
        emotion_tags = entry.emotion_tags or []
        
        if sentiment_score is None and entry.content:
            # Analyze sentiment
            analysis_result = analyze_journal_entry(entry.content)
            sentiment_score = analysis_result['sentiment_score']
            emotion_tags = analysis_result['emotion_tags']
            
            # Save the analysis results to the database
            try:
                entry.sentiment_score = sentiment_score
                entry.emotion_tags = emotion_tags
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error saving sentiment analysis: {str(e)}")
        
        return {
            "id": entry.id,
            "source": "limitless",  # For compatibility
            "source_display_name": "Limitless AI",
            "source_id": entry.lifelog_id,
            "title": entry.title,
            "content": entry.content,
            "entry_timestamp": entry.entry_timestamp.isoformat(),
            "entry_date": entry.entry_date.isoformat(),
            "sentiment_score": sentiment_score,
            "emotion_tags": emotion_tags,
            "sentiment_label": get_sentiment_label(sentiment_score)
        }
    
    # Otherwise, assume it's a JournalEntry
    sentiment_score = entry.sentiment_score
    emotion_tags = entry.emotion_tags or []
    
    if sentiment_score is None and entry.content:
        # Analyze sentiment
        analysis_result = analyze_journal_entry(entry.content)
        sentiment_score = analysis_result['sentiment_score']
        emotion_tags = analysis_result['emotion_tags']
        
        # Save the analysis results to the database
        try:
            entry.sentiment_score = sentiment_score
            entry.emotion_tags = emotion_tags
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving sentiment analysis: {str(e)}")
    
    return {
        "id": entry.id,
        "source": entry.source,
        "source_display_name": "Bee AI" if entry.source == "bee" else entry.source.capitalize(),
        "source_id": entry.source_id,
        "title": entry.title,
        "content": entry.content,
        "entry_timestamp": entry.entry_timestamp.isoformat(),
        "entry_date": entry.entry_date.isoformat(),
        "sentiment_score": sentiment_score,
        "emotion_tags": emotion_tags,
        "sentiment_label": get_sentiment_label(sentiment_score)
    }

def get_sentiment_label(score):
    """Convert sentiment score to a human-readable label"""
    if score is None:
        return "neutral"
    elif score > 0.3:
        return "positive"
    elif score < -0.3:
        return "negative"
    else:
        return "neutral"