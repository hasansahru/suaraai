import sys
import re

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

tabs_start = content.find('<Tabs defaultValue="ringkasan"')
tabs_end = content.find('</Tabs>', tabs_start)
if tabs_start == -1 or tabs_end == -1:
    print("Cannot find Tabs section.")
    sys.exit(1)

results_block = content[tabs_start:tabs_end]

# 1. Ringkasan
struktur_start = results_block.find('<TabsContent value="ringkasan">')
struktur_start = results_block.find('<div className="azure-card space-y-6">', struktur_start) + len('<div className="azure-card space-y-6">')

rekomendasi_upload_start = results_block.find('{/* Rekomendasi Upload Terintegrasi */}')
web_sources_start = results_block.find('{/* Display citations if web search was enabled */}')
segmen_tab_start = results_block.find('<TabsContent value="segmen"')

ringkasan_struktur = results_block[struktur_start:rekomendasi_upload_start]
rekomendasi_upload = results_block[rekomendasi_upload_start:web_sources_start]
web_sources = results_block[web_sources_start:segmen_tab_start]
web_sources = re.sub(r'</TabsContent>\s*$', '', web_sources) # strip closing tab

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
skrip_block = re.sub(r'</TabsContent>\s*$', '', skrip_block)

# 3. JSON
json_block_content = results_block[json_tab_start:]

new_tabs = """<Tabs defaultValue="ringkasan" className="flex flex-col lg:flex-row gap-6 w-full items-start">
                
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 z-10">
                  <TabsList className="flex flex-row lg:flex-col h-auto bg-card border border-border p-2 w-full rounded-2xl shadow-sm gap-1.5 overflow-x-auto lg:overflow-visible">
                    <TabsTrigger value="ringkasan" className="w-full justify-start text-[11px] md:text-xs py-2.5 px-3 rounded-xl text-muted-foreground/80 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold border border-transparent font-medium transition-all whitespace-nowrap">
                      🔍 Ringkasan Inti
                    </TabsTrigger>
                    <TabsTrigger value="jadwal" className="w-full justify-start text-[11px] md:text-xs py-2.5 px-3 rounded-xl text-muted-foreground/80 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold border border-transparent font-medium transition-all whitespace-nowrap">
                      📅 Jadwal & Upload
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="w-full justify-start text-[11px] md:text-xs py-2.5 px-3 rounded-xl text-muted-foreground/80 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold border border-transparent font-medium transition-all whitespace-nowrap">
                      🎨 Judul & SEO
                    </TabsTrigger>
                    <TabsTrigger value="skrip" className="w-full justify-start text-[11px] md:text-xs py-2.5 px-3 rounded-xl text-muted-foreground/80 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold border border-transparent font-medium transition-all whitespace-nowrap">
                      📝 Skrip & Outline
                    </TabsTrigger>
                    <TabsTrigger value="raw_json" className="w-full justify-start text-[11px] md:text-xs py-2.5 px-3 rounded-xl text-muted-foreground/80 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-bold border border-transparent font-medium transition-all whitespace-nowrap">
                      📄 JSON Metadata
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 w-full space-y-6">
                  
                  {/* Tab: Ringkasan Inti */}
                  <TabsContent value="ringkasan" className="mt-0 outline-none w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="azure-card p-6 rounded-3xl space-y-6 w-full">
                      """ + ringkasan_struktur + web_sources + """
                    </div>
                  </TabsContent>

                  {/* Tab: Jadwal Upload */}
                  <TabsContent value="jadwal" className="mt-0 outline-none w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="azure-card p-6 rounded-3xl space-y-6 w-full">
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
                  <TabsContent value="seo" className="mt-0 outline-none w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="azure-card p-6 rounded-3xl space-y-6 w-full">
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
                  <TabsContent value="skrip" className="mt-0 outline-none w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="azure-card p-6 rounded-3xl space-y-6 w-full">
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
"""

final_content = content[:tabs_start] + new_tabs + content[tabs_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Refactor results success. Final length: {len(final_content)}")
