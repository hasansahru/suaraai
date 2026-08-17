import pandas as pd
import codecs

df = pd.read_csv('Nalar Senyap - Data tabel.csv')
df = df.dropna(subset=['Video title'])

tutur_mask = df['Video title'].str.contains('santrikyai|gus|kyai|habaib|habib|ustadz|ulama', case=False, na=False)
df_tutur = df[tutur_mask]
df_nalar = df[~tutur_mask]

def analyze(d):
    if len(d) == 0: return 'No data'
    d = d.copy()
    d['Views'] = pd.to_numeric(d['Views'], errors='coerce').fillna(0)
    d['Impressions click-through rate (%)'] = pd.to_numeric(d['Impressions click-through rate (%)'], errors='coerce').fillna(0)
    
    top_views = d.sort_values('Views', ascending=False).head(5)[['Video title', 'Views', 'Impressions click-through rate (%)']]
    
    res = f'Total videos: {len(d)}\n'
    res += 'Top 5 by Views:\n'
    for _, r in top_views.iterrows():
        res += f"  - {r['Video title']} (Views: {r['Views']}, CTR: {r['Impressions click-through rate (%)']}%)\n"
    return res

out = '=== NALAR SENYAP ===\n' + analyze(df_nalar) + '\n=== TUTUR KYAI ===\n' + analyze(df_tutur)
with codecs.open('analysis_result.txt', 'w', 'utf-8') as f:
    f.write(out)
