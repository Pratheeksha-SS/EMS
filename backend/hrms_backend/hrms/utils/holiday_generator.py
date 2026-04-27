import holidays
import datetime
from ..models import Holiday
from django.utils import timezone

class IndianHolidayGenerator:
    """
    Automatically generates Indian government and festival holidays
    Uses holidays library v0.92+
    """
    
    def __init__(self):
        self.current_year = datetime.datetime.now().year
    
    def generate_holidays_for_year(self, year, created_by=None):
        """
        Generate all holidays for a specific year
        """
        generated_count = 0
        
        try:
            # Get holidays for the specific year
            ind_holidays = holidays.India(years=[year])
            
            print(f"Found {len(ind_holidays)} holidays in library for {year}")
            
            for date, name in ind_holidays.items():
                if date.year == year:  # Extra safety check
                    # Check if holiday already exists
                    holiday, created = Holiday.objects.get_or_create(
                        name=name,
                        date=date,
                        defaults={
                            'holiday_type': 'GOVT',
                            'year': year,
                            'is_auto_generated': True,
                            'description': f"Government holiday: {name}",
                            'created_by': created_by,
                            'is_active': True
                        }
                    )
                    if created:
                        generated_count += 1
                        print(f"  Added: {name} on {date}")
                    else:
                        print(f"  Already exists: {name} on {date}")
            
        except Exception as e:
            print(f"Error generating holidays: {e}")
            import traceback
            traceback.print_exc()
        
        return generated_count
    
    def generate_holidays_range(self, start_year, end_year, created_by=None):
        """
        Generate holidays for a range of years
        """
        results = {}
        for year in range(start_year, end_year + 1):
            print(f"\n📅 Generating for {year}...")
            count = self.generate_holidays_for_year(year, created_by)
            results[year] = count
            print(f"✅ Generated {count} holidays for {year}")
        return results