import sys

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

# Find results section
results_start = content.find('{/* Result Showcase */}')
if results_start == -1:
    print("Cannot find results section.")
    sys.exit(1)

# We find the END of the Results section by finding the closing </div> of the main flex box?
# Actually, we can just replace everything from <Tabs defaultValue="ringkasan" up to </Tabs>
tabs_start = content.find('<Tabs defaultValue="ringkasan"', results_start)
tabs_end = content.find('</Tabs>', tabs_start)
if tabs_start == -1 or tabs_end == -1:
    print("Cannot find tabs.")
    sys.exit(1)
tabs_end += len('</Tabs>')

results_block = content[tabs_start:tabs_end]

# Extract blocks from ringkasan tab
struktur_start = results_block.find('<div className="flex items-center justify-between border-b border-border/40 pb-4">')
rekomendasi_upload_start = results_block.find('{/* Rekomendasi Upload Terintegrasi */}')
web_sources_start = results_block.find('{/* Display citations if web search was enabled */}')

segmen_tab_start = results_block.find('<TabsContent value="segmen">')

ringkasan_struktur = results_block[struktur_start:rekomendasi_upload_start]
rekomendasi_upload = results_block[rekomendasi_upload_start:web_sources_start]
web_sources = results_block[web_sources_start:segmen_tab_start].replace('</TabsContent>', '')

ide_judul_start = results_block.find('{/* Ide Judul & Thumbnail Clickbait */}', segmen_tab_start)
seo_start = results_block.find('{/* Referensi Tag & SEO */}', ide_judul_start)
outline_start = results_block.find('{/* Outline (Video Panjang) */}', seo_start)
if outline_start == -1: 
    outline_start = results_block.find('{/* Script / Segmen Editor */}', seo_start)
json_tab_start = results_block.find('<TabsContent value="raw_json">', outline_start)

judul_block = results_block[ide_judul_start:seo_start]
seo_block = results_block[seo_start:outline_start]
skrip_block = results_block[outline_start:json_tab_start].replace('</TabsContent>', '')

json_block_content = results_block[json_tab_start:results_block.rfind('</Tabs>')]

new_tabs = """<Tabs defaultValue="ringkasan" className="flex flex-col lg:flex-row gap-6 w-full">
                
                {/* Sidebar Navigation */}
                <div className="lg:w-64 shrink-0">
                  <TabsList className="flex lg:flex-col h-auto bg-transparent p-0 w-full rounded-none border-none gap-2 justify-start items-start overflow-x-auto lg:overflow-visible">
                    <TabsTrigger value="ringkasan" className="w-full justify-start text-xs md:text-sm py-3 px-4 rounded-xl text-muted-foreground/70 data-[state=active]:bg-muted/30 data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent font-semibold transition-all">
                      🔍 Ringkasan Inti
                    </TabsTrigger>
                    <TabsTrigger value="jadwal" className="w-full justify-start text-xs md:text-sm py-3 px-4 rounded-xl text-muted-foreground/70 data-[state=active]:bg-muted/30 data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent font-semibold transition-all">
                      📅 Jadwal & Upload
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="w-full justify-start text-xs md:text-sm py-3 px-4 rounded-xl text-muted-foreground/70 data-[state=active]:bg-muted/30 data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent font-semibold transition-all">
                      🎨 Judul & SEO
                    </TabsTrigger>
                    <TabsTrigger value="skrip" className="w-full justify-start text-xs md:text-sm py-3 px-4 rounded-xl text-muted-foreground/70 data-[state=active]:bg-muted/30 data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent font-semibold transition-all">
                      📝 Skrip & Outline
                    </TabsTrigger>
                    <TabsTrigger value="raw_json" className="w-full justify-start text-xs md:text-sm py-3 px-4 rounded-xl text-muted-foreground/70 data-[state=active]:bg-muted/30 data-[state=active]:text-foreground data-[state=active]:border-border/60 border border-transparent font-semibold transition-all">
                      📄 JSON Metadata
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-6">
                  
                  {/* Tab: Ringkasan Inti */}
                  <TabsContent value="ringkasan" className="mt-0 outline-none">
                    <div className="azure-card space-y-6">
                      """ + ringkasan_struktur + web_sources + """
                    </div>
                  </TabsContent>

                  {/* Tab: Jadwal Upload */}
                  <TabsContent value="jadwal" className="mt-0 outline-none">
                    <div className="azure-card space-y-6 p-6">
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-foreground">Strategi Distribusi</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Waktu terbaik mempublikasikan konten ini.</p>
                        </div>
                      </div>
                      """ + rekomendasi_upload.replace('pt-6 border-t border-border/40', '') + """
                    </div>
                  </TabsContent>

                  {/* Tab: Judul & SEO */}
                  <TabsContent value="seo" className="mt-0 outline-none">
                    <div className="azure-card space-y-6 p-6">
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-foreground">Packaging & Discovery</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Ide Thumbnail, Judul, dan Optimasi Mesin Pencari.</p>
                        </div>
                      </div>
                      """ + judul_block.replace('border-b border-border/40 pb-6', 'pb-2') + seo_block + """
                    </div>
                  </TabsContent>

                  {/* Tab: Skrip & Outline */}
                  <TabsContent value="skrip" className="mt-0 outline-none">
                    <div className="azure-card space-y-6 p-6">
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                        <div>
                          <h3 className="text-base font-bold text-foreground">Produksi Konten</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Alur cerita, kerangka, atau naskah siap baca.</p>
                        </div>
                      </div>
                      """ + skrip_block + """
                    </div>
                  </TabsContent>

                  {/* Tab: JSON Metadata */}
                  """ + json_block_content + """
                </div>
              </Tabs>"""

final_content = content[:tabs_start] + new_tabs + content[tabs_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Refactor results success. Final length: {len(final_content)}")
