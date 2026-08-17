import sys

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

# Target Ringkasan block only
start_idx = content.find('<TabsContent value="ringkasan">')
end_idx = content.find('</TabsContent>', start_idx) + len('</TabsContent>')

ring_block = content[start_idx:end_idx]

# Remove the outer wrapper
ring_block = ring_block.replace('<TabsContent value="ringkasan">\n                  <div className="azure-card space-y-6">', '')
ring_block = ring_block.replace('\n                  </div>\n                </TabsContent>', '')

# Find sections
upload_start = ring_block.find('{/* Rekomendasi Upload Terintegrasi */}')
web_start = ring_block.find('{/* Display citations if web search was enabled */}')
tools_start = ring_block.find('{/* 9Router Features (TTS & Image) */}')

struktur_block = ring_block[:upload_start]
upload_block = ring_block[upload_start:web_start if web_start != -1 else tools_start]
web_block = ring_block[web_start:tools_start] if web_start != -1 else ""
tools_block = ring_block[tools_start:]

# Fix internal wrappers
upload_block = upload_block.replace('pt-6 border-t border-border/40 space-y-4', 'space-y-4')
web_block = web_block.replace('pt-6 border-t border-border/40', '')
tools_block = tools_block.replace('pt-6 border-t border-border/40 space-y-4', 'space-y-4')

new_ring_block = """<TabsContent value="ringkasan">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      <div className="azure-card p-6 h-full space-y-6">
""" + struktur_block + """
                      </div>
                      <div className="azure-card p-6 space-y-4">
""" + tools_block + """
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      <div className="azure-card p-6 space-y-6">
""" + upload_block + """
                      </div>
                      """ + (("<div className=\"azure-card p-6\">\n" + web_block + "\n</div>") if web_block.strip() else "") + """
                    </div>

                  </div>
                </TabsContent>"""

final_content = content[:start_idx] + new_ring_block + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Refactor ringkasan v2 success. Final length: {len(final_content)}")
