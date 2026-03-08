"""
Migration script to add new columns to the bookings table for emergency/walk-in booking support.
Run this script once to update the database schema.
"""

import os
import sqlite3
import sys

# Get the database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "lax_ev_stations.db")


def get_existing_columns(cursor, table_name):
    """Get list of existing columns in a table."""
    cursor.execute(f"PRAGMA table_info({table_name})")
    return [row[1] for row in cursor.fetchall()]


def add_column_if_not_exists(cursor, table_name, column_name, column_type, default=None):
    """Add a column to a table if it doesn't already exist."""
    existing_columns = get_existing_columns(cursor, table_name)
    
    if column_name not in existing_columns:
        default_clause = ""
        if default is not None:
            if isinstance(default, str):
                default_clause = f" DEFAULT '{default}'"
            elif isinstance(default, bool):
                default_clause = f" DEFAULT {1 if default else 0}"
            else:
                default_clause = f" DEFAULT {default}"
        
        sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}{default_clause}"
        print(f"  Adding column: {column_name} ({column_type})")
        cursor.execute(sql)
        return True
    else:
        print(f"  Column already exists: {column_name}")
        return False


def run_migration():
    """Run the migration to add new booking columns."""
    print(f"Database path: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print("Database file not found. Creating tables on first startup will include new columns.")
        return
    
    print("\nConnecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("\nMigrating 'bookings' table...")
        
        # Check if bookings table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'")
        if not cursor.fetchone():
            print("  'bookings' table does not exist yet. New columns will be created with the table.")
            return
        
        # Add new columns for emergency/walk-in booking support
        columns_to_add = [
            ("booking_type", "VARCHAR(20)", "standard"),
            ("vehicle_number", "VARCHAR(30)", None),
            ("customer_name", "VARCHAR(100)", None),
            ("customer_phone", "VARCHAR(20)", None),
            ("arrival_confirmed", "BOOLEAN", False),
            ("charging_started", "BOOLEAN", False),
            ("notes", "TEXT", None),
        ]
        
        added_count = 0
        for column_name, column_type, default in columns_to_add:
            if add_column_if_not_exists(cursor, "bookings", column_name, column_type, default):
                added_count += 1
        
        conn.commit()
        print(f"\nMigration complete! {added_count} column(s) added.")
        
    except Exception as e:
        print(f"\nError during migration: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 50)
    print("EVORA Database Migration")
    print("Adding columns for Emergency/Walk-In Booking Feature")
    print("=" * 50)
    run_migration()
