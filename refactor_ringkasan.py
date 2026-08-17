import sys

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

# Target Ringkasan block only
start_idx = content.find('<TabsContent value="ringkasan">')
end_idx = content.find('</TabsContent>', start_idx) + len('</TabsContent>')

if start_idx == -1 or end_idx == -1:
    print("Cannot find ringkasan block.")
    sys.exit(1)

ring_block = content[start_idx:end_idx]

# 1. Split into Struktur, Upload, Web
upload_start = ring_block.find('{/* Rekomendasi Upload Terintegrasi */}')
web_start = ring_block.find('{/* Display citations if web search was enabled */}')

if upload_start == -1:
    print("Cannot find upload block.")
    sys.exit(1)

struktur_block = ring_block[:upload_start]
# We must replace the `<div className="azure-card space-y-6">` at the top of struktur_block.
struktur_block = struktur_block.replace('<TabsContent value="ringkasan">\n                  <div className="azure-card space-y-6">', '')
# If not exactly formatted like that, we can use regex, or just:
struktur_block = struktur_block.replace('<TabsContent value="ringkasan">', '')
struktur_block = struktur_block.replace('<div className="azure-card space-y-6">', '<div className="space-y-6">', 1)

upload_block = ring_block[upload_start:web_start if web_start != -1 else end_idx-len('</TabsContent>')]
if web_start != -1:
    web_block = ring_block[web_start:end_idx-len('</TabsContent>')]
else:
    web_block = ""

# Rebuild it into a split grid layout!
new_ring_block = """<TabsContent value="ringkasan">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column (Struktur) */}
                    <div className="lg:col-span-7 azure-card p-6 rounded-3xl h-full space-y-6">
""" + struktur_block + """
                    </div>

                    {/* Right Column (Distribusi & Riset) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      <div className="azure-card p-6 rounded-3xl space-y-6">
""" + upload_block.replace('pt-6 border-t border-border/40 space-y-4', 'space-y-4') + """
                      </div>
                      
                      """ + (("<div className=\"azure-card p-6 rounded-3xl\">\n" + web_block.replace('pt-6 border-t border-border/40', '') + "\n</div>") if web_block.strip() else "") + """
                    </div>

                  </div>
                </TabsContent>"""

final_content = content[:start_idx] + new_ring_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Refactor ringkasan success. Final length: {len(final_content)}")
