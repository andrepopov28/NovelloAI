import re

with open('src/components/layout/AIChatbox.tsx', 'r') as f:
    content = f.read()

styles = re.findall(r'<style jsx>\{`(.*?)`\}</style>', content, re.DOTALL)

with open('src/components/layout/AIChatbox.css', 'w') as f:
    for style in styles:
        f.write(style + '\n')

# Remove the styles from the tsx file
content_no_styles = re.sub(r'\s*<style jsx>\{`.*?`\}</style>', '', content, flags=re.DOTALL)

# Add import at the top
lines = content_no_styles.split('\n')
import_idx = 0
for i, line in enumerate(lines):
    if line.startswith('import ') and 'lucide-react' in line:
        import_idx = i + 1

lines.insert(import_idx, "import './AIChatbox.css';")

with open('src/components/layout/AIChatbox.tsx', 'w') as f:
    f.write('\n'.join(lines))

print("CSS extracted and file updated.")
