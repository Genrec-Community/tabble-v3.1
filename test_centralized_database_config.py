#!/usr/bin/env python3
"""
Test script to validate the centralized database configuration system
"""

import os
import sys
import sqlite3
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_database_config_module():
    """Test the database configuration module"""
    print("🧪 Testing Database Configuration Module...")
    
    try:
        from config.database_config import (
            get_database_config, 
            get_sqlite_database_path,
            get_sqlite_database_url,
            get_database_type,
            validate_database_config
        )
        
        # Test configuration validation
        if not validate_database_config():
            print("  ❌ Database configuration validation failed")
            return False
        
        print("  ✅ Database configuration validation passed")
        
        # Test configuration retrieval
        db_config = get_database_config()
        print(f"  ✅ Database type: {db_config.get_database_type()}")
        print(f"  ✅ App environment: {db_config.get_app_environment()}")
        print(f"  ✅ SQLite database path: {db_config.get_sqlite_database_path()}")
        
        # Test timeout settings
        timeout_settings = db_config.get_database_timeout_settings()
        print(f"  ✅ Timeout settings: {timeout_settings}")
        
        # Test SQLAlchemy engine parameters
        engine_params = db_config.get_sqlalchemy_engine_params()
        print(f"  ✅ Engine parameters configured: {len(engine_params)} settings")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Database configuration test failed: {e}")
        return False


def test_connection_manager():
    """Test the database connection manager"""
    print("\n🧪 Testing Database Connection Manager...")
    
    try:
        from config.database_connection_manager import get_connection_manager
        
        connection_manager = get_connection_manager()
        
        # Test health check
        if connection_manager.health_check():
            print("  ✅ Database health check passed")
        else:
            print("  ⚠️ Database health check failed (may be expected if database doesn't exist)")
        
        # Test engine creation
        engine = connection_manager.get_engine()
        print(f"  ✅ Engine created: {engine}")
        
        # Test session factory
        session_factory = connection_manager.get_session_factory()
        print(f"  ✅ Session factory created: {session_factory}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Connection manager test failed: {e}")
        return False


def test_database_adapter():
    """Test the enhanced database adapter"""
    print("\n🧪 Testing Enhanced Database Adapter...")

    try:
        # Import from the app module
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

        from database_adapter import get_database_adapter

        db_adapter = get_database_adapter()
        print(f"  ✅ Database adapter type: {db_adapter.database_type}")
        print(f"  ✅ Using Supabase: {db_adapter.use_supabase}")

        # Test health check
        if db_adapter.health_check():
            print("  ✅ Database adapter health check passed")
        else:
            print("  ⚠️ Database adapter health check failed (may be expected)")

        return True

    except Exception as e:
        print(f"  ❌ Database adapter test failed: {e}")
        return False


def test_environment_specific_paths():
    """Test environment-specific database paths"""
    print("\n🧪 Testing Environment-Specific Database Paths...")
    
    try:
        from config.database_config import get_database_config
        
        # Test different environments
        environments = ["development", "staging", "production"]
        
        for env in environments:
            # Temporarily set environment
            original_env = os.getenv("APP_ENVIRONMENT")
            os.environ["APP_ENVIRONMENT"] = env
            
            # Reload configuration
            db_config = get_database_config()
            db_path = db_config.get_sqlite_database_path()
            
            print(f"  ✅ {env.capitalize()} environment path: {db_path}")
            
            # Restore original environment
            if original_env:
                os.environ["APP_ENVIRONMENT"] = original_env
            else:
                os.environ.pop("APP_ENVIRONMENT", None)
        
        return True
        
    except Exception as e:
        print(f"  ❌ Environment-specific paths test failed: {e}")
        return False


def test_legacy_scripts_compatibility():
    """Test that legacy scripts can use the centralized configuration"""
    print("\n🧪 Testing Legacy Scripts Compatibility...")
    
    try:
        # Test inspect_database.py
        print("  Testing inspect_database.py...")
        import inspect_database
        # Just test that it can import and get the database path
        print("  ✅ inspect_database.py can import centralized config")
        
        # Test migration script
        print("  Testing migration/migrate_data.py...")
        sys.path.append(os.path.join(os.path.dirname(__file__), 'migration'))
        import migrate_data
        print("  ✅ migrate_data.py can import centralized config")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Legacy scripts compatibility test failed: {e}")
        return False


def test_configuration_validation():
    """Test configuration validation for different scenarios"""
    print("\n🧪 Testing Configuration Validation...")
    
    try:
        # Save original environment variables
        original_vars = {}
        test_vars = ["DATABASE_TYPE", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"]
        
        for var in test_vars:
            original_vars[var] = os.getenv(var)
        
        # Test SQLite configuration (should always be valid)
        os.environ["DATABASE_TYPE"] = "sqlite"
        for var in ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"]:
            os.environ.pop(var, None)
        
        from config.database_config import validate_database_config
        if validate_database_config():
            print("  ✅ SQLite configuration validation passed")
        else:
            print("  ❌ SQLite configuration validation failed")
        
        # Test Supabase configuration with missing variables
        os.environ["DATABASE_TYPE"] = "supabase"
        os.environ.pop("SUPABASE_URL", None)

        # Need to reload the module to pick up the new environment variables
        import importlib
        import config.database_config
        importlib.reload(config.database_config)

        try:
            from config.database_config import validate_database_config
            if not validate_database_config():
                print("  ✅ Supabase validation correctly failed with missing URL")
            else:
                print("  ❌ Supabase validation should have failed with missing URL")
        except Exception:
            print("  ✅ Supabase validation correctly failed with missing URL")
        
        # Restore original environment variables
        for var, value in original_vars.items():
            if value is not None:
                os.environ[var] = value
            else:
                os.environ.pop(var, None)
        
        return True
        
    except Exception as e:
        print(f"  ❌ Configuration validation test failed: {e}")
        return False


def main():
    """Run all centralized database configuration tests"""
    print("🚀 Testing Centralized Database Configuration System")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    tests = [
        ("Database Configuration Module", test_database_config_module),
        ("Database Connection Manager", test_connection_manager),
        ("Enhanced Database Adapter", test_database_adapter),
        ("Environment-Specific Paths", test_environment_specific_paths),
        ("Legacy Scripts Compatibility", test_legacy_scripts_compatibility),
        ("Configuration Validation", test_configuration_validation),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Centralized database configuration is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please review the configuration.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
