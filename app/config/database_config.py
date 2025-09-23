"""
Centralized database configuration module

This module provides a unified interface for all database configuration,
reading from environment variables and providing production-grade settings
for both SQLite and Supabase connections.
"""

import os
import logging
from typing import Dict, Any, Optional, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class DatabaseConfigError(Exception):
    """Custom exception for database configuration errors"""
    pass


class DatabaseConfig:
    """Centralized database configuration class"""
    
    def __init__(self):
        self._validate_required_config()
        self.database_type = self.get_database_type()
        self.app_environment = self.get_app_environment()
    
    def get_database_type(self) -> str:
        """Get the database type (sqlite or supabase)"""
        return os.getenv("DATABASE_TYPE", "sqlite").lower()
    
    def get_app_environment(self) -> str:
        """Get the application environment (development, staging, production)"""
        return os.getenv("APP_ENVIRONMENT", "development").lower()
    
    def get_sqlite_database_path(self) -> str:
        """Get the SQLite database path based on environment"""
        env = self.get_app_environment()
        
        # Environment-specific database paths
        if env == "development":
            return os.getenv("DEV_SQLITE_DATABASE_PATH", 
                           os.getenv("SQLITE_DATABASE_PATH", "Tabble_dev.db"))
        elif env == "staging":
            return os.getenv("STAGING_SQLITE_DATABASE_PATH", 
                           os.getenv("SQLITE_DATABASE_PATH", "Tabble_staging.db"))
        elif env == "production":
            return os.getenv("PROD_SQLITE_DATABASE_PATH", 
                           os.getenv("SQLITE_DATABASE_PATH", "Tabble_prod.db"))
        else:
            # Fallback to default
            return os.getenv("SQLITE_DATABASE_PATH", "Tabble.db")
    
    def get_sqlite_database_url(self) -> str:
        """Get the SQLite database URL for SQLAlchemy"""
        db_path = self.get_sqlite_database_path()
        return f"sqlite:///./{db_path}"
    
    def get_sqlite_connection_params(self) -> Dict[str, Any]:
        """Get SQLite connection parameters"""
        return {
            "timeout": int(os.getenv("SQLITE_TIMEOUT", "30")),
            "check_same_thread": os.getenv("SQLITE_CHECK_SAME_THREAD", "false").lower() == "true"
        }
    
    def get_sqlalchemy_engine_params(self) -> Dict[str, Any]:
        """Get SQLAlchemy engine parameters for connection pooling"""
        return {
            "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
            "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
            "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "3600")),
            "pool_pre_ping": os.getenv("DB_POOL_PRE_PING", "true").lower() == "true",
            "echo": self._get_db_echo_setting()
        }
    
    def get_database_timeout_settings(self) -> Dict[str, int]:
        """Get database timeout and retry settings"""
        return {
            "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "30")),
            "query_timeout": int(os.getenv("DB_QUERY_TIMEOUT", "60")),
            "max_retries": int(os.getenv("DB_MAX_RETRIES", "3")),
            "retry_delay": int(os.getenv("DB_RETRY_DELAY", "1"))
        }
    
    def get_supabase_config(self) -> Dict[str, str]:
        """Get Supabase configuration"""
        url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not url or not anon_key or not service_key:
            raise DatabaseConfigError(
                "SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY must be set when using Supabase"
            )
        
        return {
            "url": url,
            "anon_key": anon_key,
            "service_key": service_key,
            "timeout": int(os.getenv("SUPABASE_TIMEOUT", "30")),
            "max_retries": int(os.getenv("SUPABASE_MAX_RETRIES", "3")),
            "retry_delay": int(os.getenv("SUPABASE_RETRY_DELAY", "1"))
        }
    
    def get_database_connection_config(self) -> Tuple[str, str, Dict[str, Any]]:
        """
        Get complete database connection configuration
        
        Returns:
            Tuple of (database_name, database_url, connection_params)
        """
        if self.database_type == "supabase":
            # For Supabase, return dummy SQLite config for legacy compatibility
            return "Supabase", "sqlite:///./dummy.db", {"check_same_thread": False}
        else:
            db_path = self.get_sqlite_database_path()
            db_url = self.get_sqlite_database_url()
            sqlite_params = self.get_sqlite_connection_params()
            
            return db_path, db_url, {"check_same_thread": sqlite_params["check_same_thread"]}
    
    def _get_db_echo_setting(self) -> bool:
        """Get database echo setting based on environment"""
        env = self.get_app_environment()
        
        if env == "development":
            return os.getenv("DEV_DB_ECHO", "false").lower() == "true"
        elif env == "staging":
            return os.getenv("STAGING_DB_ECHO", "false").lower() == "true"
        elif env == "production":
            return os.getenv("PROD_DB_ECHO", "false").lower() == "true"
        else:
            return False
    
    def _validate_required_config(self) -> None:
        """Validate that required configuration variables are present"""
        database_type = os.getenv("DATABASE_TYPE", "sqlite").lower()
        
        if database_type == "supabase":
            required_vars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"]
            missing_vars = [var for var in required_vars if not os.getenv(var)]
            
            if missing_vars:
                raise DatabaseConfigError(
                    f"Missing required Supabase configuration variables: {', '.join(missing_vars)}"
                )
        
        # SQLite configuration is optional as we have defaults
        logger.info(f"Database configuration validated for type: {database_type}")


# Global database configuration instance
_db_config = None


def get_database_config() -> DatabaseConfig:
    """Get the global database configuration instance"""
    global _db_config
    if _db_config is None:
        _db_config = DatabaseConfig()
    return _db_config


# Convenience functions for backward compatibility
def get_sqlite_database_path() -> str:
    """Get the SQLite database path"""
    return get_database_config().get_sqlite_database_path()


def get_sqlite_database_url() -> str:
    """Get the SQLite database URL"""
    return get_database_config().get_sqlite_database_url()


def get_database_type() -> str:
    """Get the database type"""
    return get_database_config().get_database_type()


def get_database_connection_config() -> Tuple[str, str, Dict[str, Any]]:
    """Get complete database connection configuration"""
    return get_database_config().get_database_connection_config()


def validate_database_config() -> bool:
    """Validate database configuration and return True if valid"""
    try:
        get_database_config()
        return True
    except DatabaseConfigError as e:
        logger.error(f"Database configuration validation failed: {e}")
        return False
