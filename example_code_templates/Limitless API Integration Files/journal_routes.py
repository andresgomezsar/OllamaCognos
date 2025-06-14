"""
API routes for voice journal entries from Limitless AI
"""

from flask import Blueprint, jsonify, request, current_app
import asyncio
from datetime import datetime, timedelta
from app.auth import requires_auth, requires_admin_auth
import logging
import pytz
import numpy

from app.limitless_client import (
    get_recent_journal_entries,
    get_journal_entries_for_date,
    get_journal_entries_for_date_range,
    format_journal_entry
)
from app.journal_client_factory import JournalClientFactory

# Create a blueprint for journal routes
journal_bp = Blueprint('journal', __name__)

# Add timezone helper (PST timezone)
PST = pytz.timezone('America/Los_Angeles')

@journal_bp.route('/api/journal/entries', methods=['GET'])
@requires_auth
def get_journal_entries():
    """
    Get journal entries with optional date filtering.
    
    Query parameters:
    - date: Get entries for a specific date (format: YYYY-MM-DD)
    - start_date: Get entries since this date (format: YYYY-MM-DD)
    - end_date: Get entries until this date (format: YYYY-MM-DD)
    - limit: Maximum number of entries to return (default: 10)
    
    Returns:
        JSON response with journal entries
    """
    try:
        # Parse query parameters
        date_str = request.args.get('date')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        days_str = request.args.get('days')
        source = request.args.get('source', 'all')
        sentiment = request.args.get('sentiment', 'all')
        limit = int(request.args.get('limit', 10))
        
        entries = []
        
        # If days parameter is provided, convert to a date range
        if days_str and not (date_str or (start_date_str and end_date_str)):
            try:
                days = int(days_str)
                end_date = datetime.now(PST).date()
                start_date = end_date - timedelta(days=days)
                
                current_app.logger.info(f"Using 'days' parameter to calculate date range: {start_date} to {end_date}")
                
                entries = get_journal_entries_for_date_range(start_date, end_date)
                current_app.logger.info(f"Found {len(entries)} entries for the last {days} days")
                
            except ValueError as e:
                current_app.logger.error(f"Error parsing 'days' parameter: {e}")
                return jsonify({"error": "Invalid 'days' parameter. Must be an integer."}), 400
        
        # Get entries for a specific date
        elif date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                entries = get_journal_entries_for_date(date)
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
        
        # Get entries for a date range
        elif start_date_str and end_date_str:
            try:
                # Convert string dates to datetime objects
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                # Log the actual dates being used for query
                current_app.logger.info(f"Fetching journal entries from {start_date} to {end_date} (inclusive)")
                
                # Get entries for this date range
                entries = get_journal_entries_for_date_range(start_date, end_date)
                current_app.logger.info(f"Found {len(entries)} entries")
            except ValueError as e:
                current_app.logger.error(f"Date parse error: {e}")
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
        
        # Get recent entries
        else:
            entries = get_recent_journal_entries(limit=limit)
        
        # Format entries for response
        formatted_entries = [format_journal_entry(entry) for entry in entries]
        
        return jsonify({
            "entries": formatted_entries,
            "count": len(formatted_entries),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching journal entries: {str(e)}")
        return jsonify({"error": str(e)}), 500

@journal_bp.route('/api/journal/entries/<int:entry_id>', methods=['GET'])
@requires_admin_auth
def get_journal_entry(entry_id):
    """
    Get a specific journal entry by ID.
    
    Args:
        entry_id: The database ID of the journal entry
    
    Returns:
        JSON response with the journal entry
    """
    try:
        from app.models import JournalEntry, LimitlessEntry
        
        # First check if entry exists in JournalEntry table
        entry = JournalEntry.query.get(entry_id)
        
        if not entry:
            # If not found, check in the LimitlessEntry table
            entry = LimitlessEntry.query.get(entry_id)
            
        if not entry:
            return jsonify({"error": "Journal entry not found"}), 404
        
        formatted_entry = format_journal_entry(entry)
        
        return jsonify({
            "entry": formatted_entry,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching journal entry: {str(e)}")
        return jsonify({"error": str(e)}), 500

@journal_bp.route('/api/journal/correlate/oura', methods=['GET'])
@requires_auth
def correlate_journal_with_oura():
    """
    Correlate journal entries with Oura data for a date range.
    
    Query parameters:
    - start_date: Start date for correlation (format: YYYY-MM-DD)
    - end_date: End date for correlation (format: YYYY-MM-DD)
    
    Returns:
        JSON response with correlated journal and Oura data
    """
    try:
        from app.models import OuraData, JournalEntry, LimitlessEntry
        
        # Parse query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if not start_date_str or not end_date_str:
            # Default to last 7 days if no dates provided
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=7)
        else:
            try:
                # Convert string dates to datetime objects
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                # Log the actual dates being used for correlation
                current_app.logger.info(f"Correlating journal entries with Oura data from {start_date} to {end_date} (inclusive)")
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
        
        # Get journal entries for the date range
        journal_entries = get_journal_entries_for_date_range(start_date, end_date)
        formatted_entries = [format_journal_entry(entry) for entry in journal_entries]
        
        # Get Oura data for the same date range
        oura_data = {}
        oura_types = ['sleep', 'readiness', 'stress']
        
        for data_type in oura_types:
            data = OuraData.query.filter(
                OuraData.date >= start_date,
                OuraData.date <= end_date,
                OuraData.data_type == data_type
            ).order_by(OuraData.date).all()
            
            oura_data[data_type] = [{"date": item.date.isoformat(), "data": item.data} for item in data]
        
        # Organize data by date for easier correlation
        correlated_data = {}
        
        # First add all dates with Oura data
        for data_type, items in oura_data.items():
            for item in items:
                date = item["date"]
                if date not in correlated_data:
                    correlated_data[date] = {"oura": {}, "journal": []}
                correlated_data[date]["oura"][data_type] = item["data"]
        
        # Then add journal entries
        for entry in formatted_entries:
            date = entry["entry_date"]
            if date not in correlated_data:
                correlated_data[date] = {"oura": {}, "journal": []}
            correlated_data[date]["journal"].append(entry)
        
        return jsonify({
            "correlated_data": correlated_data,
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error correlating data: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
@journal_bp.route('/api/journal/refresh', methods=['GET', 'POST'])
@requires_admin_auth
def refresh_journal_entries():
    """
    Manually refresh journal entries from the source API.
    
    Query parameters:
    - date: Optional. Refresh entries for a specific date (format: YYYY-MM-DD)
    - start_date: Optional. Start date for range refresh (format: YYYY-MM-DD)
    - end_date: Optional. End date for range refresh (format: YYYY-MM-DD)
    
    Returns:
        JSON response with the refresh result
    """
    # Get date parameters if provided
    date_str = request.args.get('date')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    try:
        # Use the singleton factory instance to access clients
        from app.journal_client_factory import journal_client_factory
        clients = journal_client_factory.get_all_clients()
        
        # If no clients are configured, return error
        if not clients:
            return jsonify({
                'success': False,
                'error': 'No journal clients configured',
                'refreshed': 0
            })
        
        # Track results for each client
        results = {}
        total_refreshed = 0
        
        async def refresh_entries():
            nonlocal total_refreshed
            
            for client_type, client in clients.items():
                # Case 1: If a specific date is provided
                if date_str:
                    try:
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                        
                        # Start and end of the specified date with timezone info
                        # Setting to beginning of day (00:00:00) and end of day (23:59:59)
                        start_time = datetime.combine(date_obj, datetime.min.time()).replace(tzinfo=PST)
                        end_time = datetime.combine(date_obj, datetime.max.time()).replace(tzinfo=PST)
                        
                        current_app.logger.info(f"Refreshing entries for date: {date_obj} (full day)")
                        
                        # Get entries for this specific date
                        entries = await client.get_entries_since(start_time, limit=50)
                        
                        # Filter to just the entries for this date
                        date_entries = []
                        for entry in entries:
                            entry_time = await client.extract_timestamp(entry)
                            if start_time <= entry_time <= end_time:
                                date_entries.append(entry)
                        
                        # Process each entry
                        refreshed = 0
                        for entry in date_entries:
                            entry_id = await client.extract_unique_id(entry)
                            if not client.is_already_processed(entry_id):
                                await client.save_entry_to_db(entry)
                                refreshed += 1
                        
                        results[client_type] = {
                            'found': len(date_entries),
                            'refreshed': refreshed
                        }
                        total_refreshed += refreshed
                        
                    except ValueError:
                        # Invalid date format
                        results[client_type] = {
                            'error': f"Invalid date format: {date_str}. Expected YYYY-MM-DD."
                        }
                
                # Case 2: If a date range is provided
                elif start_date_str and end_date_str:
                    try:
                        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                        
                        # Ensure end date includes the full day by setting to start of day and end of day
                        start_time = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=PST)
                        end_time = datetime.combine(end_date, datetime.max.time()).replace(tzinfo=PST)
                        
                        current_app.logger.info(f"Refreshing entries from {start_date} to {end_date} (inclusive)")
                        
                        # Get all entries since the start date
                        entries = await client.get_entries_since(start_time, limit=100)
                        
                        # Filter to the date range
                        date_range_entries = []
                        for entry in entries:
                            entry_time = await client.extract_timestamp(entry)
                            if start_time <= entry_time <= end_time:
                                date_range_entries.append(entry)
                        
                        current_app.logger.info(f"Found {len(date_range_entries)} entries in date range")
                        
                        # Process each entry
                        refreshed = 0
                        for entry in date_range_entries:
                            entry_id = await client.extract_unique_id(entry)
                            if not client.is_already_processed(entry_id):
                                await client.save_entry_to_db(entry)
                                refreshed += 1
                        
                        results[client_type] = {
                            'found': len(date_range_entries),
                            'refreshed': refreshed
                        }
                        total_refreshed += refreshed
                        
                    except ValueError as e:
                        # Invalid date format
                        current_app.logger.error(f"Date error: {e}")
                        results[client_type] = {
                            'error': f"Invalid date format. Expected YYYY-MM-DD."
                        }
                
                # Case 3: Otherwise refresh all recent entries
                else:
                    # Get recent entries directly to inspect the data
                    try:
                        recent_entries = await client.get_recent_entries(limit=5)
                        current_app.logger.info(f"DEBUG - Limitless API response: {recent_entries}")
                        
                        # Check if we got valid data
                        if recent_entries and isinstance(recent_entries, list):
                            current_app.logger.info(f"Found {len(recent_entries)} recent entries from Limitless API")
                            
                            # Debug the first entry if there is one
                            if len(recent_entries) > 0:
                                first_entry = recent_entries[0]
                                entry_id = await client.extract_unique_id(first_entry)
                                title = await client.extract_title(first_entry)
                                current_app.logger.info(f"First entry: ID={entry_id}, Title={title}")
                        else:
                            current_app.logger.warning(f"Limitless API returned empty or invalid response: {recent_entries}")
                    except Exception as api_error:
                        current_app.logger.error(f"Error fetching from Limitless API: {str(api_error)}")
                    
                    # Force polling for new entries
                    await client.poll_for_new_entries()
                    results[client_type] = {
                        'success': True,
                        'message': 'Refreshed recent entries'
                    }
                    total_refreshed += 1  # Count each successful poll as 1 refresh
        
        # Run the refresh asynchronously
        asyncio.run(refresh_entries())
        
        return jsonify({
            'success': True,
            'results': results,
            'refreshed': total_refreshed
        })
        
    except Exception as e:
        logging.error(f"Error refreshing journal entries: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'refreshed': 0
        })


@journal_bp.route('/api/journal/test-limitless', methods=['GET'])
@requires_admin_auth
def test_limitless_api():
    """
    Test endpoint to directly call the Limitless API and check the response.
    This helps diagnose issues with the Limitless integration.
    """
    try:
        import asyncio
        import httpx
        from config import Config
        
        # Get the API key from config
        api_key = Config.LIMITLESS_API_KEY
        
        if not api_key:
            return jsonify({"error": "Limitless API key not configured"}), 500
        
        # Create an async function to make the API call
        async def fetch_lifelogs():
            async with httpx.AsyncClient() as client:
                headers = {
                    "X-API-Key": api_key,
                    "Content-Type": "application/json"
                }
                
                # Make the direct API call
                response = await client.get(
                    "https://api.limitless.ai/v1/lifelogs",
                    headers=headers,
                    params={"limit": 5},
                    timeout=30.0
                )
                
                # Log response status and text
                current_app.logger.info(f"Limitless API status: {response.status_code}")
                
                # Return the response data
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": f"API returned status {response.status_code}", "text": response.text}
        
        # Run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(fetch_lifelogs())
        loop.close()
        
        # Check the DB status too
        from app.models import JournalEntry, LimitlessEntry
        journal_count = JournalEntry.query.count()
        limitless_count = LimitlessEntry.query.count()
        db_count = journal_count + limitless_count
        
        return jsonify({
            "limitless_api_response": result,
            "db_entries_count": db_count,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Error testing Limitless API: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
@journal_bp.route('/api/journal/test-bee', methods=['GET'])
@requires_admin_auth
def test_bee_api():
    """
    Test endpoint to directly call the Bee AI API and check the response.
    This helps diagnose issues with the Bee AI integration.
    """
    from config import Config
    from beeai import Bee
    
    if not Config.BEE_API_KEY:
        return jsonify({
            'success': False,
            'message': 'Bee API key is not configured'
        }), 400
        
    async def test_bee_connection():
        try:
            # Create a Bee SDK instance with the API key
            bee_client = Bee(Config.BEE_API_KEY)
            
            # Test getting conversations
            conversations_result = await bee_client.get_conversations("me")
            
            # Get the first few conversations if available
            conversations = conversations_result.get("conversations", [])
            conversation_count = len(conversations)
            
            # Limit and truncate the data for display
            conversation_sample = []
            for conv in conversations[:3]:  # Take only the first 3
                # Create a simplified version with truncated content
                sample_conv = {
                    "id": conv.get("id", ""),
                    "title": conv.get("title", "Untitled"),
                    "timestamp": conv.get("creation_time", ""),
                    "utterance_count": len(conv.get("utterances", [])) if "utterances" in conv else 0,
                }
                conversation_sample.append(sample_conv)
            
            # Get facts count if available
            facts_result = await bee_client.get_facts("me")
            facts_count = len(facts_result.get("facts", []))
            
            # Get todos count if available
            todos_result = await bee_client.get_todos("me")
            todos_count = len(todos_result.get("todos", []))
            
            return {
                'success': True,
                'message': 'Successfully connected to Bee AI API',
                'conversation_count': conversation_count,
                'conversation_sample': conversation_sample,
                'facts_count': facts_count,
                'todos_count': todos_count,
                'bee_enabled': Config.BEE_ENABLED,
                'poll_interval': Config.BEE_POLL_INTERVAL
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error connecting to Bee AI API: {str(e)}',
                'error': str(e)
            }
    
    try:
        # Run the async function within the Flask request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(test_bee_connection())
        loop.close()
        
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error testing Bee AI API: {str(e)}")
        return jsonify({"error": str(e)}), 500

@journal_bp.route('/api/journal/correlate', methods=['POST'])
@requires_auth
def analyze_journal_entries():
    """
    Analyze journal entries for sentiment and correlate with biomarker data.
    
    Request body:
    - days: Number of days to analyze (default: 7)
    - start_date: Optional start date (format: YYYY-MM-DD)
    - end_date: Optional end date (format: YYYY-MM-DD)
    
    Returns:
        JSON response with analysis results
    """
    try:
        data = request.get_json()
        days = data.get('days', 7)
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        
        # Get current time in PST timezone
        now = datetime.now(PST)
        
        # Calculate dates based on input
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
        else:
            # Default to the last N days
            end_date = now.date()
            start_date = end_date - timedelta(days=int(days))
        
        # Fetch journal entries for the date range
        entries = get_journal_entries_for_date_range(start_date, end_date)
        
        # Import sentiment analyzer here to avoid circular imports
        from app.sentiment_analyzer import analyze_journal_entry
        
        # Analyze sentiment for each entry if not already analyzed
        sentiment_data = []
        for entry in entries:
            # Check if entry is Limitless or Journal type
            from app.models import LimitlessEntry, JournalEntry
            
            # Process each entry
            entry_content = entry.content
            if not entry.sentiment_score and entry_content:
                # Analyze sentiment
                analysis_result = analyze_journal_entry(entry_content)
                
                # Update the entry in the database
                entry.sentiment_score = analysis_result['sentiment_score']
                entry.emotion_tags = analysis_result['emotion_tags']
                try:
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    current_app.logger.error(f"Error saving sentiment analysis: {str(e)}")
            
            # Add to sentiment data
            sentiment_data.append({
                'id': entry.id,
                'date': entry.entry_date.isoformat(),
                'timestamp': entry.entry_timestamp.isoformat(),
                'sentiment_score': entry.sentiment_score,
                'emotion_tags': entry.emotion_tags
            })
        
        # Fetch Oura data for the same period
        from app.models import OuraData
        from sqlalchemy import and_
        
        oura_data = OuraData.query.filter(
            and_(
                OuraData.date >= start_date,
                OuraData.date <= end_date
            )
        ).all()
        
        # Group Oura data by date and type
        oura_by_date = {}
        for data in oura_data:
            date_str = data.date.isoformat()
            if date_str not in oura_by_date:
                oura_by_date[date_str] = {}
            
            oura_by_date[date_str][data.data_type] = data.data
        
        # Calculate correlations between journal sentiment and Oura metrics
        correlations = calculate_correlations(sentiment_data, oura_by_date)
        
        # Return the analysis results
        return jsonify({
            'sentiment_data': sentiment_data,
            'correlations': correlations,
            'analyzed_entries_count': len(entries),
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'timestamp': now.isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error analyzing journal entries: {str(e)}")
        return jsonify({"error": str(e)}), 500

def calculate_correlations(sentiment_data, oura_data):
    """
    Calculate correlations between journal sentiment and Oura metrics.
    
    Args:
        sentiment_data: List of sentiment data by date
        oura_data: Dictionary of Oura data by date and type
    
    Returns:
        List of correlation objects
    """
    # Prepare data for correlation analysis
    dates = set()
    sentiment_by_date = {}
    
    # Group sentiment data by date (taking average for each day)
    for entry in sentiment_data:
        date_str = entry['date']
        dates.add(date_str)
        
        if date_str not in sentiment_by_date:
            sentiment_by_date[date_str] = []
        
        if entry['sentiment_score'] is not None:
            sentiment_by_date[date_str].append(entry['sentiment_score'])
    
    # Calculate average sentiment per day
    avg_sentiment_by_date = {}
    for date_str, scores in sentiment_by_date.items():
        if scores:  # Make sure there are scores for this date
            avg_sentiment_by_date[date_str] = sum(scores) / len(scores)
    
    # Common dates between sentiment and Oura data
    common_dates = set(avg_sentiment_by_date.keys()) & set(oura_data.keys())
    
    if len(common_dates) < 3:  # Need at least 3 data points for meaningful correlation
        return []
    
    # Define metrics to check for correlation
    metrics_to_check = [
        {'type': 'sleep', 'metric': 'score', 'name': 'Sleep Score'},
        {'type': 'sleep', 'metric': 'efficiency', 'name': 'Sleep Efficiency'},
        {'type': 'sleep', 'metric': 'total_sleep_duration', 'name': 'Sleep Duration'},
        {'type': 'readiness', 'metric': 'score', 'name': 'Readiness Score'},
        {'type': 'readiness', 'metric': 'hrv_balance', 'name': 'HRV Balance'},
        {'type': 'readiness', 'metric': 'resting_heart_rate', 'name': 'Resting HR'},
        {'type': 'stress', 'metric': 'stress_level', 'name': 'Stress Level'}
    ]
    
    correlations = []
    
    # For each metric, calculate correlation with sentiment
    for metric_info in metrics_to_check:
        data_type = metric_info['type']
        metric_key = metric_info['metric']
        metric_name = metric_info['name']
        
        sentiment_values = []
        metric_values = []
        
        # Collect paired values for correlation
        for date_str in common_dates:
            if date_str in avg_sentiment_by_date and date_str in oura_data and data_type in oura_data[date_str]:
                oura_entry = oura_data[date_str][data_type]
                if isinstance(oura_entry, dict) and metric_key in oura_entry:
                    metric_value = oura_entry[metric_key]
                    
                    # Make sure it's a numeric value
                    if isinstance(metric_value, (int, float)):
                        sentiment_values.append(avg_sentiment_by_date[date_str])
                        metric_values.append(metric_value)
        
        # Calculate correlation if we have enough data points
        if len(sentiment_values) >= 3 and len(metric_values) >= 3:
            try:
                from scipy.stats import pearsonr
                correlation, p_value = pearsonr(sentiment_values, metric_values)
                
                # Only include if correlation is statistically significant
                if not numpy.isnan(correlation) and (abs(correlation) > 0.3 or p_value < 0.05):
                    correlations.append({
                        'biomarker': metric_name,
                        'strength': round(correlation, 2),
                        'p_value': round(p_value, 3),
                        'significant': p_value < 0.05,
                        'data_points': len(sentiment_values)
                    })
            except Exception as e:
                current_app.logger.error(f"Error calculating correlation for {metric_name}: {str(e)}")
                # Continue with other metrics even if one fails
    
    # Sort by absolute correlation strength (strongest first)
    correlations.sort(key=lambda x: abs(x['strength']), reverse=True)
    
    return correlations