import sys
file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

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

print('ai:', len(ai_config_block), 'target:', len(target_channel_block), 'format:', len(format_output_block), 'reasoning:', len(reasoning_block), 'proxy:', len(proxy_block), 'history:', len(history_block))
