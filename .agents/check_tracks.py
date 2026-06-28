import re
with open('dist/animation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the const D= data
match = re.search(r'const\s+D\s*=\s*({.*?});', content, re.DOTALL)
if match:
    data = match.group(1)
    # Look for wrapper tracks
    wrappers = ['1:4796:@root/list[0]/frame[0]/frame[0]/badge-text[0]/frame[0]', '1:4796:@root/list[0]/frame[4]/frame[0]/badge-text[0]/frame[0]']
    for wid in wrappers:
        escaped = re.escape(wid)
        pattern = r'"id":"' + escaped + r'".*?"transforms":(\[\[.*?\]\]).*?"rotations":(\[.*?\])'
        m = re.search(pattern, data, re.DOTALL)
        if m:
            print(f'ID: {wid}')
            print(f'  transforms: {m.group(1)}')
            print(f'  rotations: {m.group(2)}')
        else:
            print(f'ID: {wid} - NOT FOUND')
else:
    print('Could not find const D= data')
