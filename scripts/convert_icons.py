from cairosvg import svg2png
import os

def convert_svg_to_png(svg_path, png_path):
    if not os.path.exists('assets'):
        os.makedirs('assets')
    
    with open(svg_path, 'r') as f:
        svg_content = f.read()
    
    svg2png(bytestring=svg_content,
            write_to=png_path,
            output_width=16,
            output_height=16)

# 转换正常状态图标
convert_svg_to_png('assets/tray-icon.svg', 'assets/tray-icon.png')

# 转换告警状态图标
convert_svg_to_png('assets/tray-icon-active.svg', 'assets/tray-icon-active.png')

# 转换新告警已确认状态图标
convert_svg_to_png('assets/tray-icon-all-ack.svg', 'assets/tray-icon-all-ack.png')

print("Icons converted successfully!") 