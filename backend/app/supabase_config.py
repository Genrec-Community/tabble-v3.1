"""
Supabase configuration and client setup
"""
import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseConfig:
    """Supabase configuration and client management"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        self._client: Optional[Client] = None
        self._service_client: Optional[Client] = None
    
    def get_client(self) -> Client:
        """Get Supabase client with anon key (for regular operations)"""
        if not self._client:
            if not self.url or not self.anon_key:
                raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
            self._client = create_client(self.url, self.anon_key)
        return self._client
    
    def get_service_client(self) -> Client:
        """Get Supabase client with service key (for admin operations)"""
        if not self._service_client:
            if not self.url or not self.service_key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
            self._service_client = create_client(self.url, self.service_key)
        return self._service_client

# Global Supabase configuration instance
supabase_config = SupabaseConfig()

def get_supabase_client() -> Client:
    """Get the default Supabase client"""
    return supabase_config.get_client()

def get_supabase_service_client() -> Client:
    """Get the Supabase service client for admin operations"""
    return supabase_config.get_service_client()
