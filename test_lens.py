import sys
file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
with open(file_path, 'r', encoding='utf-8') as f: content = f.read()

old_main_start = content.find('{/* Main Container */}')
main_end_idx = content.find('</main>', old_main_start)
main_block = content[old_main_start:main_end_idx]

print('main_block len:', len(main_block))

submit_start = main_block.find('{/* Submit Button */}')
loading_start = main_block.find('{/* Loading Skeleton */}', submit_start)
submit_block = main_block[submit_start:loading_start]
print('submit_start:', submit_start, 'loading_start:', loading_start)
print('submit_block len:', len(submit_block))

results_part = main_block[loading_start:]
print('results_part len:', len(results_part))
