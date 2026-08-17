import os
import sys

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
import_idx = content.find('import { Tabs, TabsContent')
if 'import { Dialog' not in content:
    imports = """import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
"""
    content = content[:import_idx] + imports + content[import_idx:]

# 2. State
state_idx = content.find('const [theme, setTheme] = useState')
if 'const [isSettingsOpen' not in content:
    states = """const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  """
    content = content[:state_idx] + states + content[state_idx:]

# 3. Header buttons
header_buttons_str = """<div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">"""
new_header_buttons = """<div className="flex items-center gap-3">
              <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/50 bg-background/50 hover:bg-accent/50 backdrop-blur-sm transition-all shrink-0 hover:scale-105 active:scale-95 text-blue-500" title="Pengaturan AI">
                <Settings className="size-4" />
              </Button>
              <Button onClick={() => setIsHistoryOpen(true)} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/50 bg-background/50 hover:bg-accent/50 backdrop-blur-sm transition-all shrink-0 hover:scale-105 active:scale-95 text-sky-500" title="Riwayat">
                <History className="size-4" />
              </Button>
              <span className="flex h-2 w-2 relative ml-2">"""
content = content.replace(header_buttons_str, new_header_buttons)

# 4. Extract blocks
old_main_start = content.find('{/* Main Container */}')
main_end_idx = content.find('</main>', old_main_start)
main_block = content[old_main_start:main_end_idx]

ai_config_start = main_block.find('<div className="azure-card rounded-2xl p-6 ">')
target_channel_start = main_block.find('{/* 🎭 Target Channel & Analytics */}', ai_config_start)
ai_config_block = main_block[ai_config_start:target_channel_start]

target_channel_end = main_block.find('{/* Format Output & Durasi */}', target_channel_start)
target_channel_block = main_block[target_channel_start:target_channel_end]

format_output_end = main_block.find('{/* Claude Beta / Reasoning Skills Expander */}', target_channel_end)
format_output_block = main_block[target_channel_end:format_output_end]

reasoning_end = main_block.find('{/* YouTube Proxy Configuration */}', format_output_end)
reasoning_block = main_block[format_output_end:reasoning_end]

proxy_end = main_block.find('{/* Riwayat Analisis Card */}', reasoning_end)
proxy_block = main_block[reasoning_end:proxy_end]

history_end = main_block.find('</section>', proxy_end)
history_block = main_block[proxy_end:history_end]

input_form_start = main_block.find('{/* Main Input Form */}')
extra_notes_start = main_block.find('{/* Extra Notes */}', input_form_start)
input_part1 = main_block[input_form_start:extra_notes_start]

input_part1 = input_part1.replace('<div className="azure-card relative">', '')
input_part1 = input_part1.replace('<div className="flex items-center gap-2 mb-1">', '<div className="hidden">')

submit_start = main_block.find('{/* Submit Button */}')
keyword_block = main_block[extra_notes_start:submit_start]

loading_start = main_block.find('{/* Loading Skeleton */}', submit_start)
submit_block = main_block[submit_start:loading_start]

# </div> cleanup for submit_block
idx1 = submit_block.rfind('</div>')
if idx1 != -1: submit_block = submit_block[:idx1]
idx2 = submit_block.rfind('</div>')
if idx2 != -1: submit_block = submit_block[:idx2]

results_part = main_block[loading_start:]
results_part = results_part.replace('</section>', '')

dialog_content = """
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="size-5 text-blue-500" /> Konfigurasi AI & Proxy</DialogTitle>
            <DialogDescription>Atur preferensi API, model reasoning, dan proxy di sini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            """ + ai_config_block + reasoning_block + proxy_block + """
          </div>
        </DialogContent>
      </Dialog>
"""

sheet_content = """
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-card border-l-border/40 p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-border/40 bg-background/50">
            <SheetTitle className="flex items-center gap-2 text-blue-400"><History className="size-5" /> Riwayat Analisis</SheetTitle>
            <SheetDescription>Akses cepat ke analisis yang pernah dilakukan.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            """ + history_block + """
          </div>
        </SheetContent>
      </Sheet>
"""

new_main_start = """
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col gap-10 relative z-10">
"""

new_input_bar = """
        <div className="w-full relative bg-background/60 backdrop-blur-xl border border-blue-500/20 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,120,212,0.1)] flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6">
             <div className="text-center space-y-2 mb-6">
               <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Apa yang ingin Anda analisis hari ini?</h2>
               <p className="text-sm text-muted-foreground">Tempel URL video YouTube untuk diekstrak menjadi strategi konten kelas atas.</p>
             </div>
             """ + input_part1 + keyword_block + """
             </div>
          </div>
        </div>
"""

new_bento_grid = """
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="h-full">
            """ + target_channel_block + """
          </div>
          <div className="h-full">
            """ + format_output_block + """
          </div>
        </div>
"""

new_submit_bar = """
        <div className="w-full max-w-md mx-auto mt-4">
          """ + submit_block + """
        </div>
"""

assembled_main = dialog_content + sheet_content + new_main_start + new_input_bar + new_bento_grid + new_submit_bar + results_part + "\n      </main>"

final_content = content[:old_main_start] + assembled_main + content[main_end_idx + 7:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"final length: {len(final_content)}")
