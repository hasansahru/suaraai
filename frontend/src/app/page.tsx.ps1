$file = 'c:\Users\Filsuf\.antigravity-ide\ai-suara-modern\frontend\src\app\page.tsx'
$c = Get-Content $file -Raw

# Replace violet/purple colors with Azure blue
$c = $c -replace 'text-violet-400', 'text-blue-400'
$c = $c -replace 'text-violet-500', 'text-blue-500'
$c = $c -replace 'text-violet-600', 'text-blue-600'
$c = $c -replace 'text-violet-300', 'text-blue-300'
$c = $c -replace 'bg-violet-600/10', 'bg-blue-600/10'
$c = $c -replace 'bg-violet-600/20', 'bg-blue-600/20'
$c = $c -replace 'bg-violet-500/10', 'bg-blue-500/10'
$c = $c -replace 'bg-violet-500/20', 'bg-blue-500/20'
$c = $c -replace 'bg-violet-500/5', 'bg-blue-500/5'
$c = $c -replace 'bg-violet-600', 'bg-blue-600'
$c = $c -replace 'hover:bg-violet-550', 'hover:bg-blue-500'
$c = $c -replace 'border-violet-500/50', 'border-blue-500/50'
$c = $c -replace 'border-violet-500/40', 'border-blue-500/40'
$c = $c -replace 'border-violet-500/30', 'border-blue-500/30'
$c = $c -replace 'border-violet-500/25', 'border-blue-500/25'
$c = $c -replace 'border-violet-500/20', 'border-blue-500/20'
$c = $c -replace 'border-violet-500/15', 'border-blue-500/15'
$c = $c -replace 'border-violet-500/10', 'border-blue-500/10'
$c = $c -replace 'ring-violet-500/20', 'ring-blue-500/20'
$c = $c -replace 'ring-violet-500/10', 'ring-blue-500/10'
$c = $c -replace 'accent-violet-600', 'accent-blue-600'
$c = $c -replace 'ring-1 ring-blue-500/20', 'ring-1 ring-blue-500/20'

# Replace remaining indigo references with sky-blue
$c = $c -replace 'text-indigo-400', 'text-sky-400'
$c = $c -replace 'text-indigo-300', 'text-sky-300'
$c = $c -replace 'text-indigo-500', 'text-sky-500'
$c = $c -replace 'text-indigo-600', 'text-sky-600'
$c = $c -replace 'bg-indigo-600/10', 'bg-sky-600/10'
$c = $c -replace 'bg-indigo-500/10', 'bg-sky-500/10'
$c = $c -replace 'bg-indigo-500/20', 'bg-sky-500/20'
$c = $c -replace 'bg-indigo-500/5', 'bg-sky-500/5'
$c = $c -replace 'bg-indigo-500/15', 'bg-sky-500/15'
$c = $c -replace 'border-indigo-500/50', 'border-sky-500/50'
$c = $c -replace 'border-indigo-500/30', 'border-sky-500/30'
$c = $c -replace 'border-indigo-500/20', 'border-sky-500/20'
$c = $c -replace 'border-indigo-500/15', 'border-sky-500/15'
$c = $c -replace 'border-indigo-500/10', 'border-sky-500/10'
$c = $c -replace 'ring-indigo-500/10', 'ring-sky-500/10'
$c = $c -replace 'via-indigo-600', 'via-blue-500'
$c = $c -replace 'via-indigo-500', 'via-blue-500'
$c = $c -replace 'from-violet-600', 'from-blue-600'
$c = $c -replace 'from-violet-500', 'from-blue-500'
$c = $c -replace 'to-violet-600', 'to-blue-600'
$c = $c -replace 'to-violet-500', 'to-blue-500'
$c = $c -replace 'from-indigo-400', 'from-sky-400'
$c = $c -replace 'via-purple-400', 'via-blue-400'
$c = $c -replace 'to-pink-400', 'to-cyan-400'

# Replace purple background blobs
$c = $c -replace 'bg-violet-600/20', 'bg-blue-500/15'
$c = $c -replace 'bg-indigo-500/20', 'bg-sky-500/15'
$c = $c -replace 'bg-purple-500/20', 'bg-cyan-500/10'

# Replace pink references
$c = $c -replace 'text-pink-400', 'text-teal-400'
$c = $c -replace 'text-pink-500', 'text-teal-500'

# Replace drop-shadow violet/indigo with blue
$c = $c -replace 'drop-shadow-\[0_0_8px_rgba\(139,92,246,0\.5\)\]', 'drop-shadow-[0_0_8px_rgba(0,120,212,0.5)]'
$c = $c -replace 'drop-shadow-\[0_0_4px_rgba\(99,102,241,0\.5\)\]', 'drop-shadow-[0_0_4px_rgba(0,120,212,0.4)]'
$c = $c -replace 'drop-shadow-\[0_0_4px_rgba\(251,191,36,0\.5\)\]', 'drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'

# Replace shadow glow on submit btn
$c = $c -replace 'shadow-\[0_0_24px_4px_rgba\(124,58,237,0\.35\)\]', 'shadow-[0_0_24px_4px_rgba(0,120,212,0.3)]'
$c = $c -replace 'shadow-\[0_0_10px_rgba\(139,92,246,0\.2\)\]', 'shadow-[0_0_10px_rgba(0,120,212,0.2)]'

# Replace focus:border-violet
$c = $c -replace 'focus:border-violet-500/60', 'focus:border-blue-500/60'
$c = $c -replace 'focus:ring-violet-500/20', 'focus:ring-blue-500/20'

# Update hover:text-violet
$c = $c -replace 'hover:text-violet-400', 'hover:text-blue-400'
$c = $c -replace 'group-hover:text-violet-400', 'group-hover:text-blue-400'

# Update slider roles
$c = $c -replace '\[&_\[role=slider\]\]:bg-violet-500', '[&_[role=slider]]:bg-blue-500'
$c = $c -replace '\[&_\[role=slider\]\]:border-violet-400', '[&_[role=slider]]:border-blue-400'
$c = $c -replace '\[&_\[role=slider\]\]:bg-pink-500', '[&_[role=slider]]:bg-teal-500'
$c = $c -replace '\[&_\[role=slider\]\]:border-pink-400', '[&_[role=slider]]:border-teal-400'

# Replace hover:bg-violet/50 on backgrounds
$c = $c -replace 'hover:bg-zinc-800/40', 'hover:bg-blue-500/5'

# Replace violet gradient in video panjang section
$c = $c -replace 'from-violet-500/10 to-indigo-500/5', 'from-blue-500/10 to-sky-500/5'

Set-Content $file -Value $c -NoNewline
Write-Host "Done! All color replacements applied."
