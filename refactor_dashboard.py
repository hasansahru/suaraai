import sys

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

# Find the Tabs block
tabs_start = content.find('<Tabs defaultValue="ringkasan"')
tabs_end = content.find('</Tabs>', tabs_start)
if tabs_start == -1 or tabs_end == -1:
    print("Cannot find Tabs section.")
    sys.exit(1)
tabs_end += len('</Tabs>')

results_block = content[tabs_start:tabs_end]

# 1. Ringkasan
struktur_start = results_block.find('<div className="flex items-center justify-between border-b border-border/40 pb-4">')
rekomendasi_upload_start = results_block.find('{/* Rekomendasi Upload Terintegrasi */}')
web_sources_start = results_block.find('{/* Display citations if web search was enabled */}')
segmen_tab_start = results_block.find('<TabsContent value="segmen">')

ringkasan_struktur = results_block[struktur_start:rekomendasi_upload_start]
rekomendasi_upload = results_block[rekomendasi_upload_start:web_sources_start]
segmen_tab_start = results_block.find('<TabsContent value="segmen"')

web_sources = results_block[web_sources_start:segmen_tab_start]
# clean up trailing TabsContent
web_sources = web_sources.replace('</TabsContent>', '')

# 2. Segmen
ide_judul_start = results_block.find('{/* Ide Judul & Thumbnail Clickbait */}', segmen_tab_start)
seo_start = results_block.find('{/* Referensi Tag & SEO */}', ide_judul_start)
outline_start = results_block.find('{/* Script / Segmen Editor */}', seo_start)
if outline_start == -1:
    outline_start = results_block.find('Babak Outline &amp; Chapter Timeline', seo_start)
    # Walk back to the container start
    outline_start = results_block.rfind('<div', seo_start, outline_start)

json_tab_start = results_block.find('<TabsContent value="raw_json">', outline_start)

judul_block = results_block[ide_judul_start:seo_start]
seo_block = results_block[seo_start:outline_start]
skrip_block = results_block[outline_start:json_tab_start]
skrip_block = skrip_block.replace('</TabsContent>', '')

# 3. JSON
json_block_start = results_block.find('<Card', json_tab_start)
json_block_end = results_block.rfind('</Card>') + len('</Card>')
json_block = results_block[json_block_start:json_block_end]

new_dashboard = """
              {/* Hasil Analisis Dashboard Bento Grid */}
              <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                  
                  {/* Left Column: Main Content (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
                    <div className="azure-card p-6 rounded-3xl space-y-6">
                      """ + ringkasan_struktur + """
                    </div>
                    
                    <div className="azure-card p-6 rounded-3xl space-y-6">
                      """ + skrip_block + """
                    </div>

                    """ + (web_sources if "{result.web_sources" in web_sources else "") + """
                  </div>

                  {/* Right Column: SEO & Strategy (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
                    <div className="azure-card p-5 rounded-3xl space-y-5">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <h3 className="text-sm font-bold text-foreground">Strategi Distribusi</h3>
                      </div>
                      """ + rekomendasi_upload.replace('pt-6 border-t border-border/40', '') + """
                    </div>

                    <div className="azure-card p-5 rounded-3xl space-y-5">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <h3 className="text-sm font-bold text-foreground">Packaging & SEO</h3>
                      </div>
                      """ + judul_block.replace('border-b border-border/40 pb-6', 'pb-3 border-b border-border/20') + seo_block + """
                    </div>
                  </div>
                </div>

                {/* Bottom JSON Metadata */}
                <div className="w-full">
                  <div className="azure-card p-6 rounded-3xl border border-dashed border-border/60">
                    <h3 className="text-sm font-bold text-foreground mb-4">Metadata System (Developer)</h3>
                    """ + json_block + """
                  </div>
                </div>
              </div>
"""

final_content = content[:tabs_start] + new_dashboard + content[tabs_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Refactor dashboard success. Final length: {len(final_content)}")
