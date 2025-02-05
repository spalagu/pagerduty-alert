from cairosvg import svg2png
import os
from PIL import Image
import subprocess

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def convert_svg_to_png(svg_path, png_path, width=16, height=16):
    """转换 SVG 到指定尺寸的 PNG"""
    with open(svg_path, 'r') as f:
        svg_content = f.read()
    
    svg2png(bytestring=svg_content,
            write_to=png_path,
            output_width=width,
            output_height=height)

def create_ico(png_path, ico_path):
    """创建 Windows ICO 文件"""
    img = Image.open(png_path)
    img.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

def create_icns(png_path, icns_path):
    """创建 macOS ICNS 文件"""
    # 创建临时图标集目录
    iconset_path = os.path.splitext(icns_path)[0] + '.iconset'
    ensure_dir(iconset_path)

    # 需要的尺寸列表
    sizes = [
        (16, '16x16'),
        (32, '16x16@2x'),
        (32, '32x32'),
        (64, '32x32@2x'),
        (128, '128x128'),
        (256, '128x128@2x'),
        (256, '256x256'),
        (512, '256x256@2x'),
        (512, '512x512'),
        (1024, '512x512@2x')
    ]

    # 生成各种尺寸的图片
    img = Image.open(png_path)
    for size, name in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(iconset_path, f'icon_{name}.png'))

    # 使用 iconutil 转换为 icns（仅在 macOS 上可用）
    if os.path.exists('/usr/bin/iconutil'):
        subprocess.run(['iconutil', '-c', 'icns', iconset_path])
    
    # 清理临时文件
    for file in os.listdir(iconset_path):
        os.remove(os.path.join(iconset_path, file))
    os.rmdir(iconset_path)

def convert_app_icon():
    """转换应用图标"""
    print("Converting application icons...")
    
    # 生成高分辨率 PNG
    convert_svg_to_png('assets/icon.svg', 'assets/icon-1024.png', 1024, 1024)
    
    # 生成 Windows ICO
    create_ico('assets/icon-1024.png', 'assets/icon.ico')
    
    # 生成 macOS ICNS
    create_icns('assets/icon-1024.png', 'assets/icon.icns')
    
    # 生成 Linux PNG (512x512)
    convert_svg_to_png('assets/icon.svg', 'assets/icon.png', 512, 512)
    
    # 清理临时文件
    if os.path.exists('assets/icon-1024.png'):
        os.remove('assets/icon-1024.png')
    
    print("Application icons converted successfully!")

def convert_tray_icons():
    """转换托盘图标"""
    print("Converting tray icons...")
    
    # 转换正常状态图标
    convert_svg_to_png('assets/tray-icon.svg', 'assets/tray-icon.png')

    # 转换告警状态图标
    convert_svg_to_png('assets/tray-icon-active.svg', 'assets/tray-icon-active.png')

    # 转换新告警已确认状态图标
    convert_svg_to_png('assets/tray-icon-all-ack.svg', 'assets/tray-icon-all-ack.png')
    
    print("Tray icons converted successfully!")

if __name__ == '__main__':
    # 确保 assets 目录存在
    ensure_dir('assets')
    
    # 转换应用图标
    convert_app_icon()
    
    # 转换托盘图标
    convert_tray_icons()
    
    print("All icons converted successfully!") 