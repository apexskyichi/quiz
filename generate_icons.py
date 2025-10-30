#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
PWA用アイコン生成スクリプト
シンプルな花のアイコンを各サイズで生成
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """
    指定サイズのアイコンを生成
    """
    # 背景色（グラデーションっぽく見せる）
    img = Image.new('RGB', (size, size), '#667eea')
    draw = ImageDraw.Draw(img)
    
    # グラデーション風の背景
    for i in range(size):
        color_value = int(102 + (118 - 102) * (i / size))  # 667eea から 764ba2 へ
        color = f'#{color_value:02x}7eea'
        draw.rectangle([(0, i), (size, i + 1)], fill=color)
    
    # 中央に円を描く（花の中心）
    center = size // 2
    radius = size // 3
    
    # 花びらを描く（5枚）
    petal_color = '#ffffff'
    petal_radius = radius // 2
    
    # 花びらの位置
    import math
    for i in range(5):
        angle = (360 / 5) * i - 90  # -90度から開始（上から）
        x = center + int(petal_radius * 1.5 * math.cos(math.radians(angle)))
        y = center + int(petal_radius * 1.5 * math.sin(math.radians(angle)))
        draw.ellipse(
            [(x - petal_radius, y - petal_radius), 
             (x + petal_radius, y + petal_radius)],
            fill=petal_color
        )
    
    # 中心の円
    center_radius = radius // 3
    draw.ellipse(
        [(center - center_radius, center - center_radius),
         (center + center_radius, center + center_radius)],
        fill='#f093fb'
    )
    
    return img

def generate_all_icons():
    """
    すべてのサイズのアイコンを生成
    """
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    # iconsディレクトリが存在しない場合は作成
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    for size in sizes:
        img = create_icon(size)
        filename = f'icons/icon-{size}x{size}.png'
        img.save(filename, 'PNG')
        print(f'✅ {filename} を生成しました')

if __name__ == '__main__':
    try:
        generate_all_icons()
        print('🎉 すべてのアイコンを生成しました！')
    except ImportError:
        print('⚠️ Pillowライブラリが必要です。以下のコマンドでインストールしてください:')
        print('pip install Pillow')
