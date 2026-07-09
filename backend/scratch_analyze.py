import csv
from datetime import datetime
import collections

DAYS_EN_TO_ID = {
    'Monday': 'Senin',
    'Tuesday': 'Selasa',
    'Wednesday': 'Rabu',
    'Thursday': 'Kamis',
    'Friday': 'Jumat',
    'Saturday': 'Sabtu',
    'Sunday': 'Minggu'
}

def clean_float(val):
    if not val:
        return 0.0
    return float(val.replace('.', '').replace(',', '.'))

def analyze_csv(filepath):
    day_data = collections.defaultdict(lambda: {
        'views': [], 'watch_time': [], 'rev': [], 'ctr': [], 'impressions': []
    })
    
    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pub_time_str = row.get('Video publish time')
            if not pub_time_str:
                continue
            
            try:
                dt = datetime.strptime(pub_time_str, "%b %d, %y" if "," not in pub_time_str else "%b %d, %Y")
            except Exception:
                try:
                    dt = datetime.strptime(pub_time_str, "%Y-%m-%d")
                except Exception:
                    continue
            
            day_name = DAYS_EN_TO_ID[dt.strftime("%A")]
            
            views = int(row.get('Views') or 0)
            watch_time = clean_float(row.get('Watch time (hours)'))
            rev = clean_float(row.get('Estimated revenue (IDR)'))
            ctr = clean_float(row.get('Impressions click-through rate (%)'))
            impressions = int(row.get('Impressions') or 0)
            
            day_data[day_name]['views'].append(views)
            day_data[day_name]['watch_time'].append(watch_time)
            day_data[day_name]['rev'].append(rev)
            day_data[day_name]['ctr'].append(ctr)
            day_data[day_name]['impressions'].append(impressions)

    print(f"{'Hari':<10} | {'Video':<5} | {'Avg Views':<10} | {'Avg Watch':<10} | {'Avg CTR (%)':<11} | {'Avg Revenue':<12}")
    print("-" * 75)
    for day in ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']:
        d = day_data[day]
        count = len(d['views'])
        if count > 0:
            avg_views = sum(d['views']) / count
            avg_watch = sum(d['watch_time']) / count
            avg_ctr = sum(d['ctr']) / count
            avg_rev = sum(d['rev']) / count
            print(f"{day:<10} | {count:<5} | {avg_views:<10.1f} | {avg_watch:<10.1f} | {avg_ctr:<11.2f} | Rp {avg_rev:<10.0f}")
        else:
            print(f"{day:<10} | 0     | 0          | 0          | 0.00        | Rp 0")

analyze_csv("Suara Filsuf -  28 Hari.csv")
