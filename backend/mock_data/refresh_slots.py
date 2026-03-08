"""
Utility script to refresh/add available slots for all chargers.
Run this whenever you need to ensure all stations have available slots.
Creates 6 slots per charger starting from the next hour.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from models.charger import Charger
from models.slot import Slot
from datetime import datetime, timedelta
import uuid


def refresh_slots(min_slots_per_charger: int = 6):
    """
    Ensure each charger has at least `min_slots_per_charger` available future slots.
    """
    db = SessionLocal()
    
    try:
        now = datetime.now()
        next_hour = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        
        chargers = db.query(Charger).all()
        total_created = 0
        
        print(f"Found {len(chargers)} charger(s)")
        
        for charger in chargers:
            # Count existing future available slots
            existing_future_slots = db.query(Slot).filter(
                Slot.charger_id == charger.id,
                Slot.start_time >= now,
                Slot.is_available == True
            ).count()
            
            slots_needed = max(0, min_slots_per_charger - existing_future_slots)
            
            if slots_needed > 0:
                print(f"  Charger {charger.id[:8]}... has {existing_future_slots} future slots, adding {slots_needed} more")
                
                # Find the latest slot end time to start from there
                latest_slot = db.query(Slot).filter(
                    Slot.charger_id == charger.id
                ).order_by(Slot.end_time.desc()).first()
                
                if latest_slot and latest_slot.end_time > next_hour:
                    start_from = latest_slot.end_time
                else:
                    start_from = next_hour
                
                for i in range(slots_needed):
                    start = start_from + timedelta(hours=i)
                    end = start + timedelta(hours=1)
                    
                    # Check if slot already exists
                    existing = db.query(Slot).filter(
                        Slot.charger_id == charger.id,
                        Slot.start_time == start
                    ).first()
                    
                    if not existing:
                        slot = Slot(
                            id=str(uuid.uuid4()),
                            charger_id=charger.id,
                            start_time=start,
                            end_time=end,
                            is_available=True
                        )
                        db.add(slot)
                        total_created += 1
            else:
                print(f"  Charger {charger.id[:8]}... already has {existing_future_slots} future slots ✓")
        
        db.commit()
        print(f"\n✅ Created {total_created} new slot(s)")
        
        # Summary
        total_available = db.query(Slot).filter(
            Slot.start_time >= now,
            Slot.is_available == True
        ).count()
        print(f"Total available future slots across all chargers: {total_available}")
        
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("EVORA Slot Refresh Utility")
    print("=" * 50)
    refresh_slots(min_slots_per_charger=6)
