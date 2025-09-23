"""
Production-grade database connection manager with retry logic, timeout handling, and connection pooling
"""

import time
import logging
import sqlite3
from typing import Optional, Dict, Any, Callable
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.exc import OperationalError, DisconnectionError
from sqlalchemy.pool import StaticPool, QueuePool

from .database_config import get_database_config, DatabaseConfigError

logger = logging.getLogger(__name__)


class DatabaseConnectionError(Exception):
    """Custom exception for database connection errors"""
    pass


class DatabaseConnectionManager:
    """Production-grade database connection manager"""
    
    def __init__(self):
        self.db_config = get_database_config()
        self.timeout_settings = self.db_config.get_database_timeout_settings()
        self._engine = None
        self._session_factory = None
        self._scoped_session = None
    
    def get_engine(self):
        """Get or create SQLAlchemy engine with production-grade settings"""
        if self._engine is None:
            self._create_engine()
        return self._engine
    
    def get_session_factory(self):
        """Get or create session factory"""
        if self._session_factory is None:
            engine = self.get_engine()
            self._session_factory = sessionmaker(
                autocommit=False, 
                autoflush=False, 
                bind=engine
            )
        return self._session_factory
    
    def get_scoped_session(self):
        """Get or create scoped session"""
        if self._scoped_session is None:
            session_factory = self.get_session_factory()
            self._scoped_session = scoped_session(session_factory)
        return self._scoped_session
    
    def _create_engine(self):
        """Create SQLAlchemy engine with production-grade configuration"""
        if self.db_config.database_type == "supabase":
            # For Supabase, create a minimal dummy engine for legacy compatibility
            self._engine = create_engine(
                "sqlite:///./dummy.db",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool
            )
            return
        
        # SQLite configuration with production-grade settings
        db_url = self.db_config.get_sqlite_database_url()
        engine_params = self.db_config.get_sqlalchemy_engine_params()
        connect_args = self.db_config.get_sqlite_connection_params()
        
        # Configure connection pooling for SQLite
        if self.db_config.app_environment == "production":
            poolclass = QueuePool
        else:
            poolclass = StaticPool
        
        # Create engine with retry logic and timeout handling
        self._engine = create_engine(
            db_url,
            connect_args={
                "check_same_thread": connect_args["check_same_thread"],
                "timeout": connect_args["timeout"]
            },
            poolclass=poolclass,
            **engine_params
        )
        
        # Add connection event listeners for production monitoring
        self._add_engine_event_listeners()
    
    def _add_engine_event_listeners(self):
        """Add event listeners for connection monitoring and error handling"""
        
        @event.listens_for(self._engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            """Set SQLite pragmas for better performance and reliability"""
            if self.db_config.database_type == "sqlite":
                cursor = dbapi_connection.cursor()
                # Enable WAL mode for better concurrency
                cursor.execute("PRAGMA journal_mode=WAL")
                # Set synchronous mode for better performance
                cursor.execute("PRAGMA synchronous=NORMAL")
                # Enable foreign key constraints
                cursor.execute("PRAGMA foreign_keys=ON")
                # Set cache size for better performance
                cursor.execute("PRAGMA cache_size=10000")
                cursor.close()
        
        @event.listens_for(self._engine, "engine_connect")
        def log_connection(conn, branch):
            """Log database connections for monitoring"""
            logger.debug(f"Database connection established: {conn}")
        
        @event.listens_for(self._engine, "engine_disposed")
        def log_disposal(engine):
            """Log engine disposal for monitoring"""
            logger.info(f"Database engine disposed: {engine}")
    
    @contextmanager
    def get_connection_with_retry(self):
        """Get database connection with retry logic and timeout handling"""
        max_retries = self.timeout_settings["max_retries"]
        retry_delay = self.timeout_settings["retry_delay"]
        
        for attempt in range(max_retries + 1):
            try:
                if self.db_config.database_type == "sqlite":
                    # For SQLite, use direct connection with timeout
                    db_path = self.db_config.get_sqlite_database_path()
                    connect_params = self.db_config.get_sqlite_connection_params()
                    
                    conn = sqlite3.connect(
                        db_path,
                        timeout=connect_params["timeout"],
                        check_same_thread=connect_params["check_same_thread"]
                    )
                    
                    # Set SQLite pragmas
                    conn.execute("PRAGMA journal_mode=WAL")
                    conn.execute("PRAGMA synchronous=NORMAL")
                    conn.execute("PRAGMA foreign_keys=ON")
                    
                    try:
                        yield conn
                    finally:
                        conn.close()
                    return
                else:
                    # For Supabase, this shouldn't be used directly
                    raise DatabaseConnectionError("Direct connection not supported for Supabase")
                    
            except (OperationalError, DisconnectionError, sqlite3.OperationalError) as e:
                if attempt < max_retries:
                    logger.warning(
                        f"Database connection attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {retry_delay} seconds..."
                    )
                    time.sleep(retry_delay)
                else:
                    logger.error(f"Database connection failed after {max_retries + 1} attempts: {e}")
                    raise DatabaseConnectionError(f"Failed to connect to database: {e}")
    
    @contextmanager
    def get_session_with_retry(self):
        """Get SQLAlchemy session with retry logic"""
        max_retries = self.timeout_settings["max_retries"]
        retry_delay = self.timeout_settings["retry_delay"]
        
        for attempt in range(max_retries + 1):
            try:
                session = self.get_scoped_session()()
                try:
                    yield session
                    session.commit()
                except Exception:
                    session.rollback()
                    raise
                finally:
                    session.close()
                return
                
            except (OperationalError, DisconnectionError) as e:
                if attempt < max_retries:
                    logger.warning(
                        f"Database session attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {retry_delay} seconds..."
                    )
                    time.sleep(retry_delay)
                else:
                    logger.error(f"Database session failed after {max_retries + 1} attempts: {e}")
                    raise DatabaseConnectionError(f"Failed to create database session: {e}")
    
    def execute_with_retry(self, operation: Callable, *args, **kwargs):
        """Execute database operation with retry logic"""
        max_retries = self.timeout_settings["max_retries"]
        retry_delay = self.timeout_settings["retry_delay"]
        
        for attempt in range(max_retries + 1):
            try:
                return operation(*args, **kwargs)
            except (OperationalError, DisconnectionError, sqlite3.OperationalError) as e:
                if attempt < max_retries:
                    logger.warning(
                        f"Database operation attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {retry_delay} seconds..."
                    )
                    time.sleep(retry_delay)
                else:
                    logger.error(f"Database operation failed after {max_retries + 1} attempts: {e}")
                    raise DatabaseConnectionError(f"Database operation failed: {e}")
    
    def health_check(self) -> bool:
        """Perform database health check"""
        try:
            if self.db_config.database_type == "sqlite":
                with self.get_connection_with_retry() as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    return result is not None
            else:
                # For Supabase, health check should be done through the adapter
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    def dispose(self):
        """Dispose of database connections and cleanup resources"""
        if self._scoped_session:
            self._scoped_session.remove()
        if self._engine:
            self._engine.dispose()
        
        self._engine = None
        self._session_factory = None
        self._scoped_session = None
        
        logger.info("Database connection manager disposed")


# Global connection manager instance
_connection_manager = None


def get_connection_manager() -> DatabaseConnectionManager:
    """Get the global database connection manager instance"""
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = DatabaseConnectionManager()
    return _connection_manager


def dispose_connection_manager():
    """Dispose of the global connection manager"""
    global _connection_manager
    if _connection_manager:
        _connection_manager.dispose()
        _connection_manager = None
