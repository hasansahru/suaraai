import os
import re

file_path = r'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace classes
content = content.replace('glass-card', 'azure-card')
content = content.replace('glass-panel', 'azure-card')
content = content.replace('card-lift-modern', '')

# Replace violet/purple colors with Azure blue
replacements = {
    'text-violet-400': 'text-blue-400',
    'text-violet-500': 'text-blue-500',
    'text-violet-600': 'text-blue-600',
    'text-violet-300': 'text-blue-300',
    'bg-violet-600/10': 'bg-blue-600/10',
    'bg-violet-600/20': 'bg-blue-600/20',
    'bg-violet-500/10': 'bg-blue-500/10',
    'bg-violet-500/20': 'bg-blue-500/20',
    'bg-violet-500/5': 'bg-blue-500/5',
    'bg-violet-600': 'bg-blue-600',
    'hover:bg-violet-550': 'hover:bg-blue-500',
    'border-violet-500/50': 'border-blue-500/50',
    'border-violet-500/40': 'border-blue-500/40',
    'border-violet-500/30': 'border-blue-500/30',
    'border-violet-500/25': 'border-blue-500/25',
    'border-violet-500/20': 'border-blue-500/20',
    'border-violet-500/15': 'border-blue-500/15',
    'border-violet-500/10': 'border-blue-500/10',
    'ring-violet-500/20': 'ring-blue-500/20',
    'ring-violet-500/10': 'ring-blue-500/10',
    'accent-violet-600': 'accent-blue-600',
    'ring-1 ring-blue-500/20': 'ring-1 ring-blue-500/20',
    
    # Replace remaining indigo references with sky-blue
    'text-indigo-400': 'text-sky-400',
    'text-indigo-300': 'text-sky-300',
    'text-indigo-500': 'text-sky-500',
    'text-indigo-600': 'text-sky-600',
    'bg-indigo-600/10': 'bg-sky-600/10',
    'bg-indigo-500/10': 'bg-sky-500/10',
    'bg-indigo-500/20': 'bg-sky-500/20',
    'bg-indigo-500/5': 'bg-sky-500/5',
    'bg-indigo-500/15': 'bg-sky-500/15',
    'border-indigo-500/50': 'border-sky-500/50',
    'border-indigo-500/30': 'border-sky-500/30',
    'border-indigo-500/20': 'border-sky-500/20',
    'border-indigo-500/15': 'border-sky-500/15',
    'border-indigo-500/10': 'border-sky-500/10',
    'ring-indigo-500/10': 'ring-sky-500/10',
    'via-indigo-600': 'via-blue-500',
    'via-indigo-500': 'via-blue-500',
    'from-violet-600': 'from-blue-600',
    'from-violet-500': 'from-blue-500',
    'to-violet-600': 'to-blue-600',
    'to-violet-500': 'to-blue-500',
    'from-indigo-400': 'from-sky-400',
    'via-purple-400': 'via-blue-400',
    'to-pink-400': 'to-cyan-400',

    # Replace purple background blobs
    'bg-violet-600/20': 'bg-blue-500/15',
    'bg-indigo-500/20': 'bg-sky-500/15',
    'bg-purple-500/20': 'bg-cyan-500/10',

    # Replace pink references
    'text-pink-400': 'text-teal-400',
    'text-pink-500': 'text-teal-500',

    # Replace drop-shadow violet/indigo with blue
    'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]': 'drop-shadow-[0_0_8px_rgba(0,120,212,0.5)]',
    'drop-shadow-[0_0_4px_rgba(99,102,241,0.5)]': 'drop-shadow-[0_0_4px_rgba(0,120,212,0.4)]',
    'drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]': 'drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]',

    # Replace shadow glow on submit btn
    'shadow-[0_0_24px_4px_rgba(124,58,237,0.35)]': 'shadow-[0_0_24px_4px_rgba(0,120,212,0.3)]',
    'shadow-[0_0_10px_rgba(139,92,246,0.2)]': 'shadow-[0_0_10px_rgba(0,120,212,0.2)]',

    # Replace focus:border-violet
    'focus:border-violet-500/60': 'focus:border-blue-500/60',
    'focus:ring-violet-500/20': 'focus:ring-blue-500/20',

    # Update hover:text-violet
    'hover:text-violet-400': 'hover:text-blue-400',
    'group-hover:text-violet-400': 'group-hover:text-blue-400',

    # Update slider roles
    '[&_[role=slider]]:bg-violet-500': '[&_[role=slider]]:bg-blue-500',
    '[&_[role=slider]]:border-violet-400': '[&_[role=slider]]:border-blue-400',
    '[&_[role=slider]]:bg-pink-500': '[&_[role=slider]]:bg-teal-500',
    '[&_[role=slider]]:border-pink-400': '[&_[role=slider]]:border-teal-400',

    # Replace hover:bg-violet/50 on backgrounds
    'hover:bg-zinc-800/40': 'hover:bg-blue-500/5',

    # Replace violet gradient in video panjang section
    'from-violet-500/10 to-indigo-500/5': 'from-blue-500/10 to-sky-500/5'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete.")
