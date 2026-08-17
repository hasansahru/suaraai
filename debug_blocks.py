import sys

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

tabs_start = content.find('<Tabs defaultValue="ringkasan"')
tabs_end = content.find('</Tabs>', tabs_start) + 7
results_block = content[tabs_start:tabs_end]

s = results_block.find('<div className="flex items-center justify-between border-b border-border/40 pb-4">')
r = results_block.find('{/* Rekomendasi Upload Terintegrasi */}')
w = results_block.find('{/* Display citations if web search was enabled */}')
seg = results_block.find('<TabsContent value="segmen"')

j = results_block.find('{/* Ide Judul & Thumbnail Clickbait */}', seg)
seo = results_block.find('{/* Referensi Tag & SEO */}', j)
out1 = results_block.find('{/* Script / Segmen Editor */}', seo)
out2 = results_block.find('Babak Outline &amp; Chapter Timeline', seo)
out3 = results_block.rfind('<div', seo, out2) if out2 != -1 else -1

o = out1 if out1 != -1 else out3
json = results_block.find('<TabsContent value="raw_json">', o)

print(f"tabs_start: {tabs_start}, tabs_end: {tabs_end}")
print(f"s: {s}, r: {r}, w: {w}, seg: {seg}")
print(f"j: {j}, seo: {seo}, out1: {out1}, out2: {out2}, out3: {out3}, o: {o}, json: {json}")
